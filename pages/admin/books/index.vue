<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <!-- Header -->
    <div class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search & Filter -->
      <div class="mb-6 space-y-4">
        <!-- Search Bar -->
        <div class="relative">
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
            class="px-4 py-2 rounded-lg font-medium transition-all"
            :class="filterStatus === filter.value
              ? 'bg-lime-400 text-black'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            "
          >
            {{ filter.label }}
            <span v-if="filter.count !== undefined" class="ml-1.5 text-sm opacity-75">({{ filter.count }})</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm text-zinc-500">불러오는 중...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredBooks.length === 0" class="text-center py-16">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          {{ searchQuery ? '검색 결과가 없습니다' : '등록된 책이 없습니다' }}
        </h3>
        <p class="text-sm text-zinc-500">
          {{ searchQuery ? '다른 검색어를 입력해보세요.' : '새로운 책이 추가되면 여기에 표시됩니다.' }}
        </p>
      </div>

      <!-- Books List -->
      <div v-else class="space-y-4">
        <div
          v-for="book in filteredBooks"
          :key="book.isbn"
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
        >
          <!-- Book Info -->
          <div class="flex gap-4 mb-6">
            <img
              v-if="book.cover_url"
              :src="book.cover_url"
              class="w-20 h-28 object-cover rounded shadow-md"
            />
            <div class="w-20 h-28 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center" v-else>
              <BookOpen :size="32" class="text-zinc-400" />
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between mb-1">
                <h3 class="text-lg font-bold text-zinc-900 dark:text-white">{{ book.title }}</h3>
                <div class="flex gap-2">
                  <span
                    v-if="book.official_toc"
                    class="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-medium"
                  >
                    승인 완료
                  </span>
                  <span
                    v-else-if="book.draft_toc"
                    class="text-xs bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 px-2 py-1 rounded font-medium"
                  >
                    승인 대기
                  </span>
                  <span
                    v-else
                    class="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded font-medium"
                  >
                    목차 없음
                  </span>
                </div>
              </div>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{{ book.author }}</p>
              <div class="flex items-center gap-4 text-xs text-zinc-500">
                <span>ISBN: {{ book.isbn }}</span>
                <span>•</span>
                <span>{{ book.total_pages }}페이지</span>
                <span>•</span>
                <span>{{ formatDate(book.created_at) }} 등록</span>
              </div>
            </div>
          </div>

          <!-- TOC Preview -->
          <div v-if="book.draft_toc || book.official_toc" class="mb-6">
            <h4 class="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <FileText :size="16" />
              {{ book.official_toc ? '승인된 목차' : '대기 중인 목차' }}
            </h4>
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="(chapter, idx) in parseToc(book.official_toc || book.draft_toc)"
                :key="idx"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-zinc-700 dark:text-zinc-300">{{ chapter.title }}</span>
                <span class="text-zinc-500 text-xs">{{ chapter.start }}% ~ {{ chapter.end }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="mb-6 text-center py-8 text-sm text-zinc-500">
            목차가 등록되지 않았습니다.
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <!-- Approve button - only for pending books -->
            <button
              v-if="book.draft_toc && !book.official_toc"
              @click="approveToc(book.isbn, book.title)"
              :disabled="approving === book.isbn"
              class="flex-1 bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle :size="18" />
              {{ approving === book.isbn ? '승인 중...' : '승인하기' }}
            </button>

            <!-- Edit button - for all books with TOC -->
            <button
              v-if="book.draft_toc || book.official_toc"
              @click="editToc(book)"
              :class="book.official_toc ? 'flex-1' : 'px-6'"
              class="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Edit :size="18" />
              {{ book.official_toc ? '승인 목차 수정' : '목차 수정' }}
            </button>
          </div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, BookOpen, FileText, CheckCircle, Edit, Search } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocEditModal from '~/components/admin/TocEditModal.vue'

definePageMeta({
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const loading = ref(true)
const allBooks = ref<any[]>([])
const approving = ref<string | null>(null)
const showEditModal = ref(false)
const editingBook = ref<any>(null)
const editingTocType = ref<'draft' | 'official'>('draft')

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

const parseToc = (tocJson: string) => {
  try {
    return JSON.parse(tocJson)
  } catch {
    return []
  }
}

const approveToc = async (isbn: string, title: string) => {
  if (!confirm(`"${title}" 목차를 승인하시겠습니까?\n\n승인 후 다른 그룹에서 이 목차를 사용할 수 있습니다.`)) {
    return
  }

  approving.value = isbn

  try {
    const response = await $fetch('/api/admin/books/approve', {
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
    console.error('[Admin] Approve error:', error)
    toast.error(error.data?.message || '목차 승인에 실패했습니다.')
  } finally {
    approving.value = null
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
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
