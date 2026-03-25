<template>
  <div>
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">전체 도서</p>
          <p class="text-2xl font-semibold text-zinc-900 dark:text-white">{{ allBooks.length }}</p>
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
          <p class="text-2xl font-semibold text-lime-600">{{ pendingBooks.length }}</p>
        </div>
        <div class="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg relative">
          <FileText :size="20" class="text-lime-600" />
          <span v-if="pendingBooks.length > 0" class="absolute -top-1 -right-1 flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">전체 승인 완료</p>
          <p class="text-2xl font-semibold text-blue-600">{{ fullyApprovedCount }}</p>
        </div>
        <div class="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <CheckCircle :size="20" class="text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="mb-6 flex gap-2">
      <button
        @click="activeTab = 'approvals'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
        :class="activeTab === 'approvals'
          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg'
          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
      >
        승인 대기
        <span v-if="pendingBooks.length > 0" class="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">{{ pendingBooks.length }}</span>
      </button>
      <button
        @click="activeTab = 'library'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="activeTab === 'library'
          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg'
          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
      >
        전체 도서
      </button>
    </div>

    <!-- Approvals View: 책 단위 통합 카드 -->
    <div v-if="activeTab === 'approvals'">
      <div v-if="pendingBooks.length === 0" class="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border border-zinc-200 dark:border-zinc-800 border-dashed">
        <CheckCircle :size="40" class="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
        <p class="text-zinc-500">승인 대기 중인 도서가 없습니다</p>
      </div>

      <div v-else class="space-y-4 max-h-[700px] overflow-y-auto">
        <div
          v-for="book in pendingBooks"
          :key="book.isbn"
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          <!-- 책 헤더 -->
          <div class="flex gap-4 p-5 border-b border-zinc-100 dark:border-zinc-800">
            <img v-if="book.cover_url" :src="book.cover_url" class="w-14 h-20 object-cover rounded shadow-sm flex-shrink-0" />
            <div v-else class="w-14 h-20 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center flex-shrink-0">
              <BookOpen :size="20" class="text-zinc-400" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-zinc-900 dark:text-white truncate">{{ book.title }}</h3>
              <p class="text-xs text-zinc-500 mt-0.5">{{ book.author }} · {{ book.publisher || '-' }}</p>
              <p class="text-[10px] text-zinc-400 mt-1">ISBN: {{ book.isbn }}</p>
            </div>
          </div>

          <!-- 승인 항목 3개 -->
          <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
            <!-- 1. 목차 -->
            <div class="p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <List :size="16" class="text-zinc-400" />
                  <span class="text-sm font-semibold text-zinc-900 dark:text-white">목차</span>
                  <span v-if="book.official_toc" class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">승인됨</span>
                  <span v-else-if="book.draft_toc" class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">대기</span>
                  <span v-else class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">없음</span>
                </div>
                <div class="flex gap-2" v-if="book.draft_toc && !book.official_toc">
                  <button @click="editToc(book)" class="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    수정
                  </button>
                  <button
                    @click="approveToc(book)"
                    :disabled="approving === `toc-${book.isbn}`"
                    class="px-3 py-1.5 text-xs font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check :size="12" />
                    {{ approving === `toc-${book.isbn}` ? '처리 중' : '승인' }}
                  </button>
                </div>
              </div>
              <!-- 목차 전체 (스크롤) -->
              <div v-if="book.draft_toc || book.official_toc" class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 text-xs space-y-1 max-h-[300px] overflow-y-auto">
                <div v-for="(ch, idx) in parseToc(book.official_toc || book.draft_toc)" :key="idx" class="flex justify-between py-0.5">
                  <span class="text-zinc-600 dark:text-zinc-400 truncate pr-4">{{ idx + 1 }}. {{ ch.title }}</span>
                  <span class="text-zinc-400 whitespace-nowrap font-mono">{{ ch.startPage ? `${ch.startPage}p` : `${ch.start}%` }}</span>
                </div>
              </div>
              <p v-if="book.draft_toc || book.official_toc" class="text-[10px] text-zinc-400 mt-1.5">
                총 {{ parseToc(book.official_toc || book.draft_toc).length }}개 챕터
              </p>
            </div>

            <!-- 2. 페이지수 -->
            <div class="p-5 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <FileText :size="16" class="text-zinc-400" />
                <span class="text-sm font-semibold text-zinc-900 dark:text-white">페이지수</span>
                <span v-if="book.official_pages" class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{{ book.official_pages }}p 승인됨</span>
                <span v-else-if="book.draft_pages" class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">{{ book.draft_pages }}p 대기</span>
                <span v-else class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">없음</span>
              </div>
              <button
                v-if="book.draft_pages && !book.official_pages"
                @click="approvePages(book)"
                :disabled="approving === `pages-${book.isbn}`"
                class="px-3 py-1.5 text-xs font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Check :size="12" />
                {{ approving === `pages-${book.isbn}` ? '처리 중' : '승인' }}
              </button>
            </div>

            <!-- 3. 장르 -->
            <div class="p-5 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Tag :size="16" class="text-zinc-400" />
                <span class="text-sm font-semibold text-zinc-900 dark:text-white">장르</span>
                <span v-if="book.official_genre" class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{{ book.official_genre }} 승인됨</span>
                <span v-else-if="book.draft_genre" class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">{{ book.draft_genre }} 대기</span>
                <span v-else class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">없음</span>
              </div>
              <div class="flex gap-2" v-if="book.draft_genre && !book.official_genre">
                <button @click="openEditGenre(book)" class="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  수정
                </button>
                <button
                  @click="approveGenre(book)"
                  :disabled="approving === `genre-${book.isbn}`"
                  class="px-3 py-1.5 text-xs font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Check :size="12" />
                  {{ approving === `genre-${book.isbn}` ? '처리 중' : '승인' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Library View -->
    <div v-else class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div class="relative w-full md:w-96">
          <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="도서 검색..."
            class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div class="max-h-[600px] overflow-y-auto">
        <table class="w-full">
          <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 z-10">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500">책 정보</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500">페이지</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500">장르</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500">목차</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500">승인</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-zinc-500">작업</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr v-for="book in filteredBooks" :key="book.isbn" class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img v-if="book.cover_url" :src="book.cover_url" class="w-8 h-12 object-cover rounded shadow-sm flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="font-medium text-sm text-zinc-900 dark:text-white truncate max-w-[200px]">{{ book.title }}</p>
                    <p class="text-xs text-zinc-500 truncate">{{ book.author }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                {{ book.official_pages || book.draft_pages || '-' }}p
              </td>
              <td class="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {{ book.official_genre || book.draft_genre || '-' }}
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-xs font-medium" :class="book.official_toc ? 'text-blue-600' : book.draft_toc ? 'text-amber-600' : 'text-zinc-400'">
                  {{ book.official_toc ? '승인됨' : book.draft_toc ? '대기' : '-' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="isFullyApproved(book)" class="text-xs font-semibold text-blue-600">완료</span>
                <span v-else class="text-xs font-semibold text-amber-600">{{ getPendingCount(book) }}건 대기</span>
              </td>
              <td class="px-6 py-4 text-right">
                <button @click="editToc(book)" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  <Edit :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 모달 -->
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
import { BookOpen, FileText, CheckCircle, Edit, Search, Check, Tag, List } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocEditModal from '~/components/admin/TocEditModal.vue'
import EditGenreModal from '~/components/admin/EditGenreModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToastStore()

const loading = ref(true)
const allBooks = ref<any[]>([])
const activeTab = ref<'approvals' | 'library'>('approvals')
const approving = ref<string | null>(null)
const showEditModal = ref(false)
const showGenreModal = ref(false)
const editingBook = ref<any>(null)
const editingTocType = ref<'draft' | 'official'>('draft')
const searchQuery = ref('')

// 승인 대기 책: 목차, 페이지, 장르 중 하나라도 미승인
const pendingBooks = computed(() =>
  allBooks.value.filter(b =>
    (b.draft_toc && !b.official_toc) ||
    (b.draft_pages && !b.official_pages) ||
    (b.draft_genre && !b.official_genre)
  )
)

const fullyApprovedCount = computed(() =>
  allBooks.value.filter(b => b.official_toc && b.official_pages && b.official_genre).length
)

const isFullyApproved = (book: any) =>
  (!book.draft_toc || book.official_toc) &&
  (!book.draft_pages || book.official_pages) &&
  (!book.draft_genre || book.official_genre)

const getPendingCount = (book: any) => {
  let count = 0
  if (book.draft_toc && !book.official_toc) count++
  if (book.draft_pages && !book.official_pages) count++
  if (book.draft_genre && !book.official_genre) count++
  return count
}

const filteredBooks = computed(() => {
  if (!searchQuery.value.trim()) return allBooks.value
  const q = searchQuery.value.toLowerCase().trim()
  return allBooks.value.filter(b =>
    b.title?.toLowerCase().includes(q) ||
    b.author?.toLowerCase().includes(q) ||
    b.isbn?.toLowerCase().includes(q)
  )
})

const parseToc = (tocData: any) => {
  if (Array.isArray(tocData)) return tocData
  if (typeof tocData === 'string') {
    try { return JSON.parse(tocData) } catch { return [] }
  }
  return []
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })

// API 호출
const fetchAllBooks = async () => {
  loading.value = true
  try {
    const { books } = await $fetch('/api/admin/books/list')
    allBooks.value = books || []
    if (pendingBooks.value.length === 0 && allBooks.value.length > 0) {
      activeTab.value = 'library'
    }
  } catch { } finally {
    loading.value = false
  }
}

const approveToc = async (book: any) => {
  approving.value = `toc-${book.isbn}`
  try {
    const res = await $fetch('/api/admin/books/approve-toc', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(res.message)
    book.official_toc = book.draft_toc
    book.official_pages = book.draft_pages
  } catch (e: any) {
    toast.error(e.data?.message || '승인에 실패했습니다')
  } finally {
    approving.value = null
  }
}

const approvePages = async (book: any) => {
  approving.value = `pages-${book.isbn}`
  try {
    const res = await $fetch('/api/admin/books/approve-pages', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(res.message)
    book.official_pages = book.draft_pages
  } catch (e: any) {
    toast.error(e.data?.message || '승인에 실패했습니다')
  } finally {
    approving.value = null
  }
}

const approveGenre = async (book: any) => {
  approving.value = `genre-${book.isbn}`
  try {
    const res = await $fetch('/api/admin/books/approve-genre', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(res.message)
    book.official_genre = book.draft_genre
  } catch (e: any) {
    toast.error(e.data?.message || '승인에 실패했습니다')
  } finally {
    approving.value = null
  }
}

const openEditGenre = (book: any) => {
  editingBook.value = book
  showGenreModal.value = true
}

const editToc = (book: any) => {
  editingBook.value = book
  editingTocType.value = book.official_toc ? 'official' : 'draft'
  showEditModal.value = true
}

const saveTocEdit = async (data: any) => {
  try {
    const res = await $fetch('/api/admin/books/update-toc', { method: 'POST', body: { ...data, tocType: editingTocType.value } })
    toast.success(res.message)
    const idx = allBooks.value.findIndex(b => b.isbn === data.isbn)
    if (idx >= 0) {
      if (editingTocType.value === 'official') allBooks.value[idx].official_toc = data.toc
      else allBooks.value[idx].draft_toc = data.toc
    }
    showEditModal.value = false
  } catch (e: any) {
    toast.error(e.data?.message || '저장에 실패했습니다')
  }
}

const saveGenreEdit = async (genre: string) => {
  if (!editingBook.value) return
  try {
    await $fetch('/api/admin/books/approve-genre', { method: 'POST', body: { isbn: editingBook.value.isbn, genre } })
    const idx = allBooks.value.findIndex(b => b.isbn === editingBook.value.isbn)
    if (idx >= 0) editingBook.value.official_genre = genre
    toast.success('장르가 승인되었습니다')
  } catch (e: any) {
    toast.error(e.data?.message || '처리에 실패했습니다')
  }
  showGenreModal.value = false
}

onMounted(fetchAllBooks)
</script>
