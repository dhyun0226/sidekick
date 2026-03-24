<template>
  <div>
    <!-- Stats / Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">전체 도서</p>
          <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ allBooks.length }}</p>
        </div>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <BookOpen :size="20" class="text-zinc-500" />
        </div>
      </div>
      <div 
        @click="activeTab = 'approvals'"
        class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between cursor-pointer hover:border-lime-500 transition-colors"
        :class="{ 'border-lime-500 ring-1 ring-lime-500': activeTab === 'approvals' }"
      >
        <div>
          <p class="text-xs text-zinc-500">승인 필요</p>
          <p class="text-2xl font-bold text-lime-600">{{ pendingTotal }}</p>
        </div>
        <div class="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg relative">
          <FileText :size="20" class="text-lime-600" />
          <span v-if="pendingTotal > 0" class="absolute -top-1 -right-1 flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">승인 완료</p>
          <p class="text-2xl font-bold text-blue-600">{{ approvedCount }}</p>
        </div>
        <div class="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <CheckCircle :size="20" class="text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Main View Switcher -->
    <div class="mb-6 flex gap-2 overflow-x-auto pb-1">
      <button 
        @click="activeTab = 'approvals'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
        :class="activeTab === 'approvals' 
          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' 
          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
      >
        <span class="relative">
          승인 대기 목록
          <span v-if="pendingTotal > 0" class="absolute -top-1 -right-2 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </span>
      </button>
      <button 
        @click="activeTab = 'library'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === 'library' 
          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' 
          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
      >
        전체 도서 라이브러리
      </button>
    </div>

    <!-- Approvals View -->
    <div v-if="activeTab === 'approvals'" class="space-y-8">
      <!-- 1. Genre Approvals -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Tag :size="20" />
            장르 승인 대기
            <span class="text-sm font-normal text-zinc-500">({{ pendingGenreCount }})</span>
          </h2>
        </div>

        <div v-if="pendingGenreCount === 0" class="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-800 border-dashed">
          <CheckCircle :size="48" class="mx-auto text-zinc-300 mb-2" />
          <p class="text-zinc-500">승인 대기 중인 장르가 없습니다.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="book in pendingGenreBooks" 
            :key="`genre-${book.isbn}`"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex gap-4 mb-4">
               <img v-if="book.cover_url" :src="book.cover_url" class="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0" />
               <div v-else class="w-16 h-24 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                  <BookOpen :size="20" class="text-zinc-400" />
               </div>
               <div class="min-w-0 flex-1">
                 <h3 class="font-bold text-zinc-900 dark:text-white truncate" :title="book.title">{{ book.title }}</h3>
                 <p class="text-xs text-zinc-500 mb-2 truncate">{{ book.author }}</p>
                 <div class="flex items-center gap-2 bg-lime-50 dark:bg-lime-900/10 p-2 rounded-lg border border-lime-100 dark:border-lime-900/20">
                    <span class="text-xs text-zinc-500">제안:</span>
                    <span class="font-bold text-lime-700 dark:text-lime-400 text-sm">{{ book.draft_genre }}</span>
                 </div>
               </div>
            </div>
            <div class="flex gap-2">
              <button 
                @click="openEditGenre(book)"
                class="flex-1 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                수정
              </button>
              <button 
                @click="approveGenre(book.isbn, book.title, book.draft_genre)"
                :disabled="approvingGenre === book.isbn"
                class="flex-1 py-2 text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check :size="14" />
                {{ approvingGenre === book.isbn ? '처리 중...' : '승인' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. TOC Approvals -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <List :size="20" />
            목차 승인 대기
            <span class="text-sm font-normal text-zinc-500">({{ pendingTocCount }})</span>
          </h2>
        </div>

        <div v-if="pendingTocCount === 0" class="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-zinc-200 dark:border-zinc-800 border-dashed">
          <CheckCircle :size="48" class="mx-auto text-zinc-300 mb-2" />
          <p class="text-zinc-500">승인 대기 중인 목차가 없습니다.</p>
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div 
            v-for="book in pendingTocBooks" 
            :key="`toc-${book.isbn}`"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex gap-3">
                 <img v-if="book.cover_url" :src="book.cover_url" class="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0" />
                 <div class="min-w-0">
                   <h3 class="font-bold text-zinc-900 dark:text-white truncate max-w-[200px]" :title="book.title">{{ book.title }}</h3>
                   <p class="text-xs text-zinc-500 truncate">{{ book.author }}</p>
                   <p class="text-xs text-zinc-400 mt-1">{{ formatDate(book.created_at) }}</p>
                 </div>
              </div>
              <div class="text-right">
                <span class="inline-flex items-center px-2 py-1 rounded bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 text-xs font-bold">
                  {{ getChapterCount(book) }} 챕터
                </span>
              </div>
            </div>

            <!-- Preview Snippet -->
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 mb-4 text-xs space-y-1.5 border border-zinc-100 dark:border-zinc-800">
               <div v-for="(chapter, idx) in parseToc(book.draft_toc).slice(0, 3)" :key="idx" class="flex justify-between">
                  <span class="text-zinc-600 dark:text-zinc-400 truncate pr-2">{{ idx + 1 }}. {{ chapter.title }}</span>
                  <span class="text-zinc-400 whitespace-nowrap">{{ chapter.startPage ? `p.${chapter.startPage}` : `${chapter.start}%` }}</span>
               </div>
               <div v-if="parseToc(book.draft_toc).length > 3" class="text-center text-zinc-400 pt-1">
                  ... 외 {{ parseToc(book.draft_toc).length - 3 }}개
               </div>
            </div>

            <div class="flex gap-2">
              <button 
                @click="editToc(book)"
                class="flex-1 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                검토 및 수정
              </button>
              <button 
                @click="approveToc(book.isbn, book.title)"
                :disabled="approvingToc === book.isbn"
                class="flex-1 py-2 text-xs font-bold text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check :size="14" />
                {{ approvingToc === book.isbn ? '처리 중...' : '즉시 승인' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Library View -->
    <div v-else class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <!-- Toolbar -->
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="relative w-full md:w-96">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="라이브러리 검색..."
              class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
            />
          </div>
          <div class="flex gap-2">
             <!-- Status Filters could go here if needed, simplified for now -->
          </div>
        </div>

        <!-- Table -->
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">책 정보</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">저자</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">장르</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">상태</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <template v-for="book in filteredBooks" :key="book.isbn">
              <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img v-if="book.cover_url" :src="book.cover_url" class="w-8 h-12 object-cover rounded shadow-sm flex-shrink-0" />
                    <div class="min-w-0">
                      <p class="font-medium text-sm text-zinc-900 dark:text-white truncate max-w-[200px]" :title="book.title">{{ book.title }}</p>
                      <p class="text-xs text-zinc-500 truncate">ISBN: {{ book.isbn }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-zinc-500">{{ book.author }}</td>
                <td class="px-6 py-4">
                  <GenreBadge 
                    v-if="book.official_genre" 
                    :genre="book.official_genre" 
                    size="sm" 
                  />
                  <span v-else class="text-xs text-zinc-400">-</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span v-if="book.official_toc" class="text-blue-600 text-xs font-bold">승인됨</span>
                  <span v-else-if="book.draft_toc" class="text-lime-600 text-xs font-bold">대기 중</span>
                  <span v-else class="text-zinc-400 text-xs">-</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button @click="editToc(book)" class="text-zinc-400 hover:text-zinc-600">
                    <Edit :size="16" />
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
    </div>

    <!-- Modals -->
    <TocEditModal
      :show="showEditModal"
      :book="editingBook"
      :toc-type="editingTocType"
      @close="showEditModal = false"
      @save="saveTocEdit"
    />

    <EditGenreModal
      :is-open="showGenreModal"
      :current-genre="editingBook?.official_genre || editingBook?.draft_genre"
      @close="showGenreModal = false"
      @save="saveGenreEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BookOpen, FileText, CheckCircle, Edit, Search, ChevronDown, Check, Tag, List } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocEditModal from '~/components/admin/TocEditModal.vue'
import EditGenreModal from '~/components/admin/EditGenreModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const loading = ref(true)
const allBooks = ref<any[]>([])
const activeTab = ref<'approvals' | 'library'>('approvals')
const approvingToc = ref<string | null>(null)
const approvingGenre = ref<string | null>(null)
const showEditModal = ref(false)
const showGenreModal = ref(false)
const editingBook = ref<any>(null)
const editingTocType = ref<'draft' | 'official'>('draft')

// Search
const searchQuery = ref('')

// Computed: Pending Lists
const pendingGenreBooks = computed(() => {
  return allBooks.value.filter(b => b.draft_genre && !b.official_genre)
})

const pendingTocBooks = computed(() => {
  return allBooks.value.filter(b => b.draft_toc && !b.official_toc)
})

const pendingGenreCount = computed(() => pendingGenreBooks.value.length)
const pendingTocCount = computed(() => pendingTocBooks.value.length)
const pendingTotal = computed(() => pendingGenreCount.value + pendingTocCount.value)
const approvedCount = computed(() => allBooks.value.filter(b => b.official_toc).length)

// Computed: Filtered Library
const filteredBooks = computed(() => {
  let books = allBooks.value
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    books = books.filter(b => 
      b.title?.toLowerCase().includes(query) ||
      b.author?.toLowerCase().includes(query) ||
      b.isbn?.toLowerCase().includes(query)
    )
  }
  return books
})

// Helper Functions
const openEditGenre = (book: any) => {
  editingBook.value = book
  showGenreModal.value = true
}

const parseToc = (tocData: any) => {
  if (Array.isArray(tocData)) return tocData
  if (typeof tocData === 'string') {
    try { return JSON.parse(tocData) } catch { return [] }
  }
  return []
}

const getChapterCount = (book: any) => {
  const toc = book.official_toc || book.draft_toc
  return parseToc(toc).length
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
}

// Actions
const fetchAllBooks = async () => {
  loading.value = true
  try {
    const { books } = await $fetch('/api/admin/books/list')
    allBooks.value = books || []
    
    // Auto-switch tab if no approvals needed
    if (pendingTotal.value === 0 && allBooks.value.length > 0) {
       activeTab.value = 'library'
    }
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    loading.value = false
  }
}

const approveToc = async (isbn: string, title: string) => {
  if (!confirm(`"${title}" 목차를 승인하시겠습니까?`)) return
  approvingToc.value = isbn
  try {
    const response = await $fetch('/api/admin/books/approve-toc', {
      method: 'POST',
      body: { isbn }
    })
    toast.success(response.message)
    const idx = allBooks.value.findIndex(b => b.isbn === isbn)
    if (idx >= 0) allBooks.value[idx].official_toc = allBooks.value[idx].draft_toc
  } catch (e:any) {
    toast.error(e.data?.message || '처리에 실패했습니다')
  } finally {
    approvingToc.value = null
  }
}

const approveGenre = async (isbn: string, title: string, genre: string) => {
  if (!confirm(`"${title}" 장르 승인?`)) return
  approvingGenre.value = isbn
  try {
    const response = await $fetch('/api/admin/books/approve-genre', {
      method: 'POST',
      body: { isbn }
    })
    toast.success(response.message)
    const idx = allBooks.value.findIndex(b => b.isbn === isbn)
    if (idx >= 0) allBooks.value[idx].official_genre = genre
  } catch (e:any) {
    toast.error(e.data?.message || '처리에 실패했습니다')
  } finally {
    approvingGenre.value = null
  }
}

const editToc = (book: any) => {
  editingBook.value = book
  editingTocType.value = book.official_toc ? 'official' : 'draft'
  showEditModal.value = true
}

const saveTocEdit = async (data: any) => {
  // Same logic as before
  try {
    const response = await $fetch('/api/admin/books/update-toc', {
      method: 'POST',
      body: { ...data, tocType: editingTocType.value }
    })
    toast.success(response.message)
    const idx = allBooks.value.findIndex(b => b.isbn === data.isbn)
    if (idx >= 0) {
      if (editingTocType.value === 'official') allBooks.value[idx].official_toc = JSON.stringify(data.toc)
      else allBooks.value[idx].draft_toc = JSON.stringify(data.toc)
    }
    showEditModal.value = false
  } catch (e:any) {
    toast.error(e.data?.message || '처리에 실패했습니다')
  }
}

const saveGenreEdit = async (genre: string) => {
  // Similar logic as approve but handled via modal
  if (!editingBook.value) return
  approveGenre(editingBook.value.isbn, editingBook.value.title, genre)
  showGenreModal.value = false
}

onMounted(fetchAllBooks)
</script>
