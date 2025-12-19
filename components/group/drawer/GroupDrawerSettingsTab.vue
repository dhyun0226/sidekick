<template>
  <div class="space-y-4">
    <!-- Invite Code -->
    <div>
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 uppercase">초대 코드</h3>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
      <div class="flex items-center gap-2 mb-3">
        <div class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg py-2 px-3 text-center font-mono font-bold text-lg text-zinc-800 dark:text-zinc-200 tracking-widest border border-zinc-200 dark:border-zinc-700">
          {{ inviteCode }}
        </div>
        <button @click="emit('copyInviteCode')" class="p-2.5 bg-zinc-900 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors">
          <Copy :size="18" />
        </button>
      </div>
      <button
        @click="emit('copyInviteLink')"
        class="w-full py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
      >
        <Share2 :size="14" />
        초대 링크 공유하기
      </button>
      <button
        v-if="isAdmin"
        @click="emit('regenerateInviteCode')"
        class="w-full py-2.5 mt-2 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw :size="14" />
        초대 코드 재생성 (관리자)
      </button>
      </div>
    </div>

    <!-- Group Management (Admin Only) -->
    <div v-if="isAdmin">
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 uppercase">그룹 관리</h3>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">

      <div class="space-y-3">
        <div>
          <label class="block text-[10px] text-zinc-400 mb-1">그룹 이름 수정</label>
          <div class="flex gap-2">
            <input
              v-model="localGroupName"
              type="text"
              class="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400 transition-colors"
            />
            <button @click="handleSaveGroupName" class="px-3 py-2 bg-zinc-900 dark:bg-zinc-700 text-white rounded-lg text-xs font-bold hover:bg-zinc-700 transition-colors">
              저장
            </button>
          </div>
        </div>

        <button
          @click="emit('openSearchModal')"
          class="w-full py-3 bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 rounded-lg text-sm font-bold hover:bg-lime-100 dark:hover:bg-lime-900/30 transition-colors flex items-center justify-center gap-2 border border-lime-200 dark:border-lime-800/50"
        >
          <Plus :size="16" />
          새 책 시작하기
        </button>
      </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="space-y-2 pt-4">
      <button
        @click="emit('leaveGroup')"
        class="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
      >
        <LogOut :size="16" />
        그룹 나가기
      </button>

      <button
        v-if="isAdmin"
        @click="emit('deleteGroup')"
        class="w-full py-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
      >
        그룹 영구 삭제
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Copy, Share2, Plus, LogOut, RefreshCw } from 'lucide-vue-next'

interface Props {
  inviteCode: string
  groupName: string
  isAdmin: boolean
}

interface Emits {
  (e: 'copyInviteCode'): void
  (e: 'copyInviteLink'): void
  (e: 'regenerateInviteCode'): void
  (e: 'saveGroupName', name: string): void
  (e: 'openSearchModal'): void
  (e: 'leaveGroup'): void
  (e: 'deleteGroup'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localGroupName = ref(props.groupName)

// Watch for external changes to groupName
watch(() => props.groupName, (newName) => {
  localGroupName.value = newName
})

const handleSaveGroupName = () => {
  emit('saveGroupName', localGroupName.value)
}
</script>
