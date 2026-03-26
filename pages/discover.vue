<template>
  <!-- Desktop View -->
  <DesktopDiscoverView
    v-if="isDesktop"
    @start-book="handleStartBook"
  />

  <div v-else class="min-h-screen bg-gray-50 dark:bg-[#09090b] pb-20 pb-safe">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-gray-50/95 dark:bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div class="flex items-center gap-3 px-4 py-4">
        <button
          @click="router.back()"
          class="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft :size="24" />
        </button>
        <h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">디스커버</h1>
      </div>

      <!-- Filters -->
      <div class="px-4 pb-3 space-y-3">
        <!-- Period Filter -->
        <div class="flex gap-2">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="selectedPeriod = period.value"
            class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="selectedPeriod === period.value
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
          >
            {{ period.label }}
          </button>
        </div>

        <!-- Genre Filter -->
        <div class="relative">
          <button
            @click="genreDropdownOpen = !genreDropdownOpen"
            class="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <span>{{ selectedGenre || '전체 장르' }}</span>
            <ChevronDown :size="16" :class="genreDropdownOpen ? 'rotate-180' : ''" class="transition-transform" />
          </button>

          <!-- Dropdown -->
          <div
            v-if="genreDropdownOpen"
            class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50"
          >
            <button
              @click="selectedGenre = null; genreDropdownOpen = false"
              class="w-full px-4 py-2 text-left text-sm font-medium transition-colors"
              :class="!selectedGenre ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
            >
              전체 장르
            </button>
            <button
              v-for="genre in genres"
              :key="genre"
              @click="selectedGenre = genre; genreDropdownOpen = false"
              class="w-full px-4 py-2 text-left text-sm font-medium transition-colors"
              :class="selectedGenre === genre ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
            >
              {{ genre }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Backdrop for dropdown -->
    <div
      v-if="genreDropdownOpen"
      @click="genreDropdownOpen = false"
      class="fixed inset-0 z-40"
    ></div>

    <!-- Content -->
    <div class="px-4 pt-4">
      <!-- HOT 도서 -->
      <DiscoverSection
        title="HOT 도서"
        icon="flame"
        :books="hotBooks"
        type="hot"
        :loading="loading"
        empty-message="아직 데이터가 부족해요"
        @book-click="openBookSheet"
      />

      <!-- 위시 인기 -->
      <DiscoverSection
        title="위시 인기"
        icon="heart"
        :books="wishBooks"
        type="wish"
        :loading="loading"
        empty-message="아직 데이터가 부족해요"
        @book-click="openBookSheet"
      />

      <!-- 평점 TOP -->
      <DiscoverSection
        title="평점 TOP"
        icon="star"
        :books="topRatedBooks"
        type="rating"
        :loading="loading"
        empty-message="리뷰가 3개 이상인 책이 없어요"
        @book-click="openBookSheet"
      />

      <!-- 완독률 TOP -->
      <DiscoverSection
        title="완독률 TOP"
        icon="check-circle"
        :books="completionBooks"
        type="completion"
        :loading="loading"
        empty-message="읽은 사람이 5명 이상인 책이 없어요"
        @book-click="openBookSheet"
      />
    </div>

  </div>

  <!-- Book Action Sheet (desktop/mobile 공통) -->
  <DiscoverBookSheet
    :is-open="bookSheetOpen"
    :book="selectedBook"
    @close="bookSheetOpen = false"
    @start-book="handleStartBook"
    @wishlist-updated="fetchData"
  />

  <!-- Book Search Modal (desktop/mobile 공통) -->
  <BookSearchModal
    :is-open="bookSearchModalOpen"
    :initial-book="initialBookForModal"
    @close="bookSearchModalOpen = false; pendingBook = null"
    @confirm="handleBookConfirm"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronDown } from 'lucide-vue-next'

const DesktopDiscoverView = defineAsyncComponent(() => import('~/components/desktop/discover/DesktopDiscoverView.vue'))
const { isDesktop } = useDevice()
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import type { DiscoverBook, PeriodFilter } from '~/composables/useDiscover'
import DiscoverSection from '~/components/discover/DiscoverSection.vue'
import DiscoverBookSheet from '~/components/discover/DiscoverBookSheet.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'

