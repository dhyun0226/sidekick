<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between px-1">
      <h3 class="text-xs font-bold text-zinc-500 uppercase">책장</h3>
      <span class="text-[10px] text-zinc-400">총 {{ historyBooks.length }}권 완독</span>
    </div>

    <!-- Books List -->
    <div v-if="historyBooks.length > 0" class="space-y-2">
      <div
        v-for="book in historyBooks"
        :key="book.id"
        class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all hover:border-lime-300 dark:hover:border-lime-600 relative"
        :class="activeBookMenu === book.id ? 'z-[250] overflow-visible' : 'overflow-hidden'"
      >
        <!-- Book Info -->
        <div class="p-3 flex gap-3 relative">
          <!-- Settings Menu -->
          <div class="absolute top-3 right-3 z-20">
            <button @click.stop="toggleBookMenu(book.id)" class="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors">
              <MoreVertical :size="14" class="text-zinc-400" />
            </button>
            <div v-if="activeBookMenu === book.id" class="absolute right-0 top-6 min-w-[160px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-[201] overflow-visible" @click.stop>
              <!-- Review (All Users) -->
              <button @click.stop="handleReview(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                <Edit3 :size="12" /> {{ props.userReviewedBooks.has(book.id) ? '리뷰 수정' : '리뷰 작성' }}
              </button>
              <!-- Admin Only -->
              <template v-if="isAdmin">
                <button @click.stop="handleRestartReading(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  <RotateCcw :size="12" /> 다시 읽기
                </button>
                <button @click.stop="handleEditFinishedDate(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  <Calendar :size="12" /> 완독 날짜 수정
                </button>
                <button @click.stop="handleDeleteHistoryBook(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700/50 whitespace-nowrap">
                  <Trash2 :size="12" /> 책 삭제
                </button>
              </template>
            </div>
            <div v-if="activeBookMenu === book.id" class="fixed inset-0 z-[200]" @click.stop="activeBookMenu = null"></div>
          </div>

          <img
            :src="book.cover_url"
            :alt="book.title"
            class="w-14 h-20 object-cover rounded shadow-sm bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"
            @error="(e) => (e.target as HTMLImageElement).src = '/placeholder-book.png'"
          />
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 mb-1 pr-6">{{ book.title }}</h4>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{{ book.author }}</p>
            <div class="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-2">
              <span v-if="book.publisher">{{ book.publisher }}</span>
              <span v-if="book.publisher && book.total_pages">·</span>
              <span v-if="book.total_pages">{{ book.total_pages }}p</span>
            </div>
            <div class="flex items-center gap-2 text-[10px]">
              <span class="text-lime-600 dark:text-lime-400 font-medium">{{ book.date }} 완독</span>
              <span v-if="book.round && book.round > 1" class="text-zinc-400">· {{ book.round }}회차</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex border-t border-zinc-100 dark:border-zinc-800">
          <button
            @click="emit('selectBook', book.id)"
            class="flex-1 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageCircle :size="14" />
            타임라인
          </button>
          <div class="w-px bg-zinc-100 dark:bg-zinc-800"></div>
          <button
            @click="emit('openReviews', book.id)"
            class="flex-1 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
            :disabled="!book.reviewCount"
          >
            <Star :size="14" />
            리뷰 {{ book.reviewCount || 0 }}개
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <div class="text-4xl mb-3">📚</div>
      <p>아직 완독한 책이 없습니다</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MessageCircle, Star, MoreVertical, RotateCcw, Calendar, Trash2, Edit3 } from 'lucide-vue-next'

interface HistoryBook {
  id: string
  isbn: string
  title: string
  author: string
  cover_url: string
  publisher?: string
  total_pages?: number
  date: string
  round?: number
  reviewCount?: number
}

interface Props {
  historyBooks: HistoryBook[]
  isAdmin: boolean
  userReviewedBooks: Set<string>
}

interface Emits {
  (e: 'selectBook', bookId: string): void
  (e: 'openReviews', bookId: string): void
  (e: 'restartReading', bookId: string): void
  (e: 'editFinishedDate', bookId: string): void
  (e: 'deleteHistoryBook', bookId: string): void
  (e: 'openReview', bookId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeBookMenu = ref<string | null>(null)

const toggleBookMenu = (bookId: string) => {
  activeBookMenu.value = activeBookMenu.value === bookId ? null : bookId
}

const handleRestartReading = (bookId: string) => {
  activeBookMenu.value = null
  emit('restartReading', bookId)
}

const handleEditFinishedDate = (bookId: string) => {
  activeBookMenu.value = null
  emit('editFinishedDate', bookId)
}

const handleDeleteHistoryBook = (bookId: string) => {
  activeBookMenu.value = null
  emit('deleteHistoryBook', bookId)
}

const handleReview = (bookId: string) => {
  activeBookMenu.value = null
  emit('openReview', bookId)
}
</script>
