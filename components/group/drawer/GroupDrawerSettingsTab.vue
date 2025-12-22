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
        초대 코드 재생성
      </button>
      </div>
    </div>

    <!-- Group Management (Admin Only) -->
    <div v-if="isAdmin">
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 uppercase">그룹 관리</h3>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">

      <div class="flex items-center gap-2 mb-3">
        <input
          v-model="localGroupName"
          type="text"
          placeholder="그룹 이름"
          class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all"
        />
        <button @click="handleSaveGroupName" class="p-2.5 bg-zinc-900 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors">
          <Save :size="18" />
        </button>
      </div>
      <button
        @click="emit('openSearchModal')"
        class="w-full py-2.5 border border-lime-300 dark:border-lime-700 text-lime-600 dark:text-lime-400 rounded-lg text-xs font-bold hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus :size="14" />
        새 책 시작하기
      </button>
      <button
        @click="emit('deleteGroup')"
        class="w-full py-2.5 mt-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Trash2 :size="14" />
        그룹 영구 삭제
      </button>
      </div>
    </div>

    <!-- Leave Group -->
    <button
      @click="emit('leaveGroup')"
      class="w-full py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
    >
      <LogOut :size="14" />
      그룹 나가기
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Copy, Share2, Plus, LogOut, RefreshCw, Save, Trash2 } from 'lucide-vue-next'

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
