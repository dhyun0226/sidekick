<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-end sm:items-center justify-center px-4" @keydown.esc="close" tabindex="-1">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-[440px] bg-white dark:bg-zinc-900 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-t-3xl sm:rounded-2xl p-6 shadow-apple-lg animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Close Button -->
      <div class="absolute top-4 right-4 z-20">
        <button @click="close" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>

      <!-- Hero Section -->
      <div class="text-center mb-8 pt-4">
        <h2 class="text-xl font-semibold text-zinc-900 dark:text-white mb-2">초대 코드로 입장</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          친구에게 받은 코드를 아래에 입력하세요
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-6">
        <!-- Code Input -->
        <div class="space-y-3">
          <label class="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">초대 코드</label>
          <div class="relative group">
            <input
              v-model="inviteCode"
              type="text"
              placeholder="A1B2C3D4"
              maxlength="20"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-4 py-5 text-center tracking-[0.5em] text-2xl font-black focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 border-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 uppercase shadow-inner"
              @keyup.enter="handleJoin"
              @input="handleInput"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle :size="18" class="text-red-500 mt-0.5 flex-shrink-0" />
          <p class="text-sm text-red-600 dark:text-red-400 font-medium leading-snug">{{ error }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            @click="close"
            class="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            @click="handleJoin"
            :disabled="!canSubmit || loading"
            class="flex-[2] py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-black hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <span v-else>참여하기</span>
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
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { X, AlertCircle, KeyRound } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import UpgradePromptModal from './UpgradePromptModal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'joined'])
const router = useRouter()
const client = useSupabaseClient()
const toast = useToastStore()
const { canJoinGroup } = useSubscription()

watch(() => props.isOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

// Cleanup: restore body scroll when component unmounts
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const inviteCode = ref('')
const loading = ref(false)
const error = ref('')
const upgradePromptOpen = ref(false)
const groupLimitInfo = ref({ allowed: false, currentCount: 0, message: '' })

const canSubmit = computed(() => inviteCode.value.trim().length >= 3 && !loading.value)

const close = () => {
  if (!loading.value) {
    emit('close')
    reset()
  }
}

const reset = () => {
  inviteCode.value = ''
  error.value = ''
  loading.value = false
}

const handleInput = (e: Event) => {
  inviteCode.value = inviteCode.value.toUpperCase()
}

const handleJoin = async () => {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  try {
    const code = inviteCode.value.trim().toUpperCase()
    const { data: groupData, error: findError } = await client
      .from('groups')
      .select('id, name, deleted_at')
      .eq('invite_code', code)
      .maybeSingle()

    if (findError) throw findError
    if (!groupData) {
      error.value = '유효하지 않은 초대 코드입니다. 코드를 다시 확인해주세요.'
      loading.value = false
      return
    }
    // Block joining ended groups
    if (groupData.deleted_at) {
      error.value = '종료된 그룹입니다. 더 이상 참여할 수 없습니다.'
      loading.value = false
      return
    }
    await joinGroup(groupData.id, groupData.name)
  } catch (err: any) {
    error.value = err.message || '오류가 발생했습니다.'
    loading.value = false
  }
}

const joinGroup = async (groupId: string, groupName: string) => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  // 1. 기존 멤버십 정보 확인 (탈퇴 이력 포함)
  const { data: existingMember } = await client
    .from('group_members')
    .select('id, role, left_at')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  // 2. 이미 활성 멤버인 경우
  if (existingMember && !existingMember.left_at) {
    toast.info('이미 가입된 그룹입니다.')
    emit('joined', groupId)
    close()
    return
  }

  // 3. 구독 제한 체크 (새로 가입하거나 재가입할 때 모두 체크)
  const limitCheck = await canJoinGroup()
  if (!limitCheck.allowed) {
    groupLimitInfo.value = limitCheck
    upgradePromptOpen.value = true
    loading.value = false
    return
  }

  try {
    if (existingMember && existingMember.left_at) {
      // 4-A. 재가입: 기존 레코드의 left_at 초기화
      const { error: updateError } = await client
        .from('group_members')
        .update({ left_at: null })
        .eq('id', existingMember.id)
      
      if (updateError) throw updateError
      toast.success(`'${groupName}' 그룹에 다시 참여했습니다! 👋`)
    } else {
      // 4-B. 신규 가입: 새 레코드 삽입
      const { error: joinError } = await client
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'member' })

      if (joinError) throw joinError
      toast.success(`'${groupName}' 그룹에 참여했습니다! 🎉`)
    }

    emit('joined', groupId)
    close()
  } catch (err: any) {
    console.error('Join group failed:', err)
    error.value = '그룹 가입에 실패했습니다.'
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: animate-in 0.3s ease-out; }
</style>