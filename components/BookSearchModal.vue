<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-end sm:items-center justify-center pointer-events-none">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl p-6 pointer-events-auto max-h-[90dvh] overflow-hidden flex flex-col shadow-2xl border border-zinc-300 dark:border-zinc-800">

      <!-- Header -->
      <div class="flex justify-between items-center mb-2">
        <div>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">새 책 시작하기</h2>
          <div class="flex gap-1 mt-1.5">
            <div v-for="i in 3" :key="i" class="h-1 rounded-full transition-all duration-300" :class="i <= step ? 'w-4 bg-lime-400' : 'w-1.5 bg-zinc-200 dark:bg-zinc-800'"></div>
          </div>
        </div>
        <button @click="close" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Step Content Area (Scrollable) -->
      <div class="flex-1 overflow-y-auto custom-scrollbar py-4 px-0.5">
        
        <!-- Step 1: Search -->
        <div v-if="step === 1" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div class="relative group">
            <input
              v-model="query"
              @keyup.enter="searchBooks"
              type="text"
              placeholder="책 제목이나 저자를 검색하세요"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-4 py-4 pl-12 focus:outline-none focus:ring-2 focus:ring-lime-400 border-none transition-all shadow-sm"
            />
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-lime-500 transition-colors" :size="20" />
          </div>

          <div class="space-y-3 pt-2">
            <div v-if="loading && searchResults.length === 0" class="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="md" message="책을 찾고 있어요" />
            </div>
            
            <div
              v-for="book in searchResults"
              :key="book.isbn"
              @click="selectBook(book)"
              class="group flex gap-4 p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-transparent hover:border-lime-200 dark:hover:border-lime-900/50 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer transition-all shadow-sm active:scale-[0.98]"
            >
              <div class="w-16 h-24 flex-shrink-0 shadow-md group-hover:shadow-lg transition-all">
                <img
                  :src="book.cover"
                  class="w-full h-full object-cover"
                  @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <h3 class="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-1.5 truncate group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">{{ book.title }}</h3>
                <div class="flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                  <span class="truncate max-w-[120px]">{{ book.author }}</span>
                  <template v-if="book.publisher">
                    <span class="text-zinc-300 dark:text-zinc-700">·</span>
                    <span class="truncate max-w-[100px]">{{ book.publisher }}</span>
                  </template>
                </div>
              </div>
            </div>

            <div v-if="!loading && query && searchResults.length === 0" class="py-12 text-center">
              <div class="text-4xl mb-3">🔍</div>
              <p class="text-sm text-zinc-500 font-medium">검색 결과가 없습니다</p>
            </div>

            <div v-if="hasMore && searchResults.length > 0" class="pt-4 pb-8">
              <button
                @click="loadMore"
                :disabled="loading"
                class="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {{ loading ? '더 불러오는 중...' : '결과 더보기' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Configure TOC & Genre -->
        <div v-if="step === 2 && selectedBook" class="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
          <div class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="selectedBook.cover"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
              @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ selectedBook.title }}</h3>
              <div class="flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span class="truncate max-w-[100px]">{{ selectedBook.author }}</span>
                <template v-if="selectedBook.publisher || totalPages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="selectedBook.publisher" class="truncate max-w-[80px]">{{ selectedBook.publisher }}</span>
                  <span v-if="selectedBook.publisher && totalPages">·</span>
                  <span v-if="totalPages">{{ totalPages }}p</span>
                </template>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">
              장르 <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="genre in genres"
                :key="genre"
                @click="selectedGenre = genre"
                type="button"
                class="transition-all duration-200 transform active:scale-90"
              >
                <GenreBadge v-if="selectedGenre === genre" :genre="genre" />
                <div v-else class="inline-flex items-center px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent">
                  {{ genre }}
                </div>
              </button>
            </div>
          </div>

          <TocInputForm ref="tocFormRef" v-model:totalPages="totalPages" v-model:chapters="chapters" />
        </div>

        <!-- Step 3: Date Selection -->
        <div v-if="step === 3 && selectedBook" class="space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
          <div class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="selectedBook.cover"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
              @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ selectedBook.title }}</h3>
              <div class="flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span class="truncate max-w-[100px]">{{ selectedBook.author }}</span>
                <template v-if="selectedBook.publisher || totalPages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="selectedBook.publisher" class="truncate max-w-[80px]">{{ selectedBook.publisher }}</span>
                  <span v-if="selectedBook.publisher && totalPages">·</span>
                  <span v-if="totalPages">{{ totalPages }}p</span>
                </template>
                <template v-if="selectedGenre">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <GenreBadge :genre="selectedGenre" />
                </template>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">
              독서 기간 설정 <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">시작일</label>
                <input 
                  v-model="startDate" 
                  type="date" 
                  class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 border-none [color-scheme:light] dark:[color-scheme:dark] transition-all" 
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">종료일 (목표)</label>
                <input 
                  v-model="endDate" 
                  type="date" 
                  :min="startDate" 
                  class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 border-none [color-scheme:light] dark:[color-scheme:dark] transition-all" 
                />
              </div>
            </div>
          </div>

          <div v-if="startDate && endDate" class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar :size="16" class="text-lime-500" />
              </div>
              <span class="text-sm font-bold text-zinc-700 dark:text-zinc-300">총 독서 기간</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-lg font-black text-lime-600 dark:text-lime-400">{{ calculateDays() }}</span>
              <span class="text-sm font-bold text-zinc-400">일</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div v-if="step > 1" class="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
        <button @click="step--" class="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">이전</button>
        <button v-if="step === 2" @click="goToStep3" class="flex-[2] py-4 bg-lime-400 text-black font-bold rounded-2xl hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20">다음 단계</button>
        <button v-else @click="confirmBook" class="flex-[2] py-4 bg-lime-400 text-black font-bold rounded-2xl hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20" :disabled="!startDate || !endDate">지금 시작하기</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Search, Check, Calendar, ListTree, Plus, Sparkles } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import TocInputForm from '~/components/TocInputForm.vue'
