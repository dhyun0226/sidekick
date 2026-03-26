<template>
  <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
    <!-- Header with Navigation -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span>캘린더</span>
        </h3>

        <div class="relative">
          <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              v-if="viewMode === 'month'"
              @click="changeMonth(-1)"
              class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <ChevronLeft :size="16" />
            </button>
            <button
              v-else
              @click="currentYear--"
              class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <ChevronLeft :size="16" />
            </button>
            <button
              @click="showPicker = !showPicker"
              class="picker-trigger text-xs font-bold text-zinc-700 dark:text-zinc-300 min-w-[80px] text-center px-2 py-1 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              {{ viewMode === 'month' ? `${currentYear}년 ${currentMonth + 1}월` : `${currentYear}년` }}
            </button>
            <button
              v-if="viewMode === 'month'"
              @click="changeMonth(1)"
              class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
              :disabled="isFuture"
              :class="{ 'opacity-30 cursor-not-allowed': isFuture }"
            >
              <ChevronRight :size="16" />
            </button>
            <button
              v-else
              @click="currentYear++"
              :disabled="currentYear >= now.getFullYear()"
              class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
              :class="{ 'opacity-30 cursor-not-allowed': currentYear >= now.getFullYear() }"
            >
              <ChevronRight :size="16" />
            </button>
          </div>

          <!-- Year/Month Picker Dropdown -->
          <div
            v-if="showPicker"
            class="year-month-picker absolute top-full right-0 mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 z-50 min-w-[280px]"
          >
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <button
                  v-if="!showYearGrid"
                  @click="pickerYear--"
                  class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                >
                  <ChevronLeft :size="16" />
                </button>
                <button
                  @click="toggleYearGrid"
                  class="text-sm font-bold text-zinc-900 dark:text-white hover:text-lime-600 dark:hover:text-lime-400 transition-colors px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {{ showYearGrid ? '년도 선택' : `${pickerYear}년` }}
                </button>
                <button
                  v-if="!showYearGrid"
                  @click="pickerYear++"
                  :disabled="pickerYear >= now.getFullYear()"
                  class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
                >
                  <ChevronRight :size="16" />
                </button>
                <div v-else class="w-6"></div>
              </div>
            </div>

            <div v-if="showYearGrid" class="grid grid-cols-3 gap-2 mb-3">
              <button
                v-for="year in yearRange"
                :key="year"
                @click="selectYear(year)"
                class="py-2 px-3 text-xs font-medium rounded-lg transition-colors"
                :class="[pickerYear === year ? 'bg-lime-400 text-black font-bold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-lime-200 dark:hover:bg-lime-900/30']"
              >
                {{ year }}년
              </button>
            </div>

            <div v-else class="grid grid-cols-3 gap-2 mb-3">
              <button
                v-for="m in 12"
                :key="m"
                @click="selectMonth(m - 1)"
                :disabled="isMonthDisabled(m - 1)"
                class="py-2 px-3 text-xs font-medium rounded-lg transition-colors"
                :class="[currentYear === pickerYear && currentMonth === m - 1 ? 'bg-lime-400 text-black font-bold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-lime-200 dark:hover:bg-lime-900/30', isMonthDisabled(m - 1) ? 'opacity-30 cursor-not-allowed' : '']"
              >
                {{ m }}월
              </button>
            </div>

            <div class="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button @click="goToToday" class="flex-1 py-2 text-xs font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors">오늘</button>
              <button @click="() => { showPicker = false; showYearGrid = false }" class="flex-1 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Grid - Daily View -->
    <div v-if="viewMode === 'month'" class="grid grid-cols-7 gap-1 mb-4">
      <div v-for="day in weekDays" :key="day" class="text-center text-[11px] text-zinc-400 font-medium pb-2">{{ day }}</div>
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        @click="day.count > 0 ? emit('day-click', day) : null"
        class="aspect-[2/3] rounded-md flex flex-col items-center justify-center relative group transition-all overflow-hidden border border-zinc-100 dark:border-zinc-800/50"
        :class="[getDayClass(day), day.count > 0 ? 'cursor-pointer hover:ring-2 hover:ring-lime-400 hover:scale-105' : '']"
      >
        <div v-if="day.activities?.length > 0" class="absolute inset-0 z-0 text-left">
          <img v-if="getLatestCover(day.activities)" :src="getLatestCover(day.activities)" class="w-full h-full object-cover opacity-100 transition-opacity" />
          <div v-else class="w-full h-full bg-lime-50/30 dark:bg-lime-900/10">
            <!-- Dot positioned at bottom center -->
            <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-lime-500 dark:bg-lime-400"></div>
          </div>
          <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" v-if="getLatestCover(day.activities)"></div>
          <div v-if="getUniqueBookCount(day.activities) > 1" class="absolute bottom-1 right-1 z-20 px-1 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[8px] font-black text-white leading-none border border-white/10">+{{ getUniqueBookCount(day.activities) - 1 }}</div>
        </div>
        <span v-if="day.date" class="text-[11px] z-10" :class="{'text-zinc-400 dark:text-zinc-500': !day.isCurrentMonth, 'text-zinc-700 dark:text-zinc-300': day.isCurrentMonth && day.count === 0, 'text-white dark:text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]': day.count > 0}">{{ day.dayNumber }}</span>
        <div v-if="day.date && day.count > 0" class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">{{ day.dateString }} · 활동 {{ day.count }}개</div>
      </div>
    </div>

    <!-- Calendar Grid - Monthly View -->
    <div v-else class="grid grid-cols-3 gap-3 mb-4">
      <div
        v-for="monthData in yearlyMonths"
        :key="monthData.month"
        @click="selectMonthFromYearView(monthData.month)"
        class="aspect-[2/3] rounded-xl flex flex-col items-center justify-center relative group transition-all cursor-pointer hover:ring-2 hover:ring-lime-400 hover:scale-105 overflow-hidden border border-zinc-100 dark:border-zinc-800/50"
        :class="getMonthClass(monthData)"
      >
        <div v-if="monthData.activities?.length > 0" class="absolute inset-0 z-0">
          <img v-if="getLatestCover(monthData.activities)" :src="getLatestCover(monthData.activities)" class="w-full h-full object-cover opacity-100 transition-opacity" />
          <div class="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
          <div v-if="getUniqueBookCount(monthData.activities) > 1" class="absolute bottom-2 right-2 z-20 px-1.5 py-1 bg-black/40 backdrop-blur-sm rounded-md text-[9px] font-black text-white leading-none border border-white/10">+{{ getUniqueBookCount(monthData.activities) - 1 }}</div>
        </div>
        <span class="text-sm font-black z-10 mb-1" :class="monthData.count > 0 ? 'text-white drop-shadow-md' : 'text-zinc-700 dark:text-zinc-300'">{{ monthData.monthName }}</span>
        <span class="text-[11px] font-bold z-10 px-2 py-0.5 rounded-full bg-black/40 text-white backdrop-blur-sm" v-if="monthData.count > 0">{{ monthData.count }}개</span>
      </div>
    </div>

    <!-- Integrated Stats Summary -->
    <div class="pt-5 mt-2 border-t border-zinc-100 dark:border-zinc-800/50 grid grid-cols-3 gap-4">
      <div class="text-left">
        <p class="text-[11px] font-black text-zinc-400 uppercase tracking-tighter mb-1">{{ statsLabel.books }}</p>
        <p class="text-lg font-black text-zinc-900 dark:text-white leading-none">{{ currentStats.books }}권</p>
      </div>
      <div class="text-left border-l border-zinc-100 dark:border-zinc-800/50 pl-4">
        <p class="text-[11px] font-black text-zinc-400 uppercase tracking-tighter mb-1">{{ statsLabel.activities }}</p>
        <p class="text-lg font-black text-zinc-900 dark:text-white leading-none">{{ currentStats.activities }}회</p>
      </div>
      <div class="text-left border-l border-zinc-100 dark:border-zinc-800/50 pl-4">
        <p class="text-[11px] font-black text-zinc-400 uppercase tracking-tighter mb-1">최장 연속</p>
        <p class="text-lg font-black text-lime-600 dark:text-lime-400 leading-none">{{ currentStats.longestStreak }}일</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  activities: any[]
  currentStreak?: number
  longestStreak?: number
  finishedBooks?: any[] // Array of books with finished_at date
  includeComments?: boolean
}>()

