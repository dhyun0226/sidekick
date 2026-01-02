<template>
  <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
    <!-- Header with Navigation -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span>🔥 독서 열정 온도</span>
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
            <!-- Year Selector -->
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
                  class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-30"
                >
                  <ChevronRight :size="16" />
                </button>
                <div v-else class="w-6"></div>
              </div>
            </div>

            <!-- Year Grid (when showYearGrid is true) -->
            <div v-if="showYearGrid" class="grid grid-cols-3 gap-2 mb-3">
              <button
                v-for="year in yearRange"
                :key="year"
                @click="selectYear(year)"
                class="py-2 px-3 text-xs font-medium rounded-lg transition-colors"
                :class="[
                  pickerYear === year
                    ? 'bg-lime-400 text-black font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-lime-200 dark:hover:bg-lime-900/30'
                ]"
              >
                {{ year }}년
              </button>
            </div>

            <!-- Month Grid (when showYearGrid is false) -->
            <div v-else class="grid grid-cols-3 gap-2 mb-3">
              <button
                v-for="m in 12"
                :key="m"
                @click="selectMonth(m - 1)"
                :disabled="isMonthDisabled(m - 1)"
                class="py-2 px-3 text-xs font-medium rounded-lg transition-colors"
                :class="[
                  currentYear === pickerYear && currentMonth === m - 1
                    ? 'bg-lime-400 text-black font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-lime-200 dark:hover:bg-lime-900/30',
                  isMonthDisabled(m - 1) ? 'opacity-30 cursor-not-allowed' : ''
                ]"
              >
                {{ m }}월
              </button>
            </div>

            <!-- Quick Actions -->
            <div class="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                @click="goToToday"
                class="flex-1 py-2 text-xs font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
              >
                오늘
              </button>
              <button
                @click="() => { showPicker = false; showYearGrid = false }"
                class="flex-1 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Streak Info -->
      <div v-if="currentStreak !== undefined" class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span class="font-bold text-orange-600 dark:text-orange-400">{{ currentStreak }}일 연속</span>
        <span v-if="longestStreak">· 최고 {{ longestStreak }}일</span>
      </div>
    </div>

    <!-- Calendar Grid - Daily View (Month Mode) -->
    <div v-if="viewMode === 'month'" class="grid grid-cols-7 gap-1 mb-4">
      <!-- Day Headers -->
      <div v-for="day in weekDays" :key="day" class="text-center text-[10px] text-zinc-400 font-medium pb-2">
        {{ day }}
      </div>

      <!-- Days -->
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        @click="day.count > 0 ? emit('day-click', day) : null"
        class="aspect-square rounded-lg flex flex-col items-center justify-center relative group transition-all"
        :class="[
          getDayClass(day),
          day.count > 0 ? 'cursor-pointer hover:ring-2 hover:ring-lime-400 hover:scale-105' : ''
        ]"
      >
        <span
          v-if="day.date"
          class="text-[10px] z-10"
          :class="{
            'text-zinc-400 dark:text-zinc-600': !day.isCurrentMonth,
            'text-zinc-700 dark:text-zinc-300': day.isCurrentMonth && day.count === 0,
            'text-lime-900 dark:text-lime-100 font-bold': day.count > 0
          }"
        >
          {{ day.dayNumber }}
        </span>

        <!-- Tooltip -->
        <div v-if="day.date && day.count > 0" class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
          {{ day.dateString }} · 활동 {{ day.count }}개
        </div>
      </div>
    </div>

    <!-- Calendar Grid - Monthly View (Year Mode) -->
    <div v-else class="grid grid-cols-3 gap-3 mb-4">
      <div
        v-for="monthData in yearlyMonths"
        :key="monthData.month"
        @click="selectMonthFromYearView(monthData.month)"
        class="rounded-xl p-4 flex flex-col items-center justify-center relative group transition-all cursor-pointer hover:ring-2 hover:ring-lime-400 hover:scale-105"
        :class="getMonthClass(monthData)"
      >
        <span class="text-sm font-bold mb-1" :class="monthData.count > 0 ? 'text-lime-900 dark:text-lime-100' : 'text-zinc-700 dark:text-zinc-300'">
          {{ monthData.monthName }}
        </span>
        <span class="text-xs" :class="monthData.count > 0 ? 'text-lime-800 dark:text-lime-200' : 'text-zinc-500 dark:text-zinc-400'">
          {{ monthData.count }}개
        </span>

        <!-- Tooltip -->
        <div v-if="monthData.count > 0" class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
          {{ currentYear }}년 {{ monthData.monthName }} · 활동 {{ monthData.count }}개
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-end gap-2 text-[10px] text-zinc-500">
      <span>Less</span>
      <div class="flex gap-1">
        <div class="w-3 h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"></div>
        <div class="w-3 h-3 rounded-sm bg-lime-200 dark:bg-lime-900/40"></div>
        <div class="w-3 h-3 rounded-sm bg-lime-400"></div>
        <div class="w-3 h-3 rounded-sm bg-lime-500"></div>
        <div class="w-3 h-3 rounded-sm bg-lime-600"></div>
      </div>
      <span>More</span>
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
}>()

const emit = defineEmits<{
  (e: 'day-click', day: { date: Date; dateString: string; count: number; activities: any[] }): void
}>()

