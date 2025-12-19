<template>
  <div v-if="isOpen" class="fixed inset-0 z-[50] flex items-end sm:items-center justify-center pointer-events-none">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl p-6 pointer-events-auto max-h-[90dvh] overflow-y-auto shadow-2xl border border-zinc-300 dark:border-zinc-800">

      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">새 책 시작하기</h2>
        <button @click="close" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <!-- Step 1: Search -->
      <div v-if="step === 1" class="space-y-4">
        <div class="relative">
          <input
            v-model="query"
            @keyup.enter="searchBooks"
            type="text"
            placeholder="책 제목이나 저자를 검색하세요"
            class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
          <Search class="absolute left-4 top-3.5 text-zinc-600 dark:text-zinc-400" :size="20" />
        </div>

        <div class="space-y-2 mt-4">
          <div v-if="loading && searchResults.length === 0" class="space-y-3">
            <SkeletonLoader type="list-item" />
            <SkeletonLoader type="list-item" />
            <SkeletonLoader type="list-item" />
          </div>
          <div
            v-for="book in searchResults"
            :key="book.isbn"
            @click="selectBook(book)"
            class="flex gap-4 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <img
              :src="book.cover"
              class="w-16 h-24 object-cover rounded shadow-md bg-zinc-200 dark:bg-zinc-700"
              @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-zinc-800 dark:text-zinc-200 truncate">{{ book.title }}</h3>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 truncate">{{ book.author }}</p>
              <p class="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{{ book.publisher }}</p>
            </div>
          </div>

          <!-- Load More Button -->
          <div v-if="hasMore && searchResults.length > 0" class="pt-4">
            <button
              @click="loadMore"
              :disabled="loading"
              class="w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? '로딩중...' : '더보기 (20개 더)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Configure TOC -->
      <div v-if="step === 2 && selectedBook" class="space-y-6">
        <div class="flex gap-4 items-center p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
          <img
            :src="selectedBook.cover"
            class="w-12 h-16 object-cover rounded bg-zinc-200 dark:bg-zinc-700"
            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <div>
            <h3 class="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{{ selectedBook.title }}</h3>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">{{ selectedBook.author }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">전체 페이지 수</label>
          <input
            v-model.number="totalPages"
            type="number"
            class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">챕터 설정 (선택사항)</label>
          <div class="space-y-2">
            <div v-for="(chapter, idx) in chapters" :key="idx" class="flex gap-2">
              <input v-model="chapter.title" type="text" placeholder="챕터명" class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
              <input v-model.number="chapter.startPage" type="number" placeholder="시작 쪽" class="w-20 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm text-center" />
              <button @click="removeChapter(idx)" class="text-zinc-600 dark:text-zinc-500 hover:text-red-400 px-2">×</button>
            </div>
            <button @click="addChapter" class="text-sm text-lime-400 font-medium hover:underline">+ 챕터 추가</button>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="step = 1"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-4 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            ← 이전
          </button>
          <button
            @click="goToStep3"
            class="flex-1 bg-lime-400 text-black font-bold py-4 rounded-xl hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!totalPages || totalPages <= 0"
          >
            다음 →
          </button>
        </div>
      </div>

      <!-- Step 3: Date Selection -->
      <div v-if="step === 3 && selectedBook" class="space-y-6">
        <div class="flex gap-4 items-center p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
          <img
            :src="selectedBook.cover"
            class="w-12 h-16 object-cover rounded bg-zinc-200 dark:bg-zinc-700"
            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
          />
          <div>
            <h3 class="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{{ selectedBook.title }}</h3>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">{{ selectedBook.author }}</p>
          </div>
        </div>

        <div class="text-center">
          <div class="text-3xl mb-2">📅</div>
          <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">독서 기간 설정</h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-500">함께 읽을 기간을 정해보세요</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">시작일</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">종료일 (목표)</label>
            <input
              v-model="endDate"
              type="date"
              :min="startDate"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div v-if="startDate && endDate" class="p-3 bg-lime-400/10 border border-lime-400/30 rounded-lg">
            <p class="text-sm text-lime-400 text-center">
              💡 {{ calculateDays() }}일 독서 계획
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="step = 2"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-4 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            ← 이전
          </button>
          <button
            @click="confirmBook"
            class="flex-1 bg-lime-400 text-black font-bold py-4 rounded-xl hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!startDate || !endDate"
          >
            시작하기! 🚀
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, Search } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'confirm'])
const toast = useToastStore()