const emit = defineEmits<{
  (e: 'day-click', day: { date: Date; dateString: string; count: number; activities: any[] }): void
  (e: 'year-change', year: number): void
}>()

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, '0'), day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const now = new Date()
const currentYear = ref(now.getFullYear()), currentMonth = ref(now.getMonth()), showPicker = ref(false), pickerYear = ref(now.getFullYear()), showYearGrid = ref(false), viewMode = ref<'month' | 'year'>('month')

// Stats Logic
const statsLabel = computed(() => {
  if (viewMode.value === 'year') {
    return {
      books: `${currentYear.value}년 완독`,
      activities: `${currentYear.value}년 기록`
    }
  } else {
    return {
      books: `${currentYear.value}년 ${currentMonth.value + 1}월 완독`,
      activities: `${currentYear.value}년 ${currentMonth.value + 1}월 기록`
    }
  }
})

const currentStats = computed(() => {
  const targetYear = currentYear.value
  const targetMonth = currentMonth.value
  
  // Filter activities (comments/reviews)
  const filteredActivities = props.activities.filter(a => {
    const d = new Date(a.created_at)
    if (viewMode.value === 'year') {
      return d.getFullYear() === targetYear
    } else {
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth
    }
  })

  // Filter finished books
  const filteredBooks = (props.finishedBooks || []).filter(b => {
    if (!b.finished_at) return false
    const d = new Date(b.finished_at)
    if (viewMode.value === 'year') {
      return d.getFullYear() === targetYear
    } else {
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth
    }
  })

  // Calculate Longest Streak within filtered activities
  let longest = 0
  if (filteredActivities.length > 0) {
    const dates = [...new Set(filteredActivities.map(a => getLocalDateString(new Date(a.created_at))))].sort()
    let currentStreak = 1
    longest = 1
    
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i-1])
      const curr = new Date(dates[i])
      const diff = Math.floor((curr.getTime() - prev.getTime()) / 86400000)
      
      if (diff === 1) {
        currentStreak++
      } else {
        longest = Math.max(longest, currentStreak)
        currentStreak = 1
      }
    }
    longest = Math.max(longest, currentStreak)
  }

  return {
    activities: filteredActivities.length,
    books: filteredBooks.length,
    longestStreak: longest
  }
})

