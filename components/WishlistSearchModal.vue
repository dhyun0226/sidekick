<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-end sm:items-center justify-center pointer-events-none" @keydown.esc="close" tabindex="-1">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl p-6 pointer-events-auto max-h-[85dvh] overflow-hidden flex flex-col shadow-2xl border border-zinc-300 dark:border-zinc-800">

      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">위시리스트에 담기</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">읽고 싶은 책을 검색해서 담아보세요</p>
        </div>
        <button @click="close" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative group mb-4">
        <input
          ref="searchInput"
          v-model="query"
          @keyup.enter="searchBooks"
          type="text"
          placeholder="책 제목이나 저자를 검색하세요"
          class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-4 py-4 pl-12 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 border-none transition-all shadow-sm"
        />
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-lime-500 transition-colors" :size="20" />
        <button
          v-if="query"
          @click="query = ''; searchResults = []"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Content (Scrollable) -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <!-- Loading -->
        <div v-if="loading && searchResults.length === 0" class="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="md" message="책을 찾고 있어요" />
        </div>

        <!-- Search Results -->
        <div v-else-if="searchResults.length > 0" class="space-y-2">
          <div
            v-for="book in searchResults"
            :key="book.isbn"
            class="flex gap-4 p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
          >
            <div class="w-14 h-20 flex-shrink-0 shadow-md overflow-hidden bg-zinc-200 dark:bg-zinc-700 rounded">
              <img
                :src="book.cover"
                class="w-full h-full object-cover"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-1 truncate">{{ book.title }}</h3>
              <div class="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span class="truncate max-w-[100px]">{{ book.author }}</span>
                <template v-if="book.publisher">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span class="truncate max-w-[80px]">{{ book.publisher }}</span>
                </template>
              </div>
            </div>
            <button
              @click="handleAddToWishlist(book)"
              :disabled="isInWishlist(book.isbn) || addingIsbn === book.isbn"
              class="self-center p-2.5 rounded-xl transition-all"
              :class="isInWishlist(book.isbn)
                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500 cursor-not-allowed'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-500 active:scale-90'"
            >
              <Heart :size="18" :fill="isInWishlist(book.isbn) ? 'currentColor' : 'none'" />
            </button>
          </div>

          <!-- Load More -->
          <button
            v-if="hasMore"
            @click="loadMore"
            :disabled="loading"
            class="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50 mt-2"
          >
            {{ loading ? '더 불러오는 중...' : '결과 더보기' }}
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="query && !loading" class="py-12 text-center">
          <Search :size="28" class="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p class="text-sm text-zinc-500 font-medium">검색 결과가 없습니다</p>
        </div>

        <!-- Initial State -->
        <div v-else class="py-12 text-center">
          <BookOpen :size="28" class="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p class="text-sm text-zinc-500 font-medium">책 제목이나 저자를 검색해보세요</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { X, Search, Heart, BookOpen } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import LoadingSpinner from '~/components/LoadingSpinner.vue'

const props = defineProps<{
  isOpen: boolean
  wishlist: any[]
}>()

const emit = defineEmits(['close', 'added'])

const toast = useToastStore()
const userStore = useUserStore()
const client = useSupabaseClient()
const { searchBooks: searchBooksAPI } = useBookSearch()
const { addToWishlist } = useWishlist()

const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const searchResults = ref<any[]>([])
const loading = ref(false)
const hasMore = ref(false)
const currentStart = ref(1)
const addingIsbn = ref<string | null>(null)

watch(() => props.isOpen, async (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
  if (isOpen) {
    await nextTick()
    searchInput.value?.focus()
  }
})

// Cleanup: restore body scroll when component unmounts
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const close = () => {
  emit('close')
  query.value = ''
  searchResults.value = []
  currentStart.value = 1
  hasMore.value = false
}

const isInWishlist = (isbn: string) => {
  return props.wishlist.some(item => item.isbn === isbn)
}

const searchBooks = async () => {
  if (!query.value?.trim()) return
  currentStart.value = 1
  searchResults.value = []
  loading.value = true
  try {
    const results = await searchBooksAPI(query.value, currentStart.value)
    searchResults.value = results.books
    hasMore.value = results.hasMore
  } catch (error: any) {
    toast.error(error.message || '검색에 실패했습니다')
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
    toast.error(error.message || '더보기에 실패했습니다')
  } finally {
    loading.value = false
  }
}

const handleAddToWishlist = async (book: any) => {
  const userId = userStore.profile?.id
  if (!userId) {
    toast.error('로그인이 필요합니다')
    return
  }

  addingIsbn.value = book.isbn

  try {
    // 먼저 books 테이블에 책이 있는지 확인하고 없으면 추가
    const { data: existingBook } = await client
      .from('books')
      .select('isbn')
      .eq('isbn', book.isbn)
      .maybeSingle()

    if (!existingBook) {
      const { error: bookError } = await client.from('books').insert({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        cover_url: book.cover
      })
      if (bookError) {
        toast.error('책 정보 저장에 실패했습니다')
        return
      }
    }

    const result = await addToWishlist(userId, book.isbn)
    if (result.success) {
      toast.success('위시리스트에 담았습니다')
      emit('added')
    } else {
      toast.error(result.message || '추가에 실패했습니다')
    }
  } catch (err) {
    toast.error('위시 추가에 실패했습니다')
  } finally {
    addingIsbn.value = null
  }
}
</script>