import GenreBadge from '~/components/GenreBadge.vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close', 'confirm'])
const toast = useToastStore()
const { genres } = useGenres()

watch(() => props.isOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

const step = ref(1)
const query = ref('')
const loading = ref(false)
const searchResults = ref<any[]>([])
const selectedBook = ref<any>(null)
const selectedGenre = ref('')
const totalPages = ref<number | null>(null)
const chapters = ref<{ title: string; startPage: number }[]>([])
const currentStart = ref(1)
const hasMore = ref(false)
const tocFormRef = ref<InstanceType<typeof TocInputForm> | null>(null)

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultDates = () => {
  const today = new Date()
  const monthLater = new Date(today)
  monthLater.setMonth(monthLater.getMonth() + 1)
  return { start: getLocalDateString(today), end: getLocalDateString(monthLater) }
}

const defaults = getDefaultDates()
const startDate = ref(defaults.start)
const endDate = ref(defaults.end)

const close = () => { emit('close'); reset() }
const reset = () => {
  step.value = 1; query.value = ''; searchResults.value = []; selectedBook.value = null;
  selectedGenre.value = ''; totalPages.value = null; chapters.value = [];
  currentStart.value = 1; hasMore.value = false;
  const newDefaults = getDefaultDates()
  startDate.value = newDefaults.start; endDate.value = newDefaults.end
}

const { searchBooks: searchBooksAPI } = useBookSearch()
const searchBooks = async () => {
  if (!query.value?.trim()) return
  currentStart.value = 1; searchResults.value = []; loading.value = true
  try {
    const results = await searchBooksAPI(query.value, currentStart.value)
    searchResults.value = results.books; hasMore.value = results.hasMore
  } catch (error: any) {
    toast.error(error.message || '책 검색 중 오류가 발생했습니다.')
  } finally { loading.value = false }
}

const loadMore = async () => {
  if (!query.value || loading.value) return
  currentStart.value += 20; loading.value = true
  try {
    const results = await searchBooksAPI(query.value, currentStart.value)
    searchResults.value = [...searchResults.value, ...results.books]; hasMore.value = results.hasMore
  } catch (error: any) {
    toast.error(error.message || '더보기 중 오류가 발생했습니다.')
  } finally { loading.value = false }
}

const selectBook = async (book: any) => {
  selectedBook.value = book
  const client = useSupabaseClient()
  const { data: existingBook } = await client.from('books').select('official_toc, official_genre, total_pages').eq('isbn', book.isbn).maybeSingle()
  if (existingBook?.official_toc) {
    const totalPagesFromDB = existingBook.total_pages || 100
    totalPages.value = totalPagesFromDB
    chapters.value = existingBook.official_toc.map((c: any) => ({ title: c.title, startPage: Math.round((c.start / 100) * totalPagesFromDB) }))
  } else { totalPages.value = null; chapters.value = [] }
  selectedGenre.value = existingBook?.official_genre || ''
  step.value = 2
}

const goToStep3 = () => {
  if (!selectedGenre.value) { toast.error('장르를 선택해주세요.'); return }
  if (!tocFormRef.value) return
  const validation = tocFormRef.value.validate()
  if (!validation.valid) { toast.error(validation.message || '목차 정보를 확인해주세요.'); return }
  step.value = 3
}

const calculateDays = () => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value); const end = new Date(endDate.value)
  return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

const confirmBook = () => {
  if (!totalPages.value) { toast.error('전체 페이지를 입력해주세요.'); return }
  if (!selectedGenre.value) { toast.error('장르를 선택해주세요.'); return }
  
  emit('confirm', { 
    book: selectedBook.value, 
    genre: selectedGenre.value, 
    totalPages: totalPages.value, 
    toc: chapters.value, // { title, startPage } 구조 그대로 전달
    startDate: startDate.value, 
    endDate: endDate.value 
  })
  close()
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
@keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: animate-in 0.3s ease-out; }
</style>