// Watch for year changes to fetch new data
import { watch } from 'vue'
watch(currentYear, (newYear) => {
  emit('year-change', newYear)
})

const isFuture = computed(() => currentYear.value > now.getFullYear() || (currentYear.value === now.getFullYear() && currentMonth.value >= now.getMonth()))
const changeMonth = (delta: number) => { const nd = new Date(currentYear.value, currentMonth.value + delta, 1); currentYear.value = nd.getFullYear(); currentMonth.value = nd.getMonth(); pickerYear.value = currentYear.value }
const selectMonth = (m: number) => { currentYear.value = pickerYear.value; currentMonth.value = m; showPicker.value = false; showYearGrid.value = false; viewMode.value = 'month' }
const selectMonthFromYearView = (m: number) => { currentMonth.value = m; viewMode.value = 'month' }
const isMonthDisabled = (m: number) => pickerYear.value > now.getFullYear() || (pickerYear.value === now.getFullYear() && m > now.getMonth())
const goToToday = () => { currentYear.value = now.getFullYear(); currentMonth.value = now.getMonth(); pickerYear.value = now.getFullYear(); showPicker.value = false; showYearGrid.value = false; viewMode.value = 'month' }
const toggleYearGrid = () => { showYearGrid.value = !showYearGrid.value }
const selectYear = (y: number) => { pickerYear.value = y; currentYear.value = y; showYearGrid.value = false; showPicker.value = false; viewMode.value = 'year' }
const yearRange = computed(() => { const cy = now.getFullYear(), yrs = []; for (let i = 0; i < 12; i++) yrs.push(cy - i); return yrs })

