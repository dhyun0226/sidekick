<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between px-1 h-4" :class="showSearch ? 'mb-2' : 'mb-3'">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">책장</h3>
        <!-- Sort Dropdown (Common Component) -->
        <DropdownMenu
          :is-open="showSortMenu"
          align="left"
          @toggle="showSortMenu = !showSortMenu"
          @close="showSortMenu = false"
        >
          <template #icon>
            <ArrowUpDown :size="12" class="text-zinc-400 hover:text-zinc-600 transition-colors" />
          </template>
          
          <button
            v-for="option in sortOptions"
            :key="option.value"
            @click.stop="selectSort(option.value)"
            class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between transition-colors"
            :class="sortBy === option.value
              ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-500 font-bold'
              : 'text-zinc-700 dark:text-zinc-300'"
          >
            <span>{{ option.label }}</span>
            <Check v-if="sortBy === option.value" :size="12" />
          </button>
        </DropdownMenu>
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
          <!-- Settings Menu (Common Component) -->
          <div v-if="!isArchived && !isReadOnlyMode" class="absolute top-3 right-3 z-20">
            <DropdownMenu
              :is-open="activeBookMenu === book.id"
              @toggle="toggleBookMenu(book.id)"
              @close="activeBookMenu = null"
            >
              <!-- All Users -->
              <button @click="handleReview(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                <Edit3 :size="12" /> {{ props.userReviewedBooks.has(book.id) ? '리뷰 수정' : '리뷰 작성' }}
              </button>
              <button v-if="!book.user_finished_at" @click="handleMarkFinished(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                <Check :size="12" /> 완독 처리
              </button>
              <button v-else @click="handleUnmarkFinished(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                <X :size="12" /> 완독 취소
              </button>
              <!-- Admin Only -->
              <template v-if="isAdmin">
                <button @click.stop="handleRestartReading(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap border-t border-zinc-100 dark:border-zinc-700/50 font-bold">
                  <RotateCcw :size="12" /> 완주 취소
                </button>
                <button @click.stop="handleEditFinishedDate(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                  <Calendar :size="12" /> 완주 날짜 수정
                </button>
                <button @click.stop="handleDeleteHistoryBook(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700/50 whitespace-nowrap font-bold">
                  <Trash2 :size="12" /> 책 삭제
                </button>
              </template>
            </DropdownMenu>
          </div>

          <img
            :src="book.cover_url"
            :alt="book.title"
            class="w-14 h-20 object-cover shadow-sm bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"
            @error="(e) => (e.target as HTMLImageElement).src = '/placeholder-book.png'"
          />
          <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h4 class="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1 pr-6">{{ book.title }}</h4>
              <div class="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span class="truncate max-w-[80px]">{{ book.author }}</span>
                <template v-if="book.publisher || book.total_pages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="book.publisher" class="truncate max-w-[60px]">{{ book.publisher }}</span>
                  <span v-if="book.publisher && book.total_pages">·</span>
                  <span v-if="book.total_pages">{{ book.total_pages }}p</span>
                </template>
              </div>
            </div>

            <!-- Badges Line -->
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <GenreBadge v-if="book.genre" :genre="book.genre" size="sm" />
              <RatingBadge :rating="book.averageRating" size="sm" />
              <Badge v-if="formatDateYY(book.date)" variant="lime" size="sm">
                {{ formatDateYY(book.date) }} 완주
              </Badge>
              <Badge v-if="book.round && book.round > 1" size="sm">
                {{ book.round }}회차
              </Badge>
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
    <div v-if="filteredAndSortedBooks.length === 0" class="text-center py-12 text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <div class="text-4xl mb-3">{{ searchQuery ? '🔍' : '📚' }}</div>
      <p>{{ searchQuery ? '검색 결과가 없습니다' : '아직 완주한 책이 없습니다' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { MessageCircle, Star, RotateCcw, Calendar, Trash2, Edit3, ArrowUpDown, Search, Check, Lock, X } from 'lucide-vue-next'
import DropdownMenu from '~/components/DropdownMenu.vue'
import RatingBadge from '~/components/RatingBadge.vue'
import GenreBadge from '~/components/GenreBadge.vue'
import Badge from '~/components/Badge.vue'

interface HistoryBook {
  id: string
  isbn: string
  title: string
  author: string
  cover_url: string
  publisher?: string
  total_pages?: number
  genre?: string // ✅ Unified genre (snapshot → official → draft)
  date: string
  round?: number
  reviewCount?: number
  averageRating?: string | null
  user_finished_at?: string | null
}

interface Props {
  historyBooks: HistoryBook[]
  isAdmin: boolean
  isArchived: boolean
  isReadOnlyMode?: boolean
  userReviewedBooks: Map<string, number>
}

interface Emits {
  (e: 'selectBook', bookId: string): void
  (e: 'openReviews', bookId: string): void
  (e: 'restartReading', bookId: string): void
  (e: 'editFinishedDate', bookId: string): void
  (e: 'deleteHistoryBook', bookId: string): void
  (e: 'openReview', bookId: string): void
  (e: 'markFinished', bookId: string): void
  (e: 'unmarkFinished', bookId: string): void
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

const filteredAndSortedBooks = computed(() => {
  let books = [...props.historyBooks]
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    books = books.filter(book => book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query))
  }
  books.sort((a, b) => {
    switch (sortBy.value) {
      case 'date-desc': return b.date.localeCompare(a.date)
      case 'date-asc': return a.date.localeCompare(b.date)
      case 'title': return a.title.localeCompare(b.title, 'ko')
      case 'author': return a.author.localeCompare(b.author, 'ko')
      default: return 0
    }
  })
  return books
})

const selectSort = (value: typeof sortBy.value) => {
  sortBy.value = value
  showSortMenu.value = false
}

const formatDateYY = (dateStr: string) => {
  if (!dateStr || dateStr === 'Invalid Date') return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
  const year = String(date.getFullYear()).slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}.${month}.${day}`
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

const handleMarkFinished = (bookId: string) => {
  activeBookMenu.value = null
  emit('markFinished', bookId)
}

const handleUnmarkFinished = (bookId: string) => {
  activeBookMenu.value = null
  emit('unmarkFinished', bookId)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
@keyframes fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.2s ease-out; }
</style>