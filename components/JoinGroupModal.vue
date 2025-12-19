<template>
  <div v-if="isOpen" class="fixed inset-0 z-[50] flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scale-up">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white">초대 코드로 참여</h2>
        <button @click="close" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-5">
        <!-- Code Input -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">초대 코드</label>
          <input
            v-model="inviteCode"
            type="text"
            placeholder="예: a1b2c3d4"
            maxlength="20"
            class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all placeholder-zinc-400 dark:placeholder-zinc-600 uppercase"
            @keyup.enter="handleJoin"
            @input="handleInput"
          />
          <p class="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            친구에게 전달받은 초대 코드를 입력해주세요
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle :size="16" class="text-red-400 mt-0.5 flex-shrink-0" />
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
            @click="handleJoin"
            :disabled="!canSubmit || loading"
            class="flex-1 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <span v-else>입장하기</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { X, AlertCircle } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'joined'])
const router = useRouter()
const client = useSupabaseClient()
const toast = useToastStore()

const inviteCode = ref('')
const loading = ref(false)
const error = ref('')

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
  // Convert to uppercase automatically
  inviteCode.value = inviteCode.value.toUpperCase()
}

const handleJoin = async () => {
  if (!canSubmit.value) return

  loading.value = true
  error.value = ''

  try {
    const code = inviteCode.value.trim().toLowerCase() // DB stores codes in lowercase usually? Let's check schema. Schema says default substr(md5...) so likely lowercase hex.
    // Actually, schema uses `substr(md5(random()::text), 0, 7)`. md5 is hex (0-9, a-f). 
    
    // 1. Find group by code
    // We need to match case-insensitively or ensure we use the right case. 
    // Let's assume the code in DB is lowercase/mixed but user might type whatever.
    // Ideally we should use .ilike() but `invite_code` is unique constraint, usually exact match.
    // Let's try exact match with lowercase first (since md5 is hex).
    
    const { data: groupData, error: findError } = await client
      .from('groups')
      .select('id, name')
      .eq('invite_code', code)
      .maybeSingle()

    if (findError) throw findError
    
    if (!groupData) {
      // Try again without lowercase conversion just in case
       const { data: groupData2, error: findError2 } = await client
        .from('groups')
        .select('id, name')
        .eq('invite_code', inviteCode.value.trim()) // Try exact input
        .maybeSingle()
        
       if (!groupData2) {
         error.value = '유효하지 않은 초대 코드입니다.'
         loading.value = false
         return
       }
       // Found with exact input
       await joinGroup(groupData2.id, groupData2.name)
       return
    }

    // Found with lowercase
    await joinGroup(groupData.id, groupData.name)

  } catch (err: any) {
    console.error('[JoinModal] Error:', err)
    error.value = err.message || '오류가 발생했습니다.'
    loading.value = false
  }
}

const joinGroup = async (groupId: string, groupName: string) => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  // Check membership
  const { data: existingMember } = await client
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    toast.info('이미 가입된 그룹입니다.')
    emit('joined', groupId)
    close()
    return
  }

  // Join
  const { error: joinError } = await client
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member'
    })

  if (joinError) {
    throw joinError
  }

  toast.success(`'${groupName}' 그룹에 참여했습니다! 🎉`)
  emit('joined', groupId)
  close()
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
