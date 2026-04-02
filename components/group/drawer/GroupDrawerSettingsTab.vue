<template>
  <div class="space-y-4">
    <!-- Invite Code -->
    <div v-if="!isArchived">
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">초대 코드</h3>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <div class="flex items-center gap-2 mb-3">
        <div class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl py-2 px-3 text-center font-semibold text-lg text-zinc-800 dark:text-zinc-200 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          {{ inviteCode }}
        </div>
        <button @click="emit('copyInviteCode')" class="p-2.5 bg-zinc-900 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors">
          <Copy :size="18" />
        </button>
      </div>
      <button
        @click="emit('copyInviteLink')"
        class="w-full py-2.5 ring-1 ring-black/[0.04] dark:ring-white/[0.06] text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
      >
        <Share2 :size="14" />
        초대 링크 공유하기
      </button>
      <button
        v-if="isAdmin"
        @click="emit('regenerateInviteCode')"
        class="w-full py-2.5 mt-2 ring-1 ring-amber-300/60 dark:ring-amber-700/60 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw :size="14" />
        초대 코드 재생성
      </button>
      </div>
    </div>

    <!-- Group Management (Admin Only) -->
    <div v-if="isAdmin">
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">그룹 관리</h3>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-2xl p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">

      <div class="flex items-center gap-2 mb-3">
        <input
          v-model="localGroupName"
          type="text"
          placeholder="그룹 이름"
          :disabled="isArchived"
          class="flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-800 dark:text-zinc-200 ring-1 ring-black/[0.04] dark:ring-white/[0.06] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button v-if="!isArchived" @click="handleSaveGroupName" class="flex-shrink-0 p-2.5 bg-zinc-900 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors">
          <Save :size="18" />
        </button>
      </div>
      <button
        v-if="!isArchived"
        @click="emit('openSearchModal')"
        class="w-full py-2.5 ring-1 ring-lime-300/60 dark:ring-lime-700/60 text-lime-600 dark:text-lime-400 rounded-xl text-xs font-semibold hover:bg-lime-50 dark:hover:bg-lime-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus :size="14" />
        새 책 시작하기
      </button>
      <button
        v-if="!isArchived"
        @click="emit('deleteGroup')"
        class="w-full py-2.5 mt-2 ring-1 ring-red-300/60 dark:ring-red-700/60 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <Trash2 :size="14" />
        그룹 종료 (아카이브)
      </button>
      </div>
    </div>

    <!-- Leave Group -->
    <button
      v-if="!isArchived"
      @click="emit('leaveGroup')"
      class="w-full py-2.5 ring-1 ring-red-300/60 dark:ring-red-700/60 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
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
  isArchived: boolean
  isPaused?: boolean
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
