<template>
  <div class="space-y-4">
    <!-- NOW READING -->
    <div v-if="readingBooks.length > 0">
      <!-- Header -->
      <div class="flex items-center justify-between px-1 mb-3">
        <h3 class="text-xs font-bold text-zinc-500 uppercase">📖 Now Reading</h3>
        <span class="text-[10px] text-zinc-400">{{ sortedReadingBooks.length }}권</span>
      </div>

      <!-- Card -->
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

      <!-- Reading Books List (목표일 임박 순) -->
      <div class="p-3 space-y-2">
        <div
          v-for="book in sortedReadingBooks"
          :key="book.id"
          class="p-4 cursor-pointer transition-all relative rounded-xl"
          :class="selectedBookId === book.id
            ? 'border-2 border-lime-500 dark:border-lime-400 bg-lime-50/30 dark:bg-lime-900/10 shadow-lime-200 dark:shadow-lime-900/30'
            : 'border border-zinc-200 dark:border-zinc-800 hover:border-lime-300 dark:hover:border-lime-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'"
          @click="emit('selectBook', book.id)"
        >
          <!-- Admin Menu (관리자면 항상 표시) -->
          <div v-if="isAdmin" class="absolute top-3 right-3 z-20">
            <button @click.stop="toggleBookMenu(book.id)" class="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors">
              <MoreVertical :size="14" class="text-zinc-400" />
            </button>
            <div v-if="activeBookMenu === book.id" class="absolute right-0 top-6 min-w-[160px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-[101] overflow-visible" @click.stop>
              <button @click.stop="handleEditDates(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                <Edit2 :size="12" /> 기간 수정
              </button>
              <button @click.stop="handleEditToc(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                <Settings :size="12" /> 목차 수정
              </button>
              <button @click.stop="handleMarkCompleted(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                <UserCheck :size="12" /> 완독 처리
              </button>
              <button @click.stop="handleDeleteBook(book.id)" class="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700/50 whitespace-nowrap">
                <UserX :size="12" /> 책 삭제
              </button>
            </div>
            <div v-if="activeBookMenu === book.id" class="fixed inset-0 z-[100]" @click="activeBookMenu = null"></div>
          </div>

          <div class="flex gap-3 mb-2">
            <img :src="book.book?.cover_url" class="w-14 h-20 object-cover rounded shadow-sm bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-zinc-900 dark:text-white line-clamp-2 text-sm mb-1 pr-8">{{ book.book?.title }}</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{{ book.book?.author }}</p>
              <div class="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 inline-block">
                {{ formatBookDateRange(book) || '기간 미설정' }}
              </div>
            </div>
          </div>

          <!-- D-Day (모든 책에 표시) -->
          <div
            v-if="getBookDaysRemaining(book) !== null"
            class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 flex items-center justify-between"
          >
            <span class="text-xs text-zinc-500 dark:text-zinc-400">목표일까지</span>
            <span class="text-xs font-bold" :class="{
              'text-red-500': getBookDaysRemaining(book)! <= 0,
              'text-orange-500': getBookDaysRemaining(book)! > 0 && getBookDaysRemaining(book)! <= 7,
              'text-lime-500': getBookDaysRemaining(book)! > 7
            }">
              {{ getBookDaysRemaining(book)! > 0 ? `${getBookDaysRemaining(book)}일 남음` : getBookDaysRemaining(book) === 0 ? '오늘까지!' : `+${Math.abs(getBookDaysRemaining(book)!)}일 지남` }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chapter Navigation (선택된 책의 목차) -->
      <div v-if="selectedBook && toc.length > 0 && isSelectedBookReading" class="border-t border-zinc-200 dark:border-zinc-800">
        <div class="px-4 py-3">
          <h4 class="text-xs font-bold text-zinc-500 uppercase">목차 바로가기</h4>
        </div>
        <div class="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          <button
            v-for="(chapter, index) in toc"
            :key="index"
            @click="emit('jumpToChapter', chapter.start)"
            class="w-full text-left px-4 py-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 flex justify-between items-center group transition-colors"
            :class="{ 'bg-lime-50/50 dark:bg-lime-900/10': isCurrentChapter(chapter) }"
          >
            <span class="text-zinc-700 dark:text-zinc-300 truncate pr-2" :class="{ 'font-bold text-lime-700 dark:text-lime-400': isCurrentChapter(chapter) }">
              {{ chapter.title }}
            </span>
            <span class="text-[10px] text-zinc-400">{{ Math.round(chapter.start) }}%</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MoreVertical, Edit2, Settings, UserCheck, UserX } from 'lucide-vue-next'

interface Book {
  id: string
  isbn: string
  book?: {
    title: string
    author: string
    cover_url: string
  }
  target_start_date?: string
  target_end_date?: string
}

interface TocChapter {
  title: string
  start: number
  end: number
}

interface Props {
  currentBook: Book | null
  selectedBookId: string | null
  toc: TocChapter[]
  readingBooks: Book[]
  viewProgress: number
  isAdmin: boolean
}

interface Emits {
  (e: 'selectBook', bookId: string): void
  (e: 'jumpToChapter', startPct: number): void
  (e: 'editDates', bookId: string): void
  (e: 'editToc', bookId: string): void
  (e: 'markCompleted', bookId: string): void
  (e: 'deleteBook', bookId: string): void
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
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}.${month}.${day}`
  }
  return `${formatDate(start)} - ${formatDate(end)}`
}

// 각 책의 남은 일수 계산
const getBookDaysRemaining = (book: Book) => {
  if (!book.target_end_date) return null
  const end = new Date(book.target_end_date)
  const today = new Date()
  const diffTime = end.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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

const handleEditToc = (bookId: string) => {
  activeBookMenu.value = null
  emit('editToc', bookId)
}

const handleMarkCompleted = (bookId: string) => {
  activeBookMenu.value = null
  emit('markCompleted', bookId)
}

const handleDeleteBook = (bookId: string) => {
  activeBookMenu.value = null
  emit('deleteBook', bookId)
}
</script>
