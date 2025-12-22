<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Drawer Content -->
    <div class="relative w-[85%] max-w-[360px] h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl animate-slide-left">

      <!-- Drawer Header -->
      <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white truncate pr-2">{{ groupName }}</h2>
        <button @click="emit('close')" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          @click="activeTab = 'info'"
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="activeTab === 'info' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          정보
          <div v-if="activeTab === 'info'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-4"></div>
        </button>
        <button
          @click="activeTab = 'members'"
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="activeTab === 'members' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          멤버
          <div v-if="activeTab === 'members'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-4"></div>
        </button>
        <button
          @click="activeTab = 'bookshelf'"
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="activeTab === 'bookshelf' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          책장
          <div v-if="activeTab === 'bookshelf'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-4"></div>
        </button>
        <button
          @click="activeTab = 'settings'"
          class="flex-1 py-3 text-sm font-medium transition-colors relative"
          :class="activeTab === 'settings' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          설정
          <div v-if="activeTab === 'settings'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-4"></div>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto overflow-x-visible p-4 bg-zinc-50 dark:bg-[#09090b]">
        <GroupDrawerInfoTab
          v-if="activeTab === 'info'"
          :current-book="currentBook"
          :selected-book-id="selectedBookId"
          :toc="toc"
          :reading-books="readingBooks"
          :view-progress="viewProgress"
          :is-admin="isAdmin"
          @select-book="(id) => emit('selectBook', id)"
          @jump-to-chapter="(start) => emit('jumpToChapter', start)"
          @edit-dates="(bookId) => emit('editDates', bookId)"
          @edit-toc="(bookId) => emit('editToc', bookId)"
          @mark-completed="(bookId) => emit('markCompleted', bookId)"
          @delete-book="(bookId) => emit('deleteBook', bookId)"
        />

        <GroupDrawerMembersTab
          v-if="activeTab === 'members'"
          :sorted-members-with-progress="sortedMembersWithProgress"
          :is-admin="isAdmin"
          :current-user-id="currentUserId"
          @change-member-role="(member) => emit('changeMemberRole', member)"
          @kick-member="(member) => emit('kickMember', member)"
        />

        <GroupDrawerBookshelfTab
          v-if="activeTab === 'bookshelf'"
          :history-books="historyBooks"
          :is-admin="isAdmin"
          @select-book="(id) => emit('selectBook', id)"
          @open-reviews="(bookId) => emit('openReviews', bookId)"
          @restart-reading="(bookId) => emit('restartReading', bookId)"
          @edit-finished-date="(bookId) => emit('editFinishedDate', bookId)"
          @delete-history-book="(bookId) => emit('deleteHistoryBook', bookId)"
        />

        <GroupDrawerSettingsTab
          v-if="activeTab === 'settings'"
          :invite-code="inviteCode"
          :group-name="groupName"
          :is-admin="isAdmin"
          @copy-invite-code="emit('copyInviteCode')"
          @copy-invite-link="emit('copyInviteLink')"
          @regenerate-invite-code="emit('regenerateInviteCode')"
          @save-group-name="(name) => emit('saveGroupName', name)"
          @open-search-modal="emit('openSearchModal')"
          @leave-group="emit('leaveGroup')"
          @delete-group="emit('deleteGroup')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import GroupDrawerInfoTab from './GroupDrawerInfoTab.vue'
import GroupDrawerMembersTab from './GroupDrawerMembersTab.vue'
import GroupDrawerBookshelfTab from './GroupDrawerBookshelfTab.vue'
import GroupDrawerSettingsTab from './GroupDrawerSettingsTab.vue'

interface Props {
  isOpen: boolean
  groupName: string
  currentBook: any | null
  selectedBookId: string | null
  readingBooks: any[]
  historyBooks: any[]
  sortedMembersWithProgress: any[]
  isAdmin: boolean
  currentUserId: string | null
  inviteCode: string
  toc: any[]
  viewProgress: number
}

interface Emits {
  (e: 'close'): void
  (e: 'selectBook', bookId: string): void
  (e: 'jumpToChapter', startPct: number): void
  (e: 'editDates', bookId: string): void
  (e: 'editToc', bookId: string): void
  (e: 'markCompleted', bookId: string): void
  (e: 'deleteBook', bookId: string): void
  (e: 'openReviews', bookId: string): void
  (e: 'restartReading', bookId: string): void
  (e: 'editFinishedDate', bookId: string): void
  (e: 'deleteHistoryBook', bookId: string): void
  (e: 'copyInviteCode'): void
  (e: 'copyInviteLink'): void
  (e: 'regenerateInviteCode'): void
  (e: 'saveGroupName', name: string): void
  (e: 'openSearchModal'): void
  (e: 'leaveGroup'): void
  (e: 'deleteGroup'): void
  (e: 'changeMemberRole', member: any): void
  (e: 'kickMember', member: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref<'info' | 'members' | 'bookshelf' | 'settings'>('info')

// Prevent body scroll when drawer is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Cleanup: restore body scroll when component unmounts
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
@keyframes slide-left {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.animate-slide-left {
  animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
