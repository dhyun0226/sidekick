<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-between items-center z-10">
        <div>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-white">그룹 통계</h2>
          <p class="text-sm text-zinc-500">{{ groupName }}</p>
        </div>
        <button @click="$emit('close')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          <X :size="24" />
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-sm text-zinc-500">통계를 불러오는 중...</p>
        </div>

        <template v-else>
          <!-- Summary Stats -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div class="text-xs text-zinc-600 dark:text-zinc-500 mb-1">완독한 책</div>
              <div class="text-2xl font-bold text-lime-400">{{ stats.completedBooks }}<span class="text-sm text-zinc-500 font-normal ml-1">권</span></div>
            </div>
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div class="text-xs text-zinc-600 dark:text-zinc-500 mb-1">진행 중</div>
              <div class="text-2xl font-bold text-blue-400">{{ stats.currentBooks }}<span class="text-sm text-zinc-500 font-normal ml-1">권</span></div>
            </div>
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div class="text-xs text-zinc-600 dark:text-zinc-500 mb-1">작성한 리뷰</div>
              <div class="text-2xl font-bold text-purple-400">{{ stats.totalReviews }}<span class="text-sm text-zinc-500 font-normal ml-1">개</span></div>
            </div>
            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <div class="text-xs text-zinc-600 dark:text-zinc-500 mb-1">작성한 댓글</div>
              <div class="text-2xl font-bold text-yellow-400">{{ stats.totalComments }}<span class="text-sm text-zinc-500 font-normal ml-1">개</span></div>
            </div>
          </div>

          <!-- Top Members -->
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-4">👑 활동 멤버 TOP 3</h3>
            <div class="space-y-3">
              <div
                v-for="(member, index) in topMembers.slice(0, 3)"
                :key="member.id"
                class="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
              >
                <div class="text-2xl">{{ ['🥇', '🥈', '🥉'][index] }}</div>
                <div class="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0">
                  <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1">
                  <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm">{{ member.nickname }}</div>
                  <div class="text-xs text-zinc-500">댓글 {{ member.commentCount }}개 · 리뷰 {{ member.reviewCount }}개</div>
                </div>
                <div class="text-lg font-bold text-lime-400">{{ member.totalActivity }}</div>
              </div>
            </div>
          </div>

          <!-- Monthly Activity Chart -->
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-4">📊 월별 활동 (최근 6개월)</h3>
            <div class="flex items-end justify-between gap-2 h-32">
              <div
                v-for="(month, index) in monthlyActivity"
                :key="index"
                class="flex-1 flex flex-col items-center gap-2"
              >
                <!-- Bar -->
                <div class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-lg relative overflow-hidden">
                  <div
                    class="w-full bg-lime-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-1"
                    :style="{ height: getActivityBarHeight(month.count) }"
                  >
                    <span v-if="month.count > 0" class="text-[10px] font-bold text-black">{{ month.count }}</span>
                  </div>
                </div>
                <!-- Label -->
                <span class="text-[10px] text-zinc-500 font-medium">{{ month.label }}</span>
              </div>
            </div>
          </div>

          <!-- Completed Books History -->
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-4">📚 완독 기록</h3>
            <div v-if="completedBooks.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="book in completedBooks"
                :key="book.id"
                class="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
              >
                <img v-if="book.cover" :src="book.cover" class="w-12 h-16 object-cover rounded bg-zinc-200 dark:bg-zinc-700" />
                <div class="w-12 h-16 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0" v-else></div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm line-clamp-1">
                    {{ book.title }}
                    <span v-if="book.round" class="text-lime-400 ml-1 text-xs">[{{ book.round }}회]</span>
                  </div>
                  <div class="text-xs text-zinc-500 mb-1">{{ book.author }}</div>
                  <div class="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{{ formatDate(book.finishedAt) }}</span>
                    <span v-if="book.avgRating > 0" class="flex items-center gap-1">
                      <Star :size="12" class="text-yellow-400 fill-yellow-400" />
                      <span class="text-yellow-400 font-bold">{{ book.avgRating.toFixed(1) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <div class="text-4xl mb-2">📖</div>
              <p class="text-sm text-zinc-500">아직 완독한 책이 없습니다</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Star } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  groupId: string
  groupName: string
}>()

const emit = defineEmits(['close'])

const client = useSupabaseClient()
const { getBookRound } = useBookRound()

const loading = ref(false)

const stats = ref({
  completedBooks: 0,
  currentBooks: 0,
  totalReviews: 0,
  totalComments: 0
})

const topMembers = ref<any[]>([])
const completedBooks = ref<any[]>([])
const monthlyActivity = ref<any[]>([])

