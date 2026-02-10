<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999] flex justify-end">
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

      <!-- Tabs (멤버 탭 없음) -->
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
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-zinc-50 dark:bg-[#09090b]">
        <MyLibraryInfoTab
          v-if="activeTab === 'info'"
          :current-book="currentBook"
          :selected-book-id="selectedBookId"
          :toc="toc"
          :reading-books="readingBooks"
          :view-progress="viewProgress"
          :is-admin="true"
          :is-archived="isArchived"
          :user-reviewed-books="userReviewedBooks"
          @select-book="(id) => emit('selectBook', id)"
          @jump-to-chapter="(start) => emit('jumpToChapter', start)"
          @edit-dates="(bookId) => emit('editDates', bookId)"
          @edit-toc="(bookId) => emit('editToc', bookId)"
          @edit-genre="(bookId) => emit('editGenre', bookId)"
          @mark-finished="(bookId) => emit('markFinished', bookId)"
          @unmark-finished="(bookId) => emit('unmarkFinished', bookId)"
          @delete-book="(bookId) => emit('deleteBook', bookId)"
          @open-review="(bookId) => emit('openReview', bookId)"
          @open-upgrade-modal="emit('openUpgradeModal')"
        />

        <MyLibraryBookshelfTab
          v-if="activeTab === 'bookshelf'"
          :history-books="historyBooks"
          :is-admin="true"
          :is-archived="isArchived"
          :user-reviewed-books="userReviewedBooks"
          @select-book="(id) => emit('selectBook', id)"
          @open-reviews="(bookId) => emit('openReviews', bookId)"
          @edit-finished-date="(bookId) => emit('editFinishedDate', bookId)"
          @edit-genre="(bookId) => emit('editGenre', bookId)"
          @delete-history-book="(bookId) => emit('deleteHistoryBook', bookId)"
          @open-review="(bookId) => emit('openReview', bookId)"
          @mark-finished="(bookId) => emit('markFinished', bookId)"
          @unmark-finished="(bookId) => emit('unmarkFinished', bookId)"
          @open-upgrade-modal="emit('openUpgradeModal')"
        />

        <MyLibrarySettingsTab
          v-if="activeTab === 'settings'"
          :group-name="groupName"
          :is-archived="isArchived"
          @save-group-name="(name) => emit('saveGroupName', name)"
          @open-search-modal="emit('openSearchModal')"
          @delete-group="emit('deleteGroup')"
        />
      </div>

      <!-- FAB: 새 책 추가 버튼 -->
      <button
        v-if="activeTab === 'info' && !isArchived"
        @click="emit('openSearchModal')"
        class="absolute bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95 z-10"
        title="새 책 추가"
      >
        <Plus :size="24" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { X, Plus } from 'lucide-vue-next'
import MyLibraryInfoTab from '~/components/my-library/MyLibraryInfoTab.vue'
import MyLibraryBookshelfTab from '~/components/my-library/MyLibraryBookshelfTab.vue'
import MyLibrarySettingsTab from '~/components/my-library/MyLibrarySettingsTab.vue'

interface Props {
  isOpen: boolean
  groupName: string
  currentBook: any | null
  selectedBookId: string | null
  readingBooks: any[]
  historyBooks: any[]
  isArchived: boolean
  toc: any[]
  viewProgress: number
  userReviewedBooks: Map<string, number>
}

interface Emits {
  (e: 'close'): void
  (e: 'selectBook', bookId: string): void
  (e: 'jumpToChapter', startPct: number): void
  (e: 'editDates', bookId: string): void
  (e: 'editToc', bookId: string): void
  (e: 'editGenre', bookId: string): void
  (e: 'markFinished', bookId: string): void
  (e: 'unmarkFinished', bookId: string): void
  (e: 'deleteBook', bookId: string): void
  (e: 'openReviews', bookId: string): void
  (e: 'editFinishedDate', bookId: string): void
  (e: 'deleteHistoryBook', bookId: string): void
  (e: 'openReview', bookId: string): void
  (e: 'saveGroupName', name: string): void
  (e: 'openSearchModal'): void
  (e: 'openUpgradeModal'): void
  (e: 'deleteGroup'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref<'info' | 'bookshelf' | 'settings'>('info')

// Prevent body scroll when drawer is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    // Always default to 'info' tab when opened
    activeTab.value = 'info'
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
