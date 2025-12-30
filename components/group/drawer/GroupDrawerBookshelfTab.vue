<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between px-1 h-4" :class="showSearch ? 'mb-2' : 'mb-3'">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-zinc-500 uppercase leading-none">책장</h3>
        <!-- Sort Button -->
        <div class="relative flex items-center">
          <button
            @click.stop="showSortMenu = !showSortMenu"
            class="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-zinc-400 leading-none"
            title="정렬"
          >
            <ArrowUpDown :size="12" class="block" />
          </button>
          <!-- Sort Dropdown (먼저 렌더링) -->
          <div v-if="showSortMenu" class="absolute left-0 top-6 min-w-[180px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-[301] overflow-visible" @click.stop>
            <button
              v-for="option in sortOptions"
              :key="option.value"
              @click.stop="selectSort(option.value)"
              class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between"
              :class="sortBy === option.value
                ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-500 font-medium'
                : 'text-zinc-700 dark:text-zinc-300'"
            >
              <span>{{ option.label }}</span>
              <Check v-if="sortBy === option.value" :size="12" />
            </button>
          </div>
          <!-- Backdrop (나중 렌더링) -->
          <div v-if="showSortMenu" class="fixed inset-0 z-[300]" @click.stop="showSortMenu = false"></div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[10px] text-zinc-400 leading-none">총 {{ filteredAndSortedBooks.length }}권</span>
        <!-- Search Toggle -->
        <button
          @click="showSearch = !showSearch"
          class="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-zinc-400 leading-none"
          :class="{ 'text-lime-500': showSearch || searchQuery }"
          title="검색"
        >
          <Search :size="12" class="block" />
        </button>
      </div>
    </div>

    <!-- Search Input (Expandable) -->
    <div v-if="showSearch" class="px-1 mb-3 animate-fade-in">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="제목, 저자로 검색..."
        class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400"
        autofocus
      />
    </div>

    <!-- Books List (Visible) -->
    <div v-if="filteredAndSortedBooks.length > 0" class="space-y-2">
      <div
        v-for="book in filteredAndSortedBooks"
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
                  <Calendar :size="12" /> 완주 날짜 수정
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
              <span class="text-lime-600 dark:text-lime-400 font-medium">{{ book.date }} 완주</span>
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

    <!-- Locked Books Section -->
    <div v-if="lockedHistoryBooks.length > 0" class="space-y-2 mt-4">
      <!-- Locked Section Header -->
      <div class="flex items-center gap-2 px-1 mb-2">
        <Lock :size="12" class="text-zinc-400" />
        <h4 class="text-xs font-bold text-zinc-500 uppercase">잠긴 책 ({{ lockedHistoryBooks.length }}권)</h4>
      </div>

      <!-- Locked Books List -->
      <div
        v-for="book in lockedHistoryBooks"
        :key="'locked-' + book.id"
        @click="emit('openUpgradeModal')"
        class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 border-dashed relative overflow-hidden cursor-pointer hover:border-lime-400 dark:hover:border-lime-500 transition-all group"
      >
        <!-- Locked Book Info -->
        <div class="p-3 flex gap-3 relative opacity-60 group-hover:opacity-70 transition-opacity">
          <!-- Blurred Cover with Lock -->
          <div class="relative flex-shrink-0">
            <img
              :src="book.cover_url"
              :alt="book.title"
              class="w-14 h-20 object-cover rounded shadow-sm bg-zinc-200 dark:bg-zinc-800 blur-sm"
              @error="(e) => (e.target as HTMLImageElement).src = '/placeholder-book.png'"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Lock :size="16" class="text-white" />
              </div>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 mb-1">{{ book.title }}</h4>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{{ book.author }}</p>
            <div class="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-2">
              <span v-if="book.publisher">{{ book.publisher }}</span>
              <span v-if="book.publisher && book.total_pages">·</span>
              <span v-if="book.total_pages">{{ book.total_pages }}p</span>
            </div>
          </div>
        </div>

        <!-- Locked Message -->
        <div class="border-t border-zinc-200 dark:border-zinc-700 bg-lime-50 dark:bg-lime-900/20 px-3 py-2.5">
          <div class="flex items-center justify-center gap-2 text-xs font-medium text-lime-700 dark:text-lime-400">
            <Lock :size="14" />
            <span>프리미엄으로 업그레이드하여 잠금 해제</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAndSortedBooks.length === 0" class="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <div class="text-4xl mb-3">{{ searchQuery ? '🔍' : '📚' }}</div>
      <p>{{ searchQuery ? '검색 결과가 없습니다' : '아직 완주한 책이 없습니다' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { MessageCircle, Star, MoreVertical, RotateCcw, Calendar, Trash2, Edit3, ArrowUpDown, Search, Check, Lock } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

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
  lockedHistoryBooks: HistoryBook[]
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
  (e: 'openUpgradeModal'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeBookMenu = ref<string | null>(null)
const showSortMenu = ref(false)
const showSearch = ref(false)
const searchQuery = ref('')
const sortBy = ref<'date-desc' | 'date-asc' | 'title' | 'author'>('date-desc')

const sortOptions = [
  { value: 'date-desc', label: '최신순' },
  { value: 'date-asc', label: '오래된순' },
  { value: 'title', label: '제목순' },
  { value: 'author', label: '저자순' }
] as const

// Filtered and sorted books (computed로 복원)
const filteredAndSortedBooks = computed(() => {
  let books = [...props.historyBooks]

  // 1. Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    books = books.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    )
  }

  // 2. Sort
  books.sort((a, b) => {
    switch (sortBy.value) {
      case 'date-desc':
        // 최신순: YYYY.MM.DD 형식은 문자열 비교로 정렬 가능
        return b.date.localeCompare(a.date)
      case 'date-asc':
        // 오래된순
        return a.date.localeCompare(b.date)
      case 'title':
        return a.title.localeCompare(b.title, 'ko')
      case 'author':
        return a.author.localeCompare(b.author, 'ko')
      default:
        return 0
    }
  })

  return books
})

const toast = useToastStore()

const selectSort = (value: typeof sortBy.value) => {
  sortBy.value = value
  showSortMenu.value = false
}

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

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
