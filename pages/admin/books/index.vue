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
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">승인 필요</p>
          <p class="text-2xl font-semibold text-amber-600">{{ pendingBooks.length }}</p>
        </div>
        <div class="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
          <FileText :size="20" class="text-amber-600" />
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

    <!-- 검색 -->
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-4 items-center">
        <div class="relative flex-1 max-w-md">
          <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="도서 검색..."
            class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="filterMode = 'all'"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="filterMode === 'all' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          >전체</button>
          <button
            @click="filterMode = 'pending'"
            class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="filterMode === 'pending' ? 'bg-amber-500 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          >
            승인 필요
            <span v-if="pendingBooks.length > 0" class="ml-1 text-xs">{{ pendingBooks.length }}</span>
          </button>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="max-h-[600px] overflow-y-auto">
        <table class="w-full">
          <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 z-10">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500">도서</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-zinc-500">페이지</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-zinc-500">장르</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-zinc-500">목차</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-zinc-500">승인</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
            <tr
              v-for="book in displayBooks"
              :key="book.isbn"
              @click="openDetail(book)"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <img v-if="book.cover_url" :src="book.cover_url" class="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="font-medium text-sm text-zinc-900 dark:text-white truncate max-w-[250px]">{{ book.title }}</p>
                    <p class="text-xs text-zinc-400">{{ book.author }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <span v-if="book.official_pages" class="text-sm text-zinc-700 dark:text-zinc-300">{{ book.official_pages }}p</span>
                <span v-else-if="book.draft_pages" class="text-sm text-amber-600">{{ book.draft_pages }}p</span>
                <span v-else class="text-sm text-zinc-300">-</span>
              </td>
              <td class="px-4 py-4 text-center">
                <span v-if="book.official_genre" class="text-sm text-zinc-700 dark:text-zinc-300">{{ book.official_genre }}</span>
                <span v-else-if="book.draft_genre" class="text-sm text-amber-600">{{ book.draft_genre }}</span>
                <span v-else class="text-sm text-zinc-300">-</span>
              </td>
              <td class="px-4 py-4 text-center">
                <span v-if="book.official_toc" class="text-xs text-blue-600 font-medium">{{ parseToc(book.official_toc).length }}장</span>
                <span v-else-if="book.draft_toc" class="text-xs text-amber-600 font-medium">{{ parseToc(book.draft_toc).length }}장</span>
                <span v-else class="text-sm text-zinc-300">-</span>
              </td>
              <td class="px-4 py-4 text-center">
                <span v-if="isFullyApproved(book)" class="text-xs font-medium text-blue-600">완료</span>
                <span v-else class="text-xs font-medium text-amber-600">{{ getPendingCount(book) }}건</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="displayBooks.length === 0" class="text-center py-12 text-zinc-400">
          검색 결과가 없습니다
        </div>
      </div>
    </div>

    <!-- 승인 모달 -->
    <Teleport to="body">
      <div v-if="detailBook" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="detailBook = null"></div>
        <div class="relative w-full max-w-xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden flex flex-col">

          <!-- 모달 헤더: 책 정보 -->
          <div class="flex gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <img v-if="detailBook.cover_url" :src="detailBook.cover_url" class="w-16 h-22 object-cover rounded-lg shadow-md flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-1">{{ detailBook.title }}</h3>
              <p class="text-sm text-zinc-500">{{ detailBook.author }}</p>
            </div>
            <button @click="detailBook = null" class="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 self-start">
              <X :size="20" />
            </button>
          </div>

          <!-- 탭 -->
          <div class="flex border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <button
              v-for="tab in detailTabs"
              :key="tab.key"
              @click="detailTab = tab.key"
              class="flex-1 py-3 text-sm font-medium text-center transition-colors relative"
              :class="detailTab === tab.key ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'"
            >
              {{ tab.label }}
              <span v-if="tab.pending" class="ml-1 w-2 h-2 bg-amber-500 rounded-full inline-block"></span>
              <div v-if="detailTab === tab.key" class="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white"></div>
            </button>
          </div>

          <!-- 탭 내용 -->
          <div class="flex-1 overflow-y-auto p-6">

            <!-- 페이지수 탭 -->
            <div v-if="detailTab === 'pages'">
              <template v-if="detailBook.official_pages">
                <div class="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 text-center mb-4">
                  <p class="text-xs text-blue-500 mb-1">승인됨</p>
                  <p class="text-3xl font-semibold text-blue-600">{{ detailBook.official_pages }}p</p>
                </div>
              </template>
              <template v-else-if="detailBook.draft_pages">
                <p class="text-xs text-zinc-400 mb-1">사용자가 입력한 값</p>
                <p class="text-sm text-zinc-500 mb-4">{{ detailBook.draft_pages }}p</p>
                <div class="mb-5">
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">승인할 페이지수</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      v-model.number="editPages"
                      min="1"
                      class="flex-1 px-4 py-3 text-lg font-semibold bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                    />
                    <span class="text-lg text-zinc-400">p</span>
                  </div>
                </div>
                <button
                  @click="approvePagesWithValue(detailBook)"
                  :disabled="approving !== null || !editPages"
                  class="w-full py-3 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {{ approving === `pages-${detailBook.isbn}` ? '처리 중...' : '페이지수 승인' }}
                </button>
              </template>
              <template v-else>
                <div class="text-center py-8">
                  <p class="text-sm text-zinc-400">입력된 페이지수가 없습니다</p>
                </div>
              </template>
            </div>

            <!-- 장르 탭 -->
            <div v-if="detailTab === 'genre'">
              <template v-if="detailBook.official_genre">
                <div class="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 text-center mb-4">
                  <p class="text-xs text-blue-500 mb-1">승인됨</p>
                  <p class="text-2xl font-semibold text-blue-600">{{ detailBook.official_genre }}</p>
                </div>
              </template>
              <template v-else-if="detailBook.draft_genre">
                <p class="text-xs text-zinc-400 mb-1">사용자가 입력한 값</p>
                <p class="text-sm text-zinc-500 mb-4">{{ detailBook.draft_genre }}</p>
                <div class="mb-5">
                  <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">승인할 장르</label>
                  <input
                    type="text"
                    v-model="editGenre"
                    class="w-full px-4 py-3 text-lg font-semibold bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                  />
                </div>
                <button
                  @click="approveGenreWithValue(detailBook)"
                  :disabled="approving !== null || !editGenre?.trim()"
                  class="w-full py-3 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {{ approving === `genre-${detailBook.isbn}` ? '처리 중...' : '장르 승인' }}
                </button>
              </template>
              <template v-else>
                <div class="text-center py-8">
                  <p class="text-sm text-zinc-400">입력된 장르가 없습니다</p>
                </div>
              </template>
            </div>

            <!-- 목차 탭 -->
            <div v-if="detailTab === 'toc'">
              <template v-if="detailTocData.length > 0">
                <p class="text-xs text-zinc-400 mb-3">
                  {{ detailBook.official_toc ? '승인된 목차' : '사용자 입력 목차' }}
                  <span class="text-zinc-500 font-medium ml-1">{{ detailTocData.length }}장</span>
                </p>
                <div class="space-y-0">
                  <div
                    v-for="(ch, idx) in detailTocData"
                    :key="idx"
                    class="py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  >
                    <div class="flex items-start gap-3">
                      <span class="text-zinc-300 dark:text-zinc-600 text-sm w-6 text-right shrink-0 pt-0.5">{{ idx + 1 }}</span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-zinc-900 dark:text-white leading-relaxed">{{ ch.title }}</p>
                        <p class="text-xs text-zinc-400 mt-0.5">{{ ch.startPage ? `${ch.startPage}페이지부터` : '' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="text-center py-8">
                <p class="text-sm text-zinc-400">입력된 목차가 없습니다</p>
              </div>
              <div v-if="detailBook.draft_toc && !detailBook.official_toc" class="flex gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  @click="editToc(detailBook)"
                  class="flex-1 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  수정
                </button>
                <button
                  @click="approveToc(detailBook)"
                  :disabled="approving !== null"
                  class="flex-1 py-3 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {{ approving === `toc-${detailBook.isbn}` ? '처리 중...' : '목차 승인' }}
                </button>
              </div>
              <div v-else-if="detailBook.official_toc" class="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <p class="text-sm text-blue-600 text-center">승인 완료</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 기존 모달 -->
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
import { BookOpen, FileText, CheckCircle, Search, Check, X } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocEditModal from '~/components/admin/TocEditModal.vue'
import EditGenreModal from '~/components/admin/EditGenreModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToastStore()
const loading = ref(true)
const allBooks = ref<any[]>([])
const approving = ref<string | null>(null)
const showEditModal = ref(false)
const showGenreModal = ref(false)
const editingBook = ref<any>(null)
const editingTocType = ref<'draft' | 'official'>('draft')
const searchQuery = ref('')
const filterMode = ref<'all' | 'pending'>('all')

// 승인 모달
const detailBook = ref<any>(null)
const detailTab = ref<'pages' | 'genre' | 'toc'>('pages')

const detailTabs = computed(() => {
  if (!detailBook.value) return []
  return [
    { key: 'pages', label: '페이지수', pending: detailBook.value.draft_pages && !detailBook.value.official_pages },
    { key: 'genre', label: '장르', pending: detailBook.value.draft_genre && !detailBook.value.official_genre },
    { key: 'toc', label: '목차', pending: detailBook.value.draft_toc && !detailBook.value.official_toc }
  ]
})

const detailTocData = computed(() => {
  if (!detailBook.value) return []
  return parseToc(detailBook.value.official_toc || detailBook.value.draft_toc)
})

// 수정 가능 값
const editPages = ref<number | null>(null)
const editGenre = ref('')

const openDetail = (book: any) => {
  detailBook.value = book
  editPages.value = book.draft_pages || book.official_pages || null
  editGenre.value = book.draft_genre || book.official_genre || ''
  if (book.draft_pages && !book.official_pages) detailTab.value = 'pages'
  else if (book.draft_genre && !book.official_genre) detailTab.value = 'genre'
  else if (book.draft_toc && !book.official_toc) detailTab.value = 'toc'
  else detailTab.value = 'pages'
}

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
  let c = 0
  if (book.draft_toc && !book.official_toc) c++
  if (book.draft_pages && !book.official_pages) c++
  if (book.draft_genre && !book.official_genre) c++
  return c
}

const displayBooks = computed(() => {
  let books = filterMode.value === 'pending' ? pendingBooks.value : allBooks.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    books = books.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q)
    )
  }
  return books
})

