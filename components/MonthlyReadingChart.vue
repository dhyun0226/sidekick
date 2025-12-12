<template>
  <div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
    <!-- Header -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
      <h3 class="text-sm font-bold text-zinc-900 dark:text-white">월별 독서량</h3>
      <p class="text-xs text-zinc-500 mt-1">최근 12개월</p>
    </div>

    <!-- Chart -->
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12">
        <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm text-zinc-500">데이터를 불러오는 중...</p>
      </div>

      <!-- Chart Content -->
      <div v-else class="space-y-4">
        <!-- Bars -->
        <div class="flex items-end justify-between gap-2 h-40">
          <div
            v-for="(month, index) in monthlyData"
            :key="index"
            class="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
            @click="selectMonth(month)"
          >
            <!-- Bar -->
            <div class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-lg relative overflow-hidden group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
              <div
                class="w-full bg-lime-400 rounded-t-lg transition-all duration-500 ease-out flex items-end justify-center pb-1"
                :style="{ height: getBarHeight(month.count) }"
              >
                <span v-if="month.count > 0" class="text-[10px] font-bold text-black">{{ month.count }}</span>
              </div>
            </div>

            <!-- Label -->
            <span class="text-[10px] text-zinc-500 font-medium">{{ month.label }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="maxCount === 0" class="text-center py-8">
          <div class="text-4xl mb-2">📚</div>
          <p class="text-sm text-zinc-500">아직 완독한 책이 없습니다</p>
        </div>

        <!-- Selected Month Details -->
        <div v-if="selectedMonth && selectedMonth.books.length > 0" class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {{ selectedMonth.label }} ({{ selectedMonth.books.length }}권)
            </h4>
            <button @click="selectedMonth = null" class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              닫기
            </button>
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="book in selectedMonth.books"
              :key="book.id"
              class="flex gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
            >
              <img v-if="book.cover" :src="book.cover" class="w-8 h-12 object-cover rounded bg-zinc-200 dark:bg-zinc-700" />
              <div class="w-8 h-12 bg-zinc-200 dark:bg-zinc-700 rounded flex-shrink-0" v-else></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-zinc-900 dark:text-zinc-200 line-clamp-1">{{ book.title }}</div>
                <div class="text-xs text-zinc-500">{{ formatDate(book.finishedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const client = useSupabaseClient()
const loading = ref(false)
const selectedMonth = ref<any>(null)

interface MonthData {
  label: string
  month: number
  year: number
  count: number
  books: Array<{
    id: string
    title: string
    cover: string | null
    finishedAt: string
  }>
}

const monthlyData = ref<MonthData[]>([])

// Get last 12 months
const getLast12Months = () => {
  const months = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

    months.push({
      label: monthNames[date.getMonth()],
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      count: 0,
      books: []
    })
  }

  return months
}

const maxCount = computed(() => {
  return Math.max(...monthlyData.value.map(m => m.count), 0)
})

const getBarHeight = (count: number) => {
  if (maxCount.value === 0) return '0%'
  const percentage = (count / maxCount.value) * 100
  return `${Math.max(percentage, count > 0 ? 10 : 0)}%` // Minimum 10% if count > 0
}

const fetchMonthlyData = async () => {
  loading.value = true

  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) return

    // Initialize with last 12 months
    monthlyData.value = getLast12Months()

    // Get start date (12 months ago)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 11)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

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
            cover_url
          )
        )
      `)
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .gte('finished_at', startDate.toISOString())
      .order('finished_at', { ascending: true })

    // Group by month
    if (booksData) {
      booksData.forEach((item: any) => {
        const finishedDate = new Date(item.finished_at)
        const month = finishedDate.getMonth() + 1
        const year = finishedDate.getFullYear()

        const monthIndex = monthlyData.value.findIndex(m => m.month === month && m.year === year)
        if (monthIndex >= 0) {
          monthlyData.value[monthIndex].count++
          monthlyData.value[monthIndex].books.push({
            id: item.group_book_id,
            title: item.group_books.books?.title || '제목 없음',
            cover: item.group_books.books?.cover_url || null,
            finishedAt: item.finished_at
          })
        }
      })
    }
  } catch (error) {
    console.error('Monthly data fetch error:', error)
  } finally {
    loading.value = false
  }
}

const selectMonth = (month: MonthData) => {
  if (month.count > 0) {
    selectedMonth.value = month
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

onMounted(() => {
  fetchMonthlyData()
})
</script>
