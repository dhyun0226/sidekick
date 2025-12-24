<template>
  <div v-if="isOpen" class="fixed inset-0 z-[50] flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scale-up">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white">새 그룹 만들기</h2>
        <button @click="close" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-5">
        <!-- Group Name Input -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">그룹 이름 *</label>
          <input
            v-model="groupName"
            type="text"
            placeholder="예: 판교 직장인 독서클럽"
            maxlength="50"
            class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all placeholder-zinc-600 dark:placeholder-zinc-500"
            @keyup.enter="handleCreate"
          />
          <div class="flex justify-between items-center text-xs">
            <span class="text-zinc-600">그룹명은 나중에 수정할 수 있어요</span>
            <span class="text-zinc-600 dark:text-zinc-500">{{ groupName.length }}/50</span>
          </div>
        </div>

        <!-- Info Box -->
        <div class="bg-lime-400/10 border border-lime-400/30 rounded-xl p-4">
          <div class="flex gap-3">
            <div class="flex-shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-lime-400">그룹 생성 안내</p>
              <p class="text-xs text-zinc-600 dark:text-zinc-400">
                그룹을 만들면 자동으로 <strong class="text-zinc-900 dark:text-white">초대 코드</strong>가 생성됩니다.
                초대 코드를 공유하여 친구들을 초대하세요!
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            @click="close"
            class="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            취소
          </button>
          <button
            @click="handleCreate"
            :disabled="!canSubmit || loading"
            class="flex-1 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <span v-else>생성하기</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upgrade Prompt Modal -->
    <UpgradePromptModal
      :isOpen="upgradePromptOpen"
      feature="groups"
      :currentCount="groupLimitInfo.currentCount"
      @close="upgradePromptOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import UpgradePromptModal from './UpgradePromptModal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'created'])

const client = useSupabaseClient()
const user = useSupabaseUser()
const { canCreateGroup } = useSubscription()

const groupName = ref('')
const loading = ref(false)
const error = ref('')
const upgradePromptOpen = ref(false)
const groupLimitInfo = ref({ allowed: false, currentCount: 0, message: '' })

const canSubmit = computed(() =>
  groupName.value.trim().length >= 2 &&
  groupName.value.trim().length <= 50 &&
  !loading.value
)

const close = () => {
  if (!loading.value) {
    emit('close')
    reset()
  }
}

const reset = () => {
  groupName.value = ''
  error.value = ''
  loading.value = false
}

const handleCreate = async () => {
  if (!canSubmit.value) return

  // 1. 그룹 생성 제한 체크 (구독 tier 기반)
  const limitCheck = await canCreateGroup()

  if (!limitCheck.allowed) {
    groupLimitInfo.value = limitCheck
    upgradePromptOpen.value = true
    return // 그룹 생성 중단
  }

  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  loading.value = true
  error.value = ''

  try {
    console.log('[CreateGroup] Creating group:', groupName.value)

    // 1. 그룹 생성 (invite_code는 DB 기본값으로 자동 생성)
    const { data: newGroup, error: groupError } = await client
      .from('groups')
      .insert({
        name: groupName.value.trim(),
        created_by: currentUser.id
      })
      .select()
      .single()

    if (groupError) {
      console.error('[CreateGroup] Group creation error:', groupError)
      throw new Error('그룹 생성에 실패했습니다.')
    }

    console.log('[CreateGroup] Group created:', newGroup)

    // 2. 생성자를 admin으로 자동 추가
    const { error: memberError } = await client
      .from('group_members')
      .insert({
        group_id: newGroup.id,
        user_id: currentUser.id,
        role: 'admin'
      })

    if (memberError) {
      console.error('[CreateGroup] Member insert error:', memberError)
      // 그룹은 생성되었지만 멤버 추가 실패 → 일단 계속 진행
      console.warn('[CreateGroup] Group created but member insert failed')
    }

    console.log('[CreateGroup] Creator added as admin')

    // 3. 성공 - 모달 닫고 상위 컴포넌트에 알림
    emit('created', newGroup)
    close()

  } catch (err: any) {
    console.error('[CreateGroup] Error:', err)
    error.value = err.message || '그룹 생성 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes scale-up {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-up {
  animation: scale-up 0.2s ease-out;
}
</style>