const parseToc = (tocData: any) => {
  if (Array.isArray(tocData)) return tocData
  if (typeof tocData === 'string') { try { return JSON.parse(tocData) } catch { return [] } }
  return []
}

// API
const fetchAllBooks = async () => {
  loading.value = true
  try {
    const { books } = await $fetch('/api/admin/books/list')
    allBooks.value = books || []
  } catch { } finally { loading.value = false }
}

const approveToc = async (book: any) => {
  approving.value = `toc-${book.isbn}`
  try {
    const res = await $fetch('/api/admin/books/approve-toc', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(res.message)
    book.official_toc = book.draft_toc
    book.official_pages = book.draft_pages
  } catch (e: any) { toast.error(e.data?.message || '승인에 실패했습니다') }
  finally { approving.value = null }
}

const approvePages = async (book: any) => {
  approving.value = `pages-${book.isbn}`
  try {
    const res = await $fetch('/api/admin/books/approve-pages', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(res.message)
    book.official_pages = book.draft_pages
  } catch (e: any) { toast.error(e.data?.message || '승인에 실패했습니다') }
  finally { approving.value = null }
}

const approvePagesWithValue = async (book: any) => {
  if (!editPages.value) return
  approving.value = `pages-${book.isbn}`
  try {
    // draft_pages를 수정된 값으로 업데이트 후 승인
    const serviceRes = await $fetch('/api/admin/books/update-toc', {
      method: 'POST',
      body: { isbn: book.isbn, totalPages: editPages.value, toc: parseToc(book.draft_toc || book.official_toc), tocType: 'draft' }
    })
    book.draft_pages = editPages.value
    const res = await $fetch('/api/admin/books/approve-pages', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(`${editPages.value}p로 승인되었습니다`)
    book.official_pages = editPages.value
  } catch (e: any) { toast.error(e.data?.message || '승인에 실패했습니다') }
  finally { approving.value = null }
}

const approveGenreWithValue = async (book: any) => {
  if (!editGenre.value?.trim()) return
  approving.value = `genre-${book.isbn}`
  try {
    await $fetch('/api/admin/books/approve-genre', { method: 'POST', body: { isbn: book.isbn, genre: editGenre.value.trim() } })
    toast.success(`"${editGenre.value.trim()}" 장르로 승인되었습니다`)
    book.official_genre = editGenre.value.trim()
  } catch (e: any) { toast.error(e.data?.message || '승인에 실패했습니다') }
  finally { approving.value = null }
}

const approveGenre = async (book: any) => {
  approving.value = `genre-${book.isbn}`
  try {
    const res = await $fetch('/api/admin/books/approve-genre', { method: 'POST', body: { isbn: book.isbn } })
    toast.success(res.message)
    book.official_genre = book.draft_genre
  } catch (e: any) { toast.error(e.data?.message || '승인에 실패했습니다') }
  finally { approving.value = null }
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
  } catch (e: any) { toast.error(e.data?.message || '저장에 실패했습니다') }
}

const saveGenreEdit = async (genre: string) => {
  if (!editingBook.value) return
  try {
    await $fetch('/api/admin/books/approve-genre', { method: 'POST', body: { isbn: editingBook.value.isbn, genre } })
    editingBook.value.official_genre = genre
    toast.success('장르가 승인되었습니다')
  } catch (e: any) { toast.error(e.data?.message || '처리에 실패했습니다') }
  showGenreModal.value = false
}

onMounted(fetchAllBooks)
</script>
