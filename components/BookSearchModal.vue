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
          <div v-if="loading && searchResults.length === 0" class="flex items-center justify-center py-8">
            <LoadingSpinner size="md" message="검색 중..." />
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

        <!-- TOC Input Form (공통 컴포넌트) -->
        <TocInputForm
          ref="tocFormRef"
          v-model:totalPages="totalPages"
          v-model:chapters="chapters"
        />

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
            <div class="overflow-hidden rounded-xl">
              <input
                v-model="startDate"
                type="date"
                class="w-full min-w-0 box-border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">종료일 (목표)</label>
            <div class="overflow-hidden rounded-xl">
              <input
                v-model="endDate"
                type="date"
                :min="startDate"
                class="w-full min-w-0 box-border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
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
            시작하기
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Search } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import TocInputForm from '~/components/TocInputForm.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'confirm'])
const toast = useToastStore()

// Prevent body scroll when modal is open
watch(() => props.isOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

const step = ref(1)
const query = ref('')
const loading = ref(false)
const searchResults = ref<any[]>([])
const selectedBook = ref<any>(null)
const totalPages = ref<number | null>(null)
const chapters = ref<{ title: string; startPage: number }[]>([])
const currentStart = ref(1)
const hasMore = ref(false)

// TocInputForm ref for validation
const tocFormRef = ref<InstanceType<typeof TocInputForm> | null>(null)

// Helper function to get local date string (YYYY-MM-DD) without timezone conversion
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Step 3: Date selection - Initialize with default dates
const getDefaultDates = () => {
  const today = new Date()
  const monthLater = new Date(today)
  monthLater.setMonth(monthLater.getMonth() + 1)
  return {
    start: getLocalDateString(today),
    end: getLocalDateString(monthLater)
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
  chapters.value = []
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

const selectBook = async (book: any) => {
  selectedBook.value = book

  // DB에서 기존 책 정보 확인
  const client = useSupabaseClient()
  const { data: existingBook } = await client
    .from('books')
    .select('official_toc, total_pages')
    .eq('isbn', book.isbn)
    .maybeSingle()

  if (existingBook?.official_toc) {
    // ✅ official_toc 있음 → 자동으로 totalPages, chapters 채워짐
    const totalPagesFromDB = existingBook.total_pages || 100

    totalPages.value = totalPagesFromDB

    // % → page 번호 변환
    chapters.value = existingBook.official_toc.map((c: any) => ({
      title: c.title,
      startPage: Math.round((c.start / 100) * totalPagesFromDB)
    }))

    console.log('[BookSearchModal] Auto-loaded official_toc from DB')
  } else {
    // ❌ draft_toc만 있거나 없음 → 빈 입력 필드
    totalPages.value = null
    chapters.value = []
    console.log('[BookSearchModal] No official_toc, showing empty fields')
  }

  step.value = 2
}

const goToStep3 = () => {
  // Validate TOC before moving to step 3
  if (!tocFormRef.value) return

  const validation = tocFormRef.value.validate()
  if (!validation.valid) {
    toast.error(validation.message || '목차 정보를 확인해주세요.')
    return
  }

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
  console.log('[BookSearchModal] confirmBook called')

  // Validation already done in goToStep3, just check totalPages
  if (!totalPages.value) {
    console.log('[BookSearchModal] No totalPages')
    toast.error('전체 페이지를 입력해주세요.')
    return
  }

  // Convert pages to % (목차가 없으면 빈 배열)
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

  console.log('[BookSearchModal] Emitting confirm with:', {
    book: selectedBook.value?.title,
    totalPages: totalPages.value,
    toc,
    startDate: startDate.value,
    endDate: endDate.value
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