// Get last 6 months for activity chart
const getLast6Months = () => {
  const months = []
  const now = new Date()
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: monthNames[date.getMonth()],
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      count: 0
    })
  }

  return months
}

const maxActivity = computed(() => {
  return Math.max(...monthlyActivity.value.map(m => m.count), 0)
})

const getActivityBarHeight = (count: number) => {
  if (maxActivity.value === 0) return '0%'
  const percentage = (count / maxActivity.value) * 100
  return `${Math.max(percentage, count > 0 ? 10 : 0)}%`
}

const fetchStats = async () => {
  if (!props.groupId) return

  loading.value = true

  try {
    // 1. Fetch completed books count
    const { count: completedCount } = await client
      .from('group_books')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', props.groupId)
      .eq('status', 'done')

    stats.value.completedBooks = completedCount || 0

    // 2. Fetch current books count
    const { count: currentCount } = await client
      .from('group_books')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', props.groupId)
      .eq('status', 'reading')

    stats.value.currentBooks = currentCount || 0

    // 3. Fetch reviews count
    const { data: reviewsData } = await client
      .from('reviews')
      .select(`
        id,
        user_id,
        group_books!inner(group_id)
      `)
      .eq('group_books.group_id', props.groupId)

    stats.value.totalReviews = reviewsData?.length || 0

    // 4. Fetch comments count
    const { data: commentsData } = await client
      .from('comments')
      .select(`
        id,
        user_id,
        group_books!inner(group_id)
      `)
      .eq('group_books.group_id', props.groupId)

    stats.value.totalComments = commentsData?.length || 0

    // 5. Calculate top members
    const memberActivity = new Map()

    commentsData?.forEach((comment: any) => {
      const userId = comment.user_id
      if (!memberActivity.has(userId)) {
        memberActivity.set(userId, { commentCount: 0, reviewCount: 0 })
      }
      memberActivity.get(userId).commentCount++
    })

    reviewsData?.forEach((review: any) => {
      const userId = review.user_id
      if (!memberActivity.has(userId)) {
        memberActivity.set(userId, { commentCount: 0, reviewCount: 0 })
      }
      memberActivity.get(userId).reviewCount++
    })

    const topUserIds = Array.from(memberActivity.entries())
      .map(([userId, activity]: [string, any]) => ({
        userId,
        totalActivity: activity.commentCount + activity.reviewCount,
        commentCount: activity.commentCount,
        reviewCount: activity.reviewCount
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, 3)
      .map(u => u.userId)

    if (topUserIds.length > 0) {
      const { data: usersData } = await client
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', topUserIds)

      topMembers.value = topUserIds.map(userId => {
        const user = usersData?.find(u => u.id === userId)
        const activity = memberActivity.get(userId)
        return {
          id: userId,
          nickname: user?.nickname || '알 수 없음',
          avatar_url: user?.avatar_url,
          ...activity,
          totalActivity: activity.commentCount + activity.reviewCount
        }
      })
    }

    // 6. Fetch completed books with details
    const { data: booksData } = await client
      .from('group_books')
      .select(`
        id,
        isbn,
        finished_at,
        books (
          title,
          author,
          cover_url
        )
      `)
      .eq('group_id', props.groupId)
      .eq('status', 'done')
      .order('finished_at', { ascending: false })
      .limit(20)

    if (booksData) {
      const booksWithRatings = await Promise.all(
        booksData.map(async (book: any) => {
          const { data: reviewsForBook } = await client
            .from('reviews')
            .select('rating')
            .eq('group_book_id', book.id)

          const avgRating = reviewsForBook && reviewsForBook.length > 0
            ? reviewsForBook.reduce((sum, r) => sum + r.rating, 0) / reviewsForBook.length
            : 0

          const round = await getBookRound(props.groupId, book.isbn, book.id)

          return {
            id: book.id,
            title: book.books?.title || '제목 없음',
            author: book.books?.author || '저자 미상',
            cover: book.books?.cover_url,
            finishedAt: book.finished_at,
            avgRating,
            round
          }
        })
      )

      completedBooks.value = booksWithRatings
    }

    // 7. Calculate monthly activity
    monthlyActivity.value = getLast6Months()

    if (booksData) {
      booksData.forEach((book: any) => {
        if (!book.finished_at) return

        const finishedDate = new Date(book.finished_at)
        const month = finishedDate.getMonth() + 1
        const year = finishedDate.getFullYear()

        const monthIndex = monthlyActivity.value.findIndex(m => m.month === month && m.year === year)
        if (monthIndex >= 0) {
          monthlyActivity.value[monthIndex].count++
        }
      })
    }

  } catch (error) {
    console.error('Stats fetch error:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

// Watch for modal open
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchStats()
  }
})
</script>