// Helper function to get local date string (YYYY-MM-DD) without timezone conversion
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth()) // 0-11
const showPicker = ref(false)
const pickerYear = ref(now.getFullYear())
const showYearGrid = ref(false)
const viewMode = ref<'month' | 'year'>('month') // 'month' = daily view, 'year' = monthly view

const isFuture = computed(() => {
  return currentYear.value > now.getFullYear() || 
    (currentYear.value === now.getFullYear() && currentMonth.value >= now.getMonth())
})

const changeMonth = (delta: number) => {
  const newDate = new Date(currentYear.value, currentMonth.value + delta, 1)
  currentYear.value = newDate.getFullYear()
  currentMonth.value = newDate.getMonth()
  pickerYear.value = currentYear.value
}

const selectMonth = (month: number) => {
  currentYear.value = pickerYear.value
  currentMonth.value = month
  showPicker.value = false
  showYearGrid.value = false
  viewMode.value = 'month' // Switch to month view
}

const selectMonthFromYearView = (month: number) => {
  currentMonth.value = month
  viewMode.value = 'month' // Switch to month view when clicking a month in year view
}

const isMonthDisabled = (month: number) => {
  return pickerYear.value > now.getFullYear() ||
    (pickerYear.value === now.getFullYear() && month > now.getMonth())
}

const goToToday = () => {
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
  pickerYear.value = now.getFullYear()
  showPicker.value = false
  showYearGrid.value = false
  viewMode.value = 'month' // Switch to month view when going to today
}

const toggleYearGrid = () => {
  showYearGrid.value = !showYearGrid.value
}

const selectYear = (year: number) => {
  pickerYear.value = year
  currentYear.value = year
  showYearGrid.value = false
  showPicker.value = false
  viewMode.value = 'year' // Switch to year view
}

// Generate year range for the grid (current year and 11 years back = 12 years total)
const yearRange = computed(() => {
  const currentYear = now.getFullYear()
  const years = []
  for (let i = 0; i < 12; i++) {
    years.push(currentYear - i)
  }
  return years
})

// Yearly view: Group activities by month (Jan-Dec)
const yearlyMonths = computed(() => {
  const year = currentYear.value
  const monthlyData: Array<{
    month: number
    monthName: string
    count: number
    activities: any[]
  }> = []

  // Initialize 12 months
  for (let m = 0; m < 12; m++) {
    const monthActivities = props.activities.filter(item => {
      const date = new Date(item.created_at)
      return date.getFullYear() === year && date.getMonth() === m
    })

    monthlyData.push({
      month: m,
      monthName: `${m + 1}월`,
      count: monthActivities.length,
      activities: monthActivities
    })
  }

  return monthlyData
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const days = []
  
  // Padding for previous month
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 (Sun)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, 1 - (i + 1))
    days.push({
      date: d,
      dateString: getLocalDateString(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      count: 0,
      activities: []
    })
  }

  // Current month days
  const activityMap: Record<string, { count: number; items: any[] }> = {}
  props.activities.forEach(item => {
    const date = new Date(item.created_at)
    const dateStr = getLocalDateString(date)
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { count: 0, items: [] }
    }
    activityMap[dateStr].count++
    activityMap[dateStr].items.push(item)
  })

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i)
    const dateStr = getLocalDateString(d)
    const dayData = activityMap[dateStr] || { count: 0, items: [] }

    days.push({
      date: d,
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      count: dayData.count,
      activities: dayData.items
    })
  }

  // Padding for next month to fill grid (up to 35 or 42 cells)
  const remainingCells = 7 - (days.length % 7)
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        dateString: getLocalDateString(d),
        dayNumber: i,
        isCurrentMonth: false,
        count: 0,
        activities: []
      })
    }
  }
  
  return days
})

const getDayClass = (day: any) => {
  if (!day.isCurrentMonth) {
    return 'bg-transparent opacity-30'
  }

  if (day.count === 0) {
    return 'bg-zinc-50 dark:bg-zinc-800/30'
  }
  if (day.count <= 1) {
    return 'bg-lime-200 dark:bg-lime-900/40 border border-lime-300 dark:border-lime-800'
  }
  if (day.count <= 3) {
    return 'bg-lime-400 border border-lime-500 shadow-sm'
  }
  if (day.count <= 5) {
    return 'bg-lime-500 border border-lime-600 shadow-sm'
  }
  return 'bg-lime-600 border border-lime-700 shadow-md ring-1 ring-lime-400/30'
}

const getMonthClass = (monthData: any) => {
  if (monthData.count === 0) {
    return 'bg-zinc-50 dark:bg-zinc-800/30'
  }
  const maxCount = Math.max(...yearlyMonths.value.map(m => m.count))
  const ratio = monthData.count / maxCount

  if (ratio <= 0.25) {
    return 'bg-lime-200 dark:bg-lime-900/40 border border-lime-300 dark:border-lime-800'
  }
  if (ratio <= 0.5) {
    return 'bg-lime-400 border border-lime-500 shadow-sm'
  }
  if (ratio <= 0.75) {
    return 'bg-lime-500 border border-lime-600 shadow-sm'
  }
  return 'bg-lime-600 border border-lime-700 shadow-md ring-1 ring-lime-400/30'
}

// Click outside handler to close picker
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const pickerElement = document.querySelector('.year-month-picker')
  const triggerElement = document.querySelector('.picker-trigger')

  if (showPicker.value &&
      pickerElement &&
      !pickerElement.contains(target) &&
      triggerElement &&
      !triggerElement.contains(target)) {
    showPicker.value = false
    showYearGrid.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>