const yearlyMonths = computed(() => {
  const yr = currentYear.value, md = []
  for (let m = 0; m < 12; m++) {
    const ma = props.activities.filter(i => { const d = new Date(i.created_at); return d.getFullYear() === yr && d.getMonth() === m })
    md.push({ month: m, monthName: `${m + 1}월`, count: ma.length, activities: ma })
  }
  return md
})

const calendarDays = computed(() => {
  const yr = currentYear.value, m = currentMonth.value
  const fdom = new Date(yr, m, 1), ldom = new Date(yr, m + 1, 0), days = []
  const startDayOfWeek = fdom.getDay()
  for (let i = startDayOfWeek - 1; i >= 0; i--) { const d = new Date(yr, m, 1 - (i + 1)); days.push({ date: d, dateString: getLocalDateString(d), dayNumber: d.getDate(), isCurrentMonth: false, count: 0, activities: [] }) }
  const amap: Record<string, any[]> = {}
  props.activities.forEach(i => { const ds = getLocalDateString(new Date(i.created_at)); if (!amap[ds]) amap[ds] = []; amap[ds].push(i) })
  for (let i = 1; i <= ldom.getDate(); i++) { const d = new Date(yr, m, i), ds = getLocalDateString(d), items = amap[ds] || []; days.push({ date: d, dateString: ds, dayNumber: i, isCurrentMonth: true, count: items.length, activities: items }) }
  const remainingCells = 7 - (days.length % 7)
  if (remainingCells < 7) { for (let i = 1; i <= remainingCells; i++) { const d = new Date(yr, m + 1, i); days.push({ date: d, dateString: getLocalDateString(d), dayNumber: i, isCurrentMonth: false, count: 0, activities: [] }) } }
  return days
})

const getDayClass = (day: any) => {
  if (!day.isCurrentMonth) return 'bg-transparent opacity-30'
  if (day.count === 0) return 'bg-zinc-50 dark:bg-zinc-800/30'
  return 'bg-transparent border border-zinc-200 dark:border-zinc-700'
}

const getMonthClass = (monthData: any) => {
  if (monthData.count === 0) return 'bg-zinc-50 dark:bg-zinc-800/30'
  return 'bg-transparent border border-zinc-200 dark:border-zinc-700'
}

const getLatestCover = (activities: any[]) => {
  if (!activities || activities.length === 0) return null
  
  // Filter activities based on settings
  let candidates = activities
  if (props.includeComments === false) {
    candidates = activities.filter(a => a.type === 'review')
  }

  if (candidates.length === 0) return null

  // Prioritize Reviews even if comments are included
  const reviews = candidates.filter(a => a.type === 'review' && a.bookCover)
  if (reviews.length > 0) return reviews[0].bookCover

  // Otherwise, find most frequent cover
  const counts: Record<string, number> = {}
  candidates.forEach(a => { if (a.bookCover) counts[a.bookCover] = (counts[a.bookCover] || 0) + 1 })
  let mf = '', max = 0
  for (const [c, cnt] of Object.entries(counts)) { if (cnt > max) { max = cnt; mf = c } }
  return mf || candidates.find(a => a.bookCover)?.bookCover || null
}

const getUniqueBookCount = (activities: any[]) => {
  if (!activities || activities.length === 0) return 0
  
  // Filter activities based on settings
  let candidates = activities
  if (props.includeComments === false) {
    candidates = activities.filter(a => a.type === 'review')
  }
  
  const covers = candidates.filter(a => a.bookCover).map(a => a.bookCover)
  return new Set(covers).size
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement, pe = document.querySelector('.year-month-picker'), te = document.querySelector('.picker-trigger')
  if (showPicker.value && pe && !pe.contains(target) && te && !te.contains(target)) { showPicker.value = false; showYearGrid.value = false }
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>

