<template>
  <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
    <!-- Header with Navigation -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <span>🔥 독서 열정 온도</span>
      </h3>
      
      <div class="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
        <button 
          @click="changeMonth(-1)"
          class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="text-xs font-bold text-zinc-700 dark:text-zinc-300 min-w-[80px] text-center">
          {{ currentYear }}년 {{ currentMonth + 1 }}월
        </span>
        <button 
          @click="changeMonth(1)"
          class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          :disabled="isFuture"
          :class="{ 'opacity-30 cursor-not-allowed': isFuture }"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1 mb-4">
      <!-- Day Headers -->
      <div v-for="day in weekDays" :key="day" class="text-center text-[10px] text-zinc-400 font-medium pb-2">
        {{ day }}
      </div>

      <!-- Days -->
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="aspect-square rounded-lg flex flex-col items-center justify-center relative group transition-all"
        :class="getDayClass(day)"
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
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  activities: any[]
}>()

const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth()) // 0-11

const isFuture = computed(() => {
  return currentYear.value > now.getFullYear() || 
    (currentYear.value === now.getFullYear() && currentMonth.value >= now.getMonth())
})

const changeMonth = (delta: number) => {
  const newDate = new Date(currentYear.value, currentMonth.value + delta, 1)
  currentYear.value = newDate.getFullYear()
  currentMonth.value = newDate.getMonth()
}

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
      dateString: d.toISOString().split('T')[0],
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      count: 0
    })
  }
  
  // Current month days
  const activityMap: Record<string, number> = {}
  props.activities.forEach(item => {
    const dateStr = new Date(item.created_at).toISOString().split('T')[0]
    activityMap[dateStr] = (activityMap[dateStr] || 0) + 1
  })

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i)
    const dateStr = d.toISOString().split('T')[0]
    const count = activityMap[dateStr] || 0
    
    days.push({
      date: d,
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      count
    })
  }
  
  // Padding for next month to fill grid (up to 35 or 42 cells)
  const remainingCells = 7 - (days.length % 7)
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        dateString: d.toISOString().split('T')[0],
        dayNumber: i,
        isCurrentMonth: false,
        count: 0
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
</script>