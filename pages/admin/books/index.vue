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

    <!-- 승인 모달 — 좌우 2단 -->
    <Teleport to="body">
      <div v-if="detailBook" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="detailBook = null"></div>
        <div class="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden flex flex-col">

          <!-- 헤더 -->
          <div class="flex gap-4 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <img v-if="detailBook.cover_url" :src="detailBook.cover_url" class="w-12 h-16 object-cover rounded-lg shadow-md flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-semibold text-zinc-900 dark:text-white">{{ detailBook.title }}</h3>
              <p class="text-sm text-zinc-500">{{ detailBook.author }}</p>
            </div>
            <div class="flex items-center gap-2 self-start">
              <button
                v-if="getDetailPendingCount() > 0"
                @click="approveAll(detailBook)"
                :disabled="approving !== null"
                class="px-4 py-2 text-xs font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {{ approving === 'all' ? '처리 중...' : `전체 승인 (${getDetailPendingCount()}건)` }}
              </button>
              <button @click="detailBook = null" class="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X :size="20" />
              </button>
            </div>
          </div>

          <!-- 본문: 좌우 2단 -->
          <div class="flex-1 flex overflow-hidden">

            <!-- 왼쪽: 페이지수 + 장르 -->
            <div class="w-[340px] shrink-0 border-r border-zinc-100 dark:border-zinc-800 p-6 space-y-8 overflow-y-auto">

              <!-- 페이지수 -->
              <section>
                <h4 class="text-xs font-medium text-zinc-400 mb-4">페이지수</h4>
                <template v-if="detailBook.official_pages">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl font-semibold text-blue-600">{{ detailBook.official_pages }}p</span>
                    <span class="text-[11px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">승인됨</span>
                  </div>
                </template>
                <template v-else-if="detailBook.draft_pages">
                  <p class="text-xs text-zinc-400 mb-3">사용자 입력: {{ detailBook.draft_pages }}p</p>
                  <div class="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      v-model.number="editPages"
                      min="1"
                      class="w-28 px-3 py-2.5 text-xl font-semibold bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-zinc-900 dark:text-white text-center"
                    />
                    <span class="text-zinc-400 text-lg">p</span>
                  </div>
                  <button
                    @click="approvePagesWithValue(detailBook)"
                    :disabled="approving !== null || !editPages"
                    class="w-full py-2.5 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {{ approving === `pages-${detailBook.isbn}` ? '처리 중...' : '페이지수 승인' }}
                  </button>
                </template>
                <p v-else class="text-sm text-zinc-300">없음</p>
              </section>

              <!-- 장르 -->
              <section>
                <h4 class="text-xs font-medium text-zinc-400 mb-4">장르</h4>
                <template v-if="detailBook.official_genre">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl font-semibold text-blue-600">{{ detailBook.official_genre }}</span>
                    <span class="text-[11px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">승인됨</span>
                  </div>
                </template>
                <template v-else-if="detailBook.draft_genre">
                  <p class="text-xs text-zinc-400 mb-3">사용자 입력: {{ detailBook.draft_genre }}</p>
                  <input
                    type="text"
                    v-model="editGenre"
                    class="w-full px-3 py-2.5 text-xl font-semibold bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none text-zinc-900 dark:text-white mb-3"
                  />
                  <button
                    @click="approveGenreWithValue(detailBook)"
                    :disabled="approving !== null || !editGenre?.trim()"
                    class="w-full py-2.5 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {{ approving === `genre-${detailBook.isbn}` ? '처리 중...' : '장르 승인' }}
                  </button>
                </template>
                <p v-else class="text-sm text-zinc-300">없음</p>
              </section>
            </div>

            <!-- 오른쪽: 목차 -->
            <div class="flex-1 flex flex-col overflow-hidden">
              <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <h4 class="text-xs font-medium text-zinc-400">
                  목차
                  <span v-if="detailTocData.length > 0" class="text-zinc-500 ml-1">{{ detailTocData.length }}장</span>
                </h4>
                <span v-if="detailBook.official_toc" class="text-[11px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">승인됨</span>
                <span v-else-if="detailBook.draft_toc" class="text-[11px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">대기</span>
              </div>

              <div class="flex-1 overflow-y-auto">
                <div v-if="detailTocData.length > 0">
                  <div
                    v-for="(ch, idx) in detailTocData"
                    :key="idx"
                    class="px-6 py-3 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <div class="flex items-baseline justify-between">
                      <p class="text-sm text-zinc-900 dark:text-white">
                        <span class="text-zinc-300 dark:text-zinc-500 mr-2 tabular-nums">{{ idx + 1 }}.</span>
                        {{ ch.title }}
                      </p>
                      <span v-if="ch.startPage" class="text-sm text-zinc-400 tabular-nums shrink-0 ml-4">{{ ch.startPage }}p</span>
                    </div>
                  </div>
                </div>
                <div v-else class="flex items-center justify-center h-full">
                  <p class="text-sm text-zinc-300">입력된 목차가 없습니다</p>
                </div>
              </div>

              <div v-if="detailBook.draft_toc && !detailBook.official_toc" class="flex gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  @click="editToc(detailBook)"
                  class="flex-1 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  수정
                </button>
                <button
                  @click="approveToc(detailBook)"
                  :disabled="approving !== null"
                  class="flex-1 py-2.5 text-sm font-semibold text-white bg-lime-600 hover:bg-lime-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {{ approving === `toc-${detailBook.isbn}` ? '처리 중...' : '목차 승인' }}
                </button>
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

useHead({ title: '도서 관리' })
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

const getDetailPendingCount = () => {
  if (!detailBook.value) return 0
  let c = 0
  if (detailBook.value.draft_pages && !detailBook.value.official_pages) c++
  if (detailBook.value.draft_genre && !detailBook.value.official_genre) c++
  if (detailBook.value.draft_toc && !detailBook.value.official_toc) c++
  return c
}

const approveAll = async (book: any) => {
  approving.value = 'all'
  try {
    if (book.draft_pages && !book.official_pages) {
      await $fetch('/api/admin/books/approve-pages', { method: 'POST', body: { isbn: book.isbn } })
      book.official_pages = editPages.value || book.draft_pages
    }
    if (book.draft_genre && !book.official_genre) {
      const genre = editGenre.value?.trim() || book.draft_genre
      await $fetch('/api/admin/books/approve-genre', { method: 'POST', body: { isbn: book.isbn, genre } })
      book.official_genre = genre
    }
    if (book.draft_toc && !book.official_toc) {
      await $fetch('/api/admin/books/approve-toc', { method: 'POST', body: { isbn: book.isbn } })
      book.official_toc = book.draft_toc
    }
    toast.success('전체 승인 완료')
  } catch (e: any) {
    toast.error(e.data?.message || '일부 승인에 실패했습니다')
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
