<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeModal">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

    <!-- Modal -->
    <div class="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur sticky top-0 z-10">
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white">내가 읽은 책</h2>
        <button @click="closeModal" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-sm text-zinc-600 dark:text-zinc-500">불러오는 중...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="books.length === 0" class="flex flex-col items-center justify-center py-12">
          <BookOpen :size="48" class="text-zinc-400 dark:text-zinc-700 mb-4" />
          <p class="text-sm text-zinc-600 dark:text-zinc-500">아직 읽은 책이 없습니다</p>
        </div>

        <!-- Books List -->
        <div v-else class="space-y-6">
          <div v-for="book in books" :key="book.isbn" class="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
            <!-- Book Info -->
            <div class="flex gap-4 mb-4">
              <div class="w-16 h-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                <img v-if="book.cover" :src="book.cover" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <BookOpen :size="24" class="text-zinc-500 dark:text-zinc-600" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-zinc-900 dark:text-white text-sm mb-1 line-clamp-2">{{ book.title }}</h3>
                <p class="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{{ book.author }}</p>
              </div>
            </div>

            <!-- Reading History -->
            <div v-if="book.readingHistory && book.readingHistory.length > 0" class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <Calendar :size="14" class="text-zinc-600 dark:text-zinc-500" />
                <span class="text-xs font-bold text-zinc-600 dark:text-zinc-500">독서 기록</span>
              </div>
              <div class="space-y-1">
                <div v-for="(history, idx) in book.readingHistory" :key="idx" class="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                  <span class="text-zinc-500 dark:text-zinc-600">•</span>
                  <span>{{ history.groupName }}</span>
                  <span v-if="history.round" class="text-lime-400">[{{ history.round }}회]</span>
                  <span class="text-zinc-500 dark:text-zinc-700">·</span>
                  <span>{{ formatDate(history.finishedAt) }} 완독</span>
                </div>
              </div>
            </div>

            <!-- Reviews -->
            <div v-if="book.reviews && book.reviews.length > 0" class="space-y-3 mb-3">
              <div class="flex items-center gap-2 mb-2">
                <Star :size="14" class="text-yellow-400 fill-yellow-400" />
                <span class="text-xs font-bold text-yellow-400">내 리뷰 ({{ book.reviews.length }})</span>
              </div>
              <div v-for="review in book.reviews" :key="review.id" class="bg-white dark:bg-zinc-900/50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1">
                      <Star :size="12" class="text-yellow-400 fill-yellow-400" />
                      <span class="text-xs font-bold text-yellow-400">{{ review.rating.toFixed(1) }}</span>
                    </div>
                    <span class="text-xs text-zinc-500 dark:text-zinc-600">·</span>
                    <span class="text-xs text-zinc-600 dark:text-zinc-500">{{ review.groupName }}</span>
                  </div>
                  <span class="text-[10px] text-zinc-500 dark:text-zinc-600">{{ formatDate(review.createdAt) }}</span>
                </div>
                <p v-if="review.content" class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{{ review.content }}</p>
                <p v-else class="text-sm text-zinc-500 dark:text-zinc-600 italic">리뷰 내용 없음</p>
              </div>
            </div>

            <!-- Comments -->
            <div v-if="book.comments && book.comments.length > 0" class="space-y-2">
              <div class="flex items-center gap-2 mb-2">
                <MessageCircle :size="14" class="text-blue-400" />
                <span class="text-xs font-bold text-blue-400">내 코멘트 ({{ book.comments.length }})</span>
              </div>
              <div v-for="comment in book.comments.slice(0, 3)" :key="comment.id" class="bg-white dark:bg-zinc-900/50 rounded-lg p-3 border-l-2 border-blue-400/30">
                <p class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-1">{{ comment.content }}</p>
                <div class="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-600">
                  <span>{{ comment.groupName }}</span>
                  <span>•</span>
                  <span>{{ formatDate(comment.createdAt) }}</span>
                </div>
              </div>
              <button v-if="book.comments.length > 3" class="text-xs text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-400 mt-2">
                +{{ book.comments.length - 3 }}개 더보기
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Stats -->
      <div v-if="!loading && books.length > 0" class="px-6 py-4 border-t border-zinc-300 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-600 dark:text-zinc-500">총 {{ books.length }}권의 책을 읽었습니다</span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <Star :size="12" class="text-yellow-400" />
              <span class="text-zinc-600 dark:text-zinc-400">리뷰 {{ totalReviews }}</span>
            </div>
            <div class="flex items-center gap-1">
              <MessageCircle :size="12" class="text-blue-400" />
              <span class="text-zinc-600 dark:text-zinc-400">코멘트 {{ totalComments }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, BookOpen, Star, MessageCircle, Calendar } from 'lucide-vue-next'