const step = ref(1)
const query = ref('')
const loading = ref(false)
const searchResults = ref<any[]>([])
const selectedBook = ref<any>(null)
const totalPages = ref<number | null>(null)
const chapters = ref<{ title: string; startPage: number }[]>([
  { title: 'Chapter 1', startPage: 1 }
])
const currentStart = ref(1)
const hasMore = ref(false)

// Step 3: Date selection - Initialize with default dates
const getDefaultDates = () => {
  const today = new Date()
  const monthLater = new Date(today)
  monthLater.setMonth(monthLater.getMonth() + 1)
  return {
    start: today.toISOString().split('T')[0],
    end: monthLater.toISOString().split('T')[0]
  }
}

const defaults = getDefaultDates()
const startDate = ref(defaults.start)
const endDate = ref(defaults.end)

const close = () => {
  emit('close')
  reset()
}

const reset = () => {
  step.value = 1
  query.value = ''
  searchResults.value = []
  selectedBook.value = null
  totalPages.value = null
  chapters.value = [{ title: 'Chapter 1', startPage: 1 }]
  currentStart.value = 1
  hasMore.value = false

  // Reset dates to defaults (today + 1 month)
  const newDefaults = getDefaultDates()
  startDate.value = newDefaults.start
  endDate.value = newDefaults.end
}

const { searchBooks: searchBooksAPI } = useBookSearch()

const searchBooks = async () => {
  if (!query.value || query.value.trim().length === 0) return

  // Reset for new search
  currentStart.value = 1
  searchResults.value = []
  loading.value = true

  try {
    const results = await searchBooksAPI(query.value, currentStart.value)
    searchResults.value = results.books
    hasMore.value = results.hasMore
  } catch (error: any) {
    console.error('Search error:', error)
    toast.error(error.message || '책 검색 중 오류가 발생했습니다.')
    searchResults.value = []
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (!query.value || loading.value) return

  currentStart.value += 20
  loading.value = true

  try {
    const results = await searchBooksAPI(query.value, currentStart.value)
    searchResults.value = [...searchResults.value, ...results.books]
    hasMore.value = results.hasMore
  } catch (error: any) {
    console.error('Load more error:', error)
    toast.error(error.message || '더보기 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

const selectBook = (book: any) => {
  selectedBook.value = book
  totalPages.value = book.totalPages || null
  step.value = 2
}

const addChapter = () => {
  chapters.value.push({ title: '', startPage: 0 })
}

const removeChapter = (idx: number) => {
  chapters.value.splice(idx, 1)
}

const goToStep3 = () => {
  if (!totalPages.value || totalPages.value <= 0) return
  step.value = 3
}

const calculateDays = () => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const confirmBook = () => {
  if (!totalPages.value) return

  // Convert pages to %
  const toc = chapters.value.map((c, i) => {
    const nextStart = chapters.value[i + 1]?.startPage || totalPages.value!
    const startPct = (c.startPage / totalPages.value!) * 100
    const endPct = (nextStart / totalPages.value!) * 100
    return {
      title: c.title,
      start: startPct,
      end: endPct
    }
  })

  emit('confirm', {
    book: selectedBook.value,
    totalPages: totalPages.value,
    toc,
    startDate: startDate.value,
    endDate: endDate.value
  })
  close()
}
</script>
