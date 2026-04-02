<template>
  <div class="space-y-4 pb-20">
    <!-- NOW READING -->
    <div v-if="readingBooks.length > 0">
      <!-- Header -->
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
          읽는 중
        </h3>
        <span class="text-[11px] text-zinc-400 dark:text-zinc-300">{{ sortedReadingBooks.length }}권</span>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]">

      <!-- Reading Books List (목표일 임박 순) -->
      <div class="p-3 space-y-2">
        <div
          v-for="book in sortedReadingBooks"
          :key="book.id"
          class="p-4 cursor-pointer transition-all relative rounded-2xl"
          :class="[
            selectedBookId === book.id
              ? 'ring-2 ring-lime-500 dark:ring-lime-400 bg-lime-50/30 dark:bg-lime-900/30'
              : 'ring-1 ring-black/[0.04] dark:ring-white/[0.06] hover:ring-lime-300 dark:hover:ring-lime-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/30',
            activeBookMenu === book.id ? 'z-[10001]' : 'z-0'
          ]"
          @click="emit('selectBook', book.id)"
        >
          <!-- Settings Menu (Common Component) -->
          <div v-if="!isArchived" class="absolute top-3 right-3">
            <DropdownMenu
              :is-open="activeBookMenu === book.id"
              @toggle="toggleBookMenu(book.id)"
              @close="activeBookMenu = null"
            >
              <!-- All Users -->
              <button v-if="book.user_finished_at" @click.stop="handleReview(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                <Edit3 :size="12" /> {{ props.userReviewedBooks.has(book.id) ? '리뷰 수정' : '리뷰 작성' }}
              </button>
              <button v-if="!book.user_finished_at" @click.stop="handleMarkFinished(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                <Check :size="12" /> 완독 처리
              </button>
              <button v-else @click.stop="handleUnmarkFinished(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                <X :size="12" /> 완독 취소
              </button>
              <!-- Admin Only -->
              <template v-if="isAdmin">
                <button @click.stop="handleEditDates(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap border-t border-zinc-100 dark:border-zinc-700/50 font-bold">
                  <Edit2 :size="12" /> 기간 수정
                </button>
                <button @click.stop="handleEditGenre(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                  <Tag :size="12" /> 장르 수정
                </button>
                <button @click.stop="handleEditToc(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold">
                  <Settings :size="12" /> 목차 수정
                </button>
                <button @click.stop="handleDeleteBook(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700/50 whitespace-nowrap font-bold">
                  <UserX :size="12" /> 책 삭제
                </button>
              </template>
            </DropdownMenu>
          </div>

          <div class="flex gap-3">
            <img :src="book.book?.cover_url" class="w-14 h-20 object-cover rounded shadow-apple bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
            <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <h3 class="font-semibold text-zinc-900 dark:text-white line-clamp-1 text-sm mb-1 pr-8">{{ book.book?.title }}</h3>
                <div class="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  <span class="truncate max-w-[80px]">{{ book.book?.author }}</span>
                  <template v-if="book.book?.publisher || book.total_pages">
                    <span class="text-zinc-300 dark:text-zinc-700">·</span>
                    <span v-if="book.book?.publisher" class="truncate max-w-[60px]">{{ book.book?.publisher }}</span>
                    <span v-if="book.book?.publisher && book.total_pages">·</span>
                    <span v-if="book.total_pages">{{ book.total_pages }}p</span>
                  </template>
                </div>
              </div>

              <!-- Badges Line -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <GenreBadge v-if="book.genre" :genre="book.genre" size="sm" />
                
                <RatingBadge v-if="props.userReviewedBooks.has(book.id)" :rating="props.userReviewedBooks.get(book.id)" size="sm" />

                <Badge v-if="book.round && book.round > 1" size="sm">
                  {{ book.round }}회차
                </Badge>

                <Badge v-if="book.target_start_date" size="sm">
                  {{ formatBookDateRange(book) }}
                </Badge>

                <Badge v-if="getBookDaysRemaining(book) !== null" variant="lime" size="sm">
                  {{ getBookDaysRemaining(book)! > 0 ? `D-${getBookDaysRemaining(book)}` : getBookDaysRemaining(book) === 0 ? 'D-Day' : `D+${Math.abs(getBookDaysRemaining(book)!)}` }}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Chapter Navigation (선택된 책의 목차) -->
      <div v-if="selectedBook && toc.length > 0" class="mt-6">
        <div class="flex items-center justify-between px-1 mb-3">
          <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">목차 이동</h3>
          <span class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 opacity-60">{{ toc.length }}개</span>
        </div>
        
        <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden shadow-apple">
          <div class="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            <button
              v-for="(chapter, index) in toc"
              :key="index"
              @click="emit('jumpToChapter', chapter.start)"
              class="w-full flex items-center justify-between px-4 py-3.5 text-left transition-all group relative active:bg-zinc-50 dark:active:bg-zinc-800"
              :class="{ 'bg-lime-50/30 dark:bg-lime-900/30': isCurrentChapter(chapter) }"
            >
              <!-- Current Indicator Bar -->
              <div 
                v-if="isCurrentChapter(chapter)" 
                class="absolute left-0 top-0 bottom-0 w-1 bg-lime-400"
              ></div>

              <div class="flex items-center gap-3 min-w-0">
                <span 
                  class="text-[11px] font-black w-4 text-zinc-300 dark:text-zinc-500 group-hover:text-lime-500 transition-colors"
                  :class="{ 'text-lime-500': isCurrentChapter(chapter) }"
                >
                  {{ (index + 1).toString().padStart(2, '0') }}
                </span>
                <span 
                  class="text-xs truncate transition-colors"
                  :class="[
                    isCurrentChapter(chapter)
                      ? 'font-bold text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-400 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                  ]"
                >
                  {{ chapter.title }}
                </span>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <div class="flex flex-col items-end gap-0.5">
                  <span 
                    v-if="chapter.page != null"
                    class="text-[11px] font-black text-lime-600 dark:text-lime-400"
                  >
                    {{ chapter.page }}쪽
                  </span>
                  <span 
                    class="text-[9px] font-bold text-zinc-400 dark:text-zinc-300"
                  >
                    {{ Math.round(chapter.start) }}%
                  </span>
                </div>
                <ChevronRight 
                  :size="14" 
                  class="text-zinc-300 dark:text-zinc-500 transform transition-transform group-hover:translate-x-0.5 group-hover:text-lime-500" 
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Edit2, Settings, UserX, Edit3, Check, X, Tag, Lock, ChevronRight } from 'lucide-vue-next'
import DropdownMenu from '~/components/DropdownMenu.vue'
import RatingBadge from '~/components/RatingBadge.vue'
import GenreBadge from '~/components/GenreBadge.vue'
import Badge from '~/components/Badge.vue'

