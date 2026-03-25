<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 pt-safe pb-safe bg-gray-50 dark:bg-[#09090b] relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-lime-400/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-sm space-y-8 relative z-10 text-center">
      <!-- Loading State -->
      <div v-if="loading" class="text-zinc-600 dark:text-zinc-500">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-400/20 animate-pulse mb-4">
          <div class="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p>초대 정보를 불러오는 중...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="space-y-4">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-4">
          <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-red-400">{{ error }}</h1>
        <button
          @click="$router.push('/')"
          class="mt-4 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>

      <!-- Success State -->
      <div v-else-if="group" class="space-y-6">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-xl">
          <span class="text-4xl">📚</span>
        </div>

        <div>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{{ group.name }}</h1>
          <p class="text-zinc-600 dark:text-zinc-400">그룹에 초대되셨습니다!</p>
        </div>

        <div class="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-300 dark:border-zinc-700">
          <div class="flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <Users :size="16" />
            <span>멤버 {{ membersCount }}명</span>
          </div>
        </div>

        <button
          @click="joinGroup"
          class="w-full py-4 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20"
          :disabled="joining"
        >
          <span v-if="joining" class="flex items-center justify-center gap-2">
            <div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            참여 중...
          </span>
          <span v-else>그룹 참여하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Users } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()
const toast = useToastStore()
const { canJoinGroup } = useSubscription()

const code = route.params.code as string

const loading = ref(true)
const joining = ref(false)
const error = ref('')
const group = ref<any>(null)
const membersCount = ref(0)

onMounted(async () => {
  if (!code) {
    error.value = '초대 코드가 없습니다.'
    loading.value = false
    return
  }

  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    router.push('/login')
    return
  }

  try {
    // DB stores codes in UPPERCASE, so normalize the input
    const normalizedCode = code.toUpperCase()

    // 1. 초대 코드로 그룹 찾기
    const { data: groupData, error: groupError } = await client
      .from('groups')
      .select('*')
      .eq('invite_code', normalizedCode)
      .single()

    if (groupError || !groupData) {
      error.value = '유효하지 않은 초대 코드입니다.'
      loading.value = false
      return
    }

    group.value = groupData

    // 2. 멤버 수 조회
    const { count } = await client
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupData.id)

    membersCount.value = count || 0

    // 3. 이미 멤버인지 확인
    const { data: existingMember } = await client
      .from('group_members')
      .select('*')
      .eq('group_id', groupData.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      router.push(`/group/${groupData.id}`)
      return
    }

    loading.value = false

  } catch (err: any) {
    console.error('[Join] Error:', err)
    error.value = '초대 정보를 불러오는 중 오류가 발생했습니다.'
    loading.value = false
  }
})

const joinGroup = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!group.value || !user) return

  joining.value = true

  try {
    // 구독 제한 체크
    const limitCheck = await canJoinGroup()
    if (!limitCheck.allowed) {
      toast.error(limitCheck.message)
      joining.value = false
      return
    }

    // 그룹에 멤버로 추가
    const { error: joinError } = await client
      .from('group_members')
      .insert({
        group_id: group.value.id,
        user_id: user.id,
        role: 'member'
      })

    if (joinError) {
      throw new Error('그룹 참여에 실패했습니다.')
    }

    // 그룹 페이지로 이동
    router.push(`/group/${group.value.id}`)

  } catch (err: any) {
    console.error('[Join] Error:', err)
    toast.error(err.message || '그룹 참여 중 오류가 발생했습니다')
  } finally {
    joining.value = false
  }
}
</script>
