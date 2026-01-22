<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <!-- Header -->
    <div class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
      <div class="px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <ArrowLeft :size="20" />
            </NuxtLink>
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white">도서 목차 관리</h1>
          </div>
          <div class="text-sm text-zinc-500">
            전체: <span class="font-bold">{{ allBooks.length }}</span>개 /
            대기: <span class="font-bold text-lime-500">{{ pendingCount }}</span>개 /
            승인: <span class="font-bold text-blue-500">{{ approvedCount }}</span>개
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-8 py-8">
      <!-- Search & Filter -->
      <div class="mb-6 flex items-center gap-4">
        <!-- Search Bar -->
        <div class="relative flex-1">
          <Search :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="제목, 저자, ISBN으로 검색..."
            class="w-full pl-12 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="filterStatus = filter.value"
            class="px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap"
            :class="filterStatus === filter.value
              ? 'bg-lime-400 text-black'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            "
          >
            {{ filter.label }} <span class="ml-1.5 text-sm opacity-75">({{ filter.count }})</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm text-zinc-500">불러오는 중...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBooks.length === 0" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center py-16">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          {{ searchQuery ? '검색 결과가 없습니다' : '등록된 책이 없습니다' }}
        </h3>
        <p class="text-sm text-zinc-500">
          {{ searchQuery ? '다른 검색어를 입력해보세요.' : '새로운 책이 추가되면 여기에 표시됩니다.' }}
        </p>
      </div>

      <!-- Books Table -->
      <div v-else class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">책</th>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">저자</th>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">장르</th>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">목차</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">챕터 수</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">등록일</th>
              <th class="text-right px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">작업</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <template v-for="book in filteredBooks" :key="book.isbn">
              <!-- Main Row -->
              <tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <!-- Book Title with Cover -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <img
                      v-if="book.cover_url"
                      :src="book.cover_url"
                      class="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                    />
                    <div class="w-10 h-14 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center flex-shrink-0" v-else>
                      <BookOpen :size="16" class="text-zinc-400" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-zinc-900 dark:text-white truncate">{{ book.title }}</p>
                      <p class="text-xs text-zinc-500 truncate">ISBN: {{ book.isbn }}</p>
                    </div>
                  </div>
                </td>

                <!-- Author -->
                <td class="px-6 py-4">
                  <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ book.author }}</p>
                </td>

                <!-- Genre Status Badge -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1.5">
                    <GenreBadge
                      v-if="book.official_genre || book.draft_genre"
                      :genre="book.official_genre || book.draft_genre"
                      size="sm"
                    />
                    <span
                      v-if="book.draft_genre && !book.official_genre"
                      class="text-[10px] font-bold text-lime-600 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/20 px-1.5 py-0.5 rounded"
                    >
                      대기
                    </span>
                    <span
                      v-else-if="!book.official_genre && !book.draft_genre"
                      class="text-xs text-zinc-400"
                    >
                      -
                    </span>
                  </div>
                </td>

                <!-- TOC Status Badge -->
                <td class="px-6 py-4">
                  <span
                    v-if="book.official_toc"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  >
                    승인 완료
                  </span>
                  <span
                    v-else-if="book.draft_toc"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400"
                  >
                    승인 대기
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  >
                    목차 없음
                  </span>
                </td>

                <!-- Chapter Count -->
                <td class="px-6 py-4 text-center">
                  <span class="text-sm text-zinc-700 dark:text-zinc-300">
                    {{ getChapterCount(book) }}
                  </span>
                </td>

                <!-- Created Date -->
                <td class="px-6 py-4 text-center">
                  <span class="text-xs text-zinc-500">{{ formatDate(book.created_at) }}</span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <!-- View TOC Button -->
                    <button
                      v-if="book.draft_toc || book.official_toc"
                      @click="toggleTocView(book.isbn)"
                      class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                      title="목차 보기"
                    >
                      <ChevronDown
                        :size="18"
                        class="transition-transform"
                        :class="{ 'rotate-180': expandedBookId === book.isbn }"
                      />
                    </button>

                    <!-- Edit Button -->
                    <button
                      v-if="book.draft_toc || book.official_toc"
                      @click="editToc(book)"
                      class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                      title="목차 수정"
                    >
                      <Edit :size="18" />
                    </button>

                    <!-- Approve Genre Button -->
                    <button
                      v-if="book.draft_genre && !book.official_genre"
                      @click="approveGenre(book.isbn, book.title, book.draft_genre)"
                      :disabled="approvingGenre === book.isbn"
                      class="px-3 py-1.5 bg-purple-400 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      title="장르 승인"
                    >
                      {{ approvingGenre === book.isbn ? '승인 중...' : '장르 승인' }}
                    </button>

                    <!-- Approve TOC Button -->
                    <button
                      v-if="book.draft_toc && !book.official_toc"
                      @click="approveToc(book.isbn, book.title)"
                      :disabled="approvingToc === book.isbn"
                      class="px-3 py-1.5 bg-lime-400 hover:bg-lime-500 text-black text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      title="목차 승인"
                    >
                      {{ approvingToc === book.isbn ? '승인 중...' : '목차 승인' }}
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Expandable TOC Preview Row -->
              <tr v-if="expandedBookId === book.isbn && (book.draft_toc || book.official_toc)" class="bg-zinc-50 dark:bg-zinc-800/30">
                <td colspan="6" class="px-6 py-4">
                  <div class="flex items-start gap-2 mb-3">
                    <FileText :size="16" class="text-zinc-500 mt-0.5" />
                    <h4 class="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      {{ book.official_toc ? '승인된 목차' : '대기 중인 목차' }}
                    </h4>
                  </div>
                  <div class="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div
                      v-for="(chapter, idx) in parseToc(book.official_toc || book.draft_toc)"
                      :key="idx"
                      class="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-white dark:bg-zinc-900"
                    >
                      <span class="text-zinc-700 dark:text-zinc-300 flex-1 truncate">
                        <span class="text-zinc-400 mr-2">{{ idx + 1 }}.</span>{{ chapter.title }}
                      </span>
                      <span class="text-zinc-500 text-xs ml-4">
                        <template v-if="chapter.startPage">
                          p.{{ chapter.startPage }} ~ 
                          p.{{ 
                            parseToc(book.official_toc || book.draft_toc)[idx + 1]?.startPage 
                            ? parseToc(book.official_toc || book.draft_toc)[idx + 1].startPage - 1 
                            : book.total_pages || '?' 
                          }}
                        </template>
                        <template v-else>
                          {{ chapter.start.toFixed(0) }}% ~ {{ chapter.end.toFixed(0) }}%
                        </template>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TOC Edit Modal -->
    <TocEditModal
      :show="showEditModal"
      :book="editingBook"
      :toc-type="editingTocType"
      @close="showEditModal = false"
      @save="saveTocEdit"
    />

    <!-- Genre Edit Modal -->
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
import { ArrowLeft, BookOpen, FileText, CheckCircle, Edit, Search, ChevronDown } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocEditModal from '~/components/admin/TocEditModal.vue'
import EditGenreModal from '~/components/admin/EditGenreModal.vue'