interface Book {
  id: string
  isbn: string
  book?: {
    title: string
    author: string
    publisher?: string
    cover_url: string
  }
  genre?: string // ✅ Unified genre (snapshot → official → draft)
  total_pages?: number // ✅ Unified pages (snapshot → official → draft)
  target_start_date?: string
  target_end_date?: string
  user_finished_at?: string
  created_at: string
  round?: number
}

interface TocChapter {
  title: string
  start: number
  end: number
  page?: number
}

interface Props {
  currentBook: Book | null
  selectedBookId: string | null
  toc: TocChapter[]
  readingBooks: Book[]
  viewProgress: number
  isAdmin: boolean
  isArchived: boolean
  userReviewedBooks: Map<string, number>
}

interface Emits {
  (e: 'selectBook', bookId: string): void
  (e: 'jumpToChapter', startPct: number): void
  (e: 'editDates', bookId: string): void
  (e: 'editToc', bookId: string): void
  (e: 'editGenre', bookId: string): void
  (e: 'markFinished', bookId: string): void
  (e: 'unmarkFinished', bookId: string): void
  (e: 'deleteBook', bookId: string): void
  (e: 'openReview', bookId: string): void
  (e: 'openUpgradeModal'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeBookMenu = ref<string | null>(null)

// 목표일 기준으로 정렬 (D-Day 임박한 순서)
const sortedReadingBooks = computed(() => {
  return [...props.readingBooks].sort((a, b) => {
    const aEndDate = a.target_end_date
    const bEndDate = b.target_end_date

    // 둘 다 목표일 없으면 created_at 기준
    if (!aEndDate && !bEndDate) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    // 하나만 목표일 없으면 있는 게 우선
    if (!aEndDate) return 1
    if (!bEndDate) return -1

    // 둘 다 있으면 목표일 임박한 순 (빠른 날짜가 먼저)
    return new Date(aEndDate).getTime() - new Date(bEndDate).getTime()
  })
})

// selectedBook 기준으로 판단 (readingBooks 중에 선택된 책)
const selectedBook = computed(() => {
  return props.readingBooks.find(book => book.id === props.selectedBookId) || props.readingBooks[0] || null
})

// 선택된 책이 실제로 읽는 중인 책인지 확인 (완독한 책이 아닌지)
const isSelectedBookReading = computed(() => {
  return props.readingBooks.some(book => book.id === props.selectedBookId)
})

// 각 책의 날짜 범위 포맷팅
const formatBookDateRange = (book: Book) => {
  if (!book.target_start_date || !book.target_end_date) return null
  const start = new Date(book.target_start_date)
  const end = new Date(book.target_end_date)
  const formatDate = (date: Date) => {
    const year = date.getFullYear() % 100
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}.${month}.${day}`
  }
  return `${formatDate(start)} - ${formatDate(end)}`
}

// 각 책의 남은 일수 계산
const getBookDaysRemaining = (book: Book) => {
  if (!book.target_end_date) return null
  const end = new Date(book.target_end_date)
  end.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

const isCurrentChapter = (chapter: TocChapter) => {
  return props.viewProgress >= chapter.start && props.viewProgress < chapter.end
}

const toggleBookMenu = (bookId: string) => {
  activeBookMenu.value = activeBookMenu.value === bookId ? null : bookId
}

const handleEditDates = (bookId: string) => {
  activeBookMenu.value = null
  emit('editDates', bookId)
}

const handleEditGenre = (bookId: string) => {
  activeBookMenu.value = null
  emit('editGenre', bookId)
}

const handleEditToc = (bookId: string) => {
  activeBookMenu.value = null
  emit('editToc', bookId)
}

const handleMarkFinished = (bookId: string) => {
  activeBookMenu.value = null
  emit('markFinished', bookId)
}

const handleUnmarkFinished = (bookId: string) => {
  activeBookMenu.value = null
  emit('unmarkFinished', bookId)
}

const handleDeleteBook = (bookId: string) => {
  activeBookMenu.value = null
  emit('deleteBook', bookId)
}

const handleReview = (bookId: string) => {
  activeBookMenu.value = null
  emit('openReview', bookId)
}
</script>

<style scoped>
@keyframes pulse-lime {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.animate-pulse-lime {
  animation: pulse-lime 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