interface BookHistory {
  isbn: string
  title: string
  author: string
  cover: string | null
  reviews: Array<{
    id: string
    rating: number
    content: string
    createdAt: string
    groupName: string
  }>
  readingHistory: Array<{
    groupBookId: string
    groupId: string
    groupName: string
    finishedAt: string
    round: number | null
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    groupName: string
  }>
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const client = useSupabaseClient()
const { getBookRound } = useBookRound()
const loading = ref(false)
const books = ref<BookHistory[]>([])

const totalReviews = computed(() => books.value.reduce((sum, b) => sum + (b.reviews?.length || 0), 0))
const totalComments = computed(() => books.value.reduce((sum, b) => sum + (b.comments?.length || 0), 0))

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await fetchReadingHistory()
  }
})

const fetchReadingHistory = async () => {
  loading.value = true

  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) return

    // 1. Fetch all reviews with book info and group info
    const { data: reviewsData, error: reviewsError } = await client
      .from('reviews')
      .select(`
        id,
        rating,
        content,
        created_at,
        group_books!inner (
          id,
          isbn,
          group_id,
          groups (name),
          books (
            isbn,
            title,
            author,
            cover
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError)
      return
    }

    if (!reviewsData || reviewsData.length === 0) {
      books.value = []
      return
    }

    // 2. Group reviews by ISBN
    const bookMap = new Map<string, BookHistory>()

    reviewsData.forEach((review: any) => {
      const isbn = review.group_books.isbn
      const bookData = review.group_books.books

      if (!bookMap.has(isbn)) {
        bookMap.set(isbn, {
          isbn,
          title: bookData?.title || '제목 없음',
          author: bookData?.author || '저자 미상',
          cover: bookData?.cover || null,
          reviews: [],
          readingHistory: [],
          comments: []
        })
      }

      bookMap.get(isbn)!.reviews.push({
        id: review.id,
        rating: review.rating,
        content: review.content || '',
        createdAt: review.created_at,
        groupName: review.group_books.groups?.name || '알 수 없는 그룹'
      })
    })

    // 3. For each book, fetch reading history and comments
    const isbns = Array.from(bookMap.keys())

    // Fetch reading history (all completions)
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select(`
        finished_at,
        group_books!inner (
          id,
          isbn,
          group_id,
          groups (name)
        )
      `)
      .eq('user_id', user.id)
      .in('group_books.isbn', isbns)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })

    // Group progress by ISBN and calculate round numbers
    if (progressData) {
      await Promise.all(
        progressData.map(async (progress: any) => {
          const isbn = progress.group_books.isbn
          const groupId = progress.group_books.group_id
          const groupBookId = progress.group_books.id

          if (bookMap.has(isbn)) {
            const round = await getBookRound(groupId, isbn, groupBookId)
            bookMap.get(isbn)!.readingHistory.push({
              groupBookId,
              groupId,
              groupName: progress.group_books.groups?.name || '알 수 없는 그룹',
              finishedAt: progress.finished_at,
              round
            })
          }
        })
      )
    }

    // Fetch comments
    const { data: commentsData } = await client
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        group_books!inner (
          isbn,
          groups (name)
        )
      `)
      .eq('user_id', user.id)
      .in('group_books.isbn', isbns)
      .order('created_at', { ascending: false })

    // Group comments by ISBN
    commentsData?.forEach((comment: any) => {
      const isbn = comment.group_books.isbn
      if (bookMap.has(isbn)) {
        bookMap.get(isbn)!.comments.push({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          groupName: comment.group_books.groups?.name || '알 수 없는 그룹'
        })
      }
    })

    // Convert map to array
    books.value = Array.from(bookMap.values())

  } catch (error) {
    console.error('Reading history fetch error:', error)
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('close')
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`

  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