definePageMeta({
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const loading = ref(true)
const allBooks = ref<any[]>([])
const approvingToc = ref<string | null>(null)
const approvingGenre = ref<string | null>(null)
const showEditModal = ref(false)
const showGenreModal = ref(false)
const editingBook = ref<any>(null)
const editingTocType = ref<'draft' | 'official'>('draft')
const expandedBookId = ref<string | null>(null)

// ... (중략: 기존 computed 및 onMounted 로직) ...

const openEditGenre = (book: any) => {
  editingBook.value = book
  showGenreModal.value = true
}

const saveGenreEdit = async (genre: string) => {
  if (!editingBook.value) return

  try {
    const response = await $fetch('/api/admin/books/approve-genre', {
      method: 'POST',
      body: { 
        isbn: editingBook.value.isbn,
        genre 
      }
    })

    toast.success(response.message)

    // Update local data
    const bookIndex = allBooks.value.findIndex(b => b.isbn === editingBook.value.isbn)
    if (bookIndex >= 0) {
      allBooks.value[bookIndex].official_genre = genre
    }

    showGenreModal.value = false
  } catch (error: any) {
    console.error('[Admin] Genre update error:', error)
    toast.error(error.data?.message || '장르 수정에 실패했습니다.')
  }
}

// Search & Filter
const searchQuery = ref('')
const filterStatus = ref<'all' | 'pending' | 'approved'>('all')

// Computed
const pendingCount = computed(() => {
  return allBooks.value.filter(b => b.draft_toc && !b.official_toc).length
})

const approvedCount = computed(() => {
  return allBooks.value.filter(b => b.official_toc).length
})

const filters = computed(() => [
  { label: '전체', value: 'all' as const, count: allBooks.value.length },
  { label: '승인 대기', value: 'pending' as const, count: pendingCount.value },
  { label: '승인 완료', value: 'approved' as const, count: approvedCount.value }
])

const filteredBooks = computed(() => {
  let books = allBooks.value

  // Filter by status
  if (filterStatus.value === 'pending') {
    books = books.filter(b => b.draft_toc && !b.official_toc)
  } else if (filterStatus.value === 'approved') {
    books = books.filter(b => b.official_toc)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    books = books.filter(b => {
      return (
        b.title?.toLowerCase().includes(query) ||
        b.author?.toLowerCase().includes(query) ||
        b.isbn?.toLowerCase().includes(query)
      )
    })
  }

  return books
})

onMounted(async () => {
  await fetchAllBooks()
})

const fetchAllBooks = async () => {
  loading.value = true

  try {
    const { data, error } = await client
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    allBooks.value = data || []
    console.log('[Admin] Total books:', allBooks.value.length)
  } catch (error: any) {
    console.error('[Admin] Fetch error:', error)
    toast.error('도서 목록을 불러오는 데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

const parseToc = (tocData: any) => {
  // If already an object/array, return as is
  if (Array.isArray(tocData)) {
    return tocData
  }

  // If it's an object (but not array), might be invalid - return empty
  if (typeof tocData === 'object' && tocData !== null) {
    return []
  }

  // If it's a string, try to parse it
  if (typeof tocData === 'string') {
    try {
      return JSON.parse(tocData)
    } catch {
      return []
    }
  }

  // Fallback for null/undefined
  return []
}

const approveToc = async (isbn: string, title: string) => {
  if (!confirm(`"${title}" 목차를 승인하시겠습니까?\n\n승인 후 다른 그룹에서 이 목차를 사용할 수 있습니다.`)) {
    return
  }

  approvingToc.value = isbn

  try {
    const response = await $fetch('/api/admin/books/approve-toc', {
      method: 'POST',
      body: { isbn }
    })

    toast.success(response.message)

    // Update local data - copy draft_toc to official_toc
    const bookIndex = allBooks.value.findIndex(b => b.isbn === isbn)
    if (bookIndex >= 0) {
      allBooks.value[bookIndex].official_toc = allBooks.value[bookIndex].draft_toc
    }
  } catch (error: any) {
    console.error('[Admin] Approve TOC error:', error)
    toast.error(error.data?.message || '목차 승인에 실패했습니다.')
  } finally {
    approvingToc.value = null
  }
}

const approveGenre = async (isbn: string, title: string, genre: string) => {
  if (!confirm(`"${title}"의 장르를 "${genre}"로 승인하시겠습니까?\n\n승인 후 다른 그룹에서 이 장르를 사용할 수 있습니다.`)) {
    return
  }

  approvingGenre.value = isbn

  try {
    const response = await $fetch('/api/admin/books/approve-genre', {
      method: 'POST',
      body: { isbn }
    })

    toast.success(response.message)

    // Update local data - copy draft_genre to official_genre
    const bookIndex = allBooks.value.findIndex(b => b.isbn === isbn)
    if (bookIndex >= 0) {
      allBooks.value[bookIndex].official_genre = allBooks.value[bookIndex].draft_genre
    }
  } catch (error: any) {
    console.error('[Admin] Approve genre error:', error)
    toast.error(error.data?.message || '장르 승인에 실패했습니다.')
  } finally {
    approvingGenre.value = null
  }
}

const editToc = (book: any) => {
  editingBook.value = book
  // If book has official_toc, edit that. Otherwise edit draft_toc
  editingTocType.value = book.official_toc ? 'official' : 'draft'
  showEditModal.value = true
}

const saveTocEdit = async (data: { isbn: string; totalPages: number; toc: any[] }) => {
  try {
    const response = await $fetch('/api/admin/books/update-toc', {
      method: 'POST',
      body: {
        ...data,
        tocType: editingTocType.value
      }
    })

    toast.success(response.message)

    // Update local data
    const bookIndex = allBooks.value.findIndex(b => b.isbn === data.isbn)
    if (bookIndex >= 0) {
      if (editingTocType.value === 'official') {
        allBooks.value[bookIndex].official_toc = JSON.stringify(data.toc)
      } else {
        allBooks.value[bookIndex].draft_toc = JSON.stringify(data.toc)
      }
      allBooks.value[bookIndex].total_pages = data.totalPages
    }

    // Close modal
    showEditModal.value = false
  } catch (error: any) {
    console.error('[Admin] TOC update error:', error)
    toast.error(error.data?.message || '목차 수정에 실패했습니다.')
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = String(date.getFullYear()).slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}.${month}.${day}`
}

const toggleTocView = (isbn: string) => {
  expandedBookId.value = expandedBookId.value === isbn ? null : isbn
}

const getChapterCount = (book: any) => {
  const toc = book.official_toc || book.draft_toc
  if (!toc) return '-'
  const chapters = parseToc(toc)
  return chapters.length
}
</script>