definePageMeta({ middleware: ['auth'] })

useHead({ title: '디스커버' })

const router = useRouter()
const toast = useToastStore()
const userStore = useUserStore()
const client = useSupabaseClient()
const { genres } = useGenres()
const { loading, hotBooks, wishBooks, topRatedBooks, completionBooks, fetchAll } = useDiscover()

// Filters
const periods = [
  { value: 'week' as PeriodFilter, label: '이번 주' },
  { value: 'month' as PeriodFilter, label: '이번 달' },
  { value: 'all' as PeriodFilter, label: '전체' }
]
const selectedPeriod = ref<PeriodFilter>('week')
const selectedGenre = ref<string | null>(null)
const genreDropdownOpen = ref(false)

// Book Sheet
const bookSheetOpen = ref(false)
const selectedBook = ref<DiscoverBook | null>(null)

// Book Search Modal
const bookSearchModalOpen = ref(false)
const pendingBook = ref<DiscoverBook | null>(null)

// pendingBook을 BookSearchModal의 initialBook 형식으로 변환
const initialBookForModal = computed(() => {
  if (!pendingBook.value) return null
  return {
    isbn: pendingBook.value.isbn,
    title: pendingBook.value.title,
    author: pendingBook.value.author,
    publisher: pendingBook.value.publisher,
    cover: pendingBook.value.cover_url
  }
})

const fetchData = async () => {
  await fetchAll(selectedPeriod.value, selectedGenre.value)
}

// Watch filters
watch([selectedPeriod, selectedGenre], () => {
  if (!isDesktop.value) fetchData()
})

onMounted(() => {
  if (!isDesktop.value) fetchData()
})

const openBookSheet = (book: DiscoverBook) => {
  selectedBook.value = book
  bookSheetOpen.value = true
}

const handleStartBook = (book: DiscoverBook) => {
  // 책 정보를 저장하고 BookSearchModal 열기
  pendingBook.value = book
  bookSearchModalOpen.value = true
}

const handleBookConfirm = async (bookData: any) => {
  try {
    // 솔로 그룹 찾기
    const { data: memberData } = await client
      .from('group_members')
      .select('group_id, groups!inner(id, group_type, deleted_at)')
      .eq('user_id', userStore.profile?.id)
      .is('groups.deleted_at', null)
      .eq('groups.group_type', 'solo')
      .single()

    if (!memberData) {
      toast.error('내 서재를 찾을 수 없습니다')
      return
    }

    const soloGroupId = memberData.group_id

    // 1. books 테이블에 책 정보 upsert
    const { error: bookError } = await client.from('books').upsert({
      isbn: bookData.book.isbn,
      title: bookData.book.title,
      author: bookData.book.author,
      publisher: bookData.book.publisher,
      cover_url: bookData.book.cover,
      draft_pages: bookData.totalPages,
      draft_toc: bookData.toc,
      draft_genre: bookData.genre
    }, { onConflict: 'isbn' })

    if (bookError) throw bookError

    // 2. group_books에 추가
    const { data: groupBook, error: gbError } = await client.from('group_books').insert({
      group_id: soloGroupId,
      isbn: bookData.book.isbn,
      pages_snapshot: bookData.totalPages,
      toc_snapshot: bookData.toc,
      genre_snapshot: bookData.genre,
      target_start_date: bookData.startDate,
      target_end_date: bookData.endDate
    }).select().single()

    if (gbError) throw gbError

    // 3. reading progress 초기화
    await client.from('user_reading_progress').insert({
      user_id: userStore.profile?.id,
      group_book_id: groupBook.id,
      progress_pct: 0
    })

    toast.success('책이 내 서재에 추가되었습니다')
    router.push('/my-library')
  } catch (err) {
    console.error('Failed to add book:', err)
    toast.error('책 추가에 실패했습니다')
  }
}
</script>
