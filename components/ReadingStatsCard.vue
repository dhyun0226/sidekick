<template>
  <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
    <!-- Header with Tabs -->
    <div class="border-b border-zinc-200 dark:border-zinc-800">
      <div class="flex">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activePeriod = tab.value"
          class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative"
          :class="activePeriod === tab.value
            ? 'text-lime-400'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'"
        >
          {{ tab.label }}
          <div v-if="activePeriod === tab.value" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12">
        <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm text-zinc-500">통계를 불러오는 중...</p>
      </div>

      <!-- Stats Content -->
      <div v-else class="space-y-6">
        <!-- Stats Summary -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-4">
            <div class="text-xs text-zinc-500 mb-1">완독한 책</div>
            <div class="text-2xl font-bold text-lime-400">{{ stats.booksCompleted }}</div>
          </div>
          <div class="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-4">
            <div class="text-xs text-zinc-500 mb-1">작성한 리뷰</div>
            <div class="text-2xl font-bold text-blue-400">{{ stats.reviewsWritten }}</div>
          </div>
          <div class="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-4">
            <div class="text-xs text-zinc-500 mb-1">작성한 코멘트</div>
            <div class="text-2xl font-bold text-purple-400">{{ stats.commentsWritten }}</div>
          </div>
          <div class="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-4">
            <div class="text-xs text-zinc-500 mb-1">평균 평점</div>
            <div class="text-2xl font-bold text-yellow-400">{{ stats.avgRating }}</div>
          </div>
        </div>

        <!-- Activity Details -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-zinc-400 uppercase">활동 상세</h3>

          <!-- Books Completed -->
          <div v-if="activities.books.length > 0">
            <div class="flex items-center gap-2 mb-3">
              <BookOpen :size="16" class="text-lime-400" />
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">완독한 책 ({{ activities.books.length }})</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="book in activities.books"
                :key="book.id"
                class="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <img v-if="book.cover" :src="book.cover" class="w-12 h-16 object-cover rounded bg-zinc-300 dark:bg-zinc-700" />
                <div class="w-12 h-16 bg-zinc-300 dark:bg-zinc-700 rounded flex-shrink-0" v-else></div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm line-clamp-1">{{ book.title }}</div>
                  <div class="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{{ book.author }}</div>
                  <div class="text-xs text-zinc-500">{{ formatDate(book.finishedAt) }} 완독</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviews -->
          <div v-if="activities.reviews.length > 0">
            <div class="flex items-center gap-2 mb-3">
              <Star :size="16" class="text-blue-400 fill-blue-400" />
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">작성한 리뷰 ({{ activities.reviews.length }})</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="review in activities.reviews"
                :key="review.id"
                class="p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm">{{ review.bookTitle }}</div>
                  <div class="flex items-center gap-1">
                    <Star :size="12" class="text-yellow-400 fill-yellow-400" />
                    <span class="text-xs font-bold text-yellow-400">{{ review.rating.toFixed(1) }}</span>
                  </div>
                </div>
                <p v-if="review.content" class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1">{{ review.content }}</p>
                <div class="text-xs text-zinc-500">{{ formatDate(review.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div v-if="activities.comments.length > 0">
            <div class="flex items-center gap-2 mb-3">
              <MessageCircle :size="16" class="text-purple-400" />
              <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">작성한 코멘트 ({{ activities.comments.length }})</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="comment in activities.comments"
                :key="comment.id"
                class="p-3 bg-zinc-50 dark:bg-zinc-800/20 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors border-l-2 border-purple-400/30"
              >
                <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm mb-1">{{ comment.bookTitle }}</div>
                <p class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1">{{ comment.content }}</p>
                <div class="text-xs text-zinc-500">{{ formatDate(comment.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="activities.books.length === 0 && activities.reviews.length === 0 && activities.comments.length === 0" class="text-center py-8">
            <div class="text-4xl mb-2">📭</div>
            <p class="text-sm text-zinc-500">이 기간에는 활동이 없습니다</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { BookOpen, Star, MessageCircle } from 'lucide-vue-next'

type Period = 'day' | 'week' | 'month' | 'year'

const client = useSupabaseClient()
const loading = ref(false)
const activePeriod = ref<Period>('week')

const tabs = [
  { label: '일', value: 'day' as Period },
  { label: '주', value: 'week' as Period },
  { label: '월', value: 'month' as Period },
  { label: '년', value: 'year' as Period }
]

const stats = ref({
  booksCompleted: 0,
  reviewsWritten: 0,
  commentsWritten: 0,
  avgRating: '0.0'
})

const activities = ref<{
  books: Array<{ id: string; title: string; author: string; cover: string | null; finishedAt: string }>
  reviews: Array<{ id: string; bookTitle: string; rating: number; content: string; createdAt: string }>
  comments: Array<{ id: string; bookTitle: string; content: string; createdAt: string }>
}>({
  books: [],
  reviews: [],
  comments: []
})

const getDateRange = (period: Period) => {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'week':
      const day = start.getDay()
      const diff = start.getDate() - day
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
  }

  return { start, end }
}

const fetchStats = async () => {
  loading.value = true

  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) return

    const dateRange = getDateRange(activePeriod.value)

    // Fetch completed books
    const { data: booksData } = await client
      .from('user_reading_progress')
      .select(`
        group_book_id,
        finished_at,
        group_books!inner (
          id,
          isbn,
          books (
            title,
            author,
            cover_url
          )
        )
      `)
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .gte('finished_at', dateRange.start.toISOString())
      .lte('finished_at', dateRange.end.toISOString())

    // Fetch reviews
    const { data: reviewsData } = await client
      .from('reviews')
      .select(`
        id,
        rating,
        content,
        created_at,
        group_books!inner (
          books (
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString())

    // Fetch comments
    const { data: commentsData } = await client
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        group_books!inner (
          books (
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString())

    // Process data
    activities.value.books = (booksData || []).map((item: any) => ({
      id: item.group_book_id,
      title: item.group_books.books?.title || '제목 없음',
      author: item.group_books.books?.author || '저자 미상',
      cover: item.group_books.books?.cover_url || null,
      finishedAt: item.finished_at
    }))

    activities.value.reviews = (reviewsData || []).map((item: any) => ({
      id: item.id,
      bookTitle: item.group_books.books?.title || '제목 없음',
      rating: item.rating,
      content: item.content || '',
      createdAt: item.created_at
    }))

    activities.value.comments = (commentsData || []).map((item: any) => ({
      id: item.id,
      bookTitle: item.group_books.books?.title || '제목 없음',
      content: item.content,
      createdAt: item.created_at
    }))

    // Calculate stats
    stats.value.booksCompleted = activities.value.books.length
    stats.value.reviewsWritten = activities.value.reviews.length
    stats.value.commentsWritten = activities.value.comments.length

    const avgRating = activities.value.reviews.length > 0
      ? activities.value.reviews.reduce((sum, r) => sum + r.rating, 0) / activities.value.reviews.length
      : 0
    stats.value.avgRating = avgRating > 0 ? avgRating.toFixed(1) : '0.0'

  } catch (error) {
    console.error('Stats fetch error:', error)
  } finally {
    loading.value = false
  }
}

// Watch period change
watch(activePeriod, async () => {
  await fetchStats()
}, { immediate: true })

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
