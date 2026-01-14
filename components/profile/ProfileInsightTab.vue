<template>
  <div class="space-y-4 pb-10">
    <!-- Compact but Readable Goal Widget -->
    <div class="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800 select-none">
      <!-- Header -->
      <div class="flex justify-between items-center mb-3">
        <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          2026 독서 목표
        </h4>
        <button 
          v-if="!editingGoal" 
          @click="$emit('start-edit-goal')" 
          class="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 py-1 -mr-2 active:scale-95 transition-all"
        >
          수정
        </button>
      </div>

      <!-- Editing Mode -->
      <div v-if="editingGoal" class="flex gap-2 mb-1">
        <input 
          :value="tempGoal" 
          @input="$emit('update:tempGoal', Number(($event.target as HTMLInputElement).value))" 
          type="number" 
          pattern="\d*"
          inputmode="numeric"
          class="flex-1 min-w-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-zinc-900 dark:text-white" 
        />
        <button @click="$emit('save-goal')" class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold active:scale-95 transition-transform">저장</button>
        <button @click="$emit('cancel-edit-goal')" class="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-xl text-xs font-bold active:scale-95 transition-transform">취소</button>
      </div>

      <!-- Display Mode -->
      <template v-else>
        <div class="flex items-center gap-4 mb-3">
          <!-- Left: Count -->
          <div class="flex items-baseline gap-1 shrink-0">
            <span class="text-3xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{{ thisYearBooks }}</span>
            <span class="text-sm font-bold text-zinc-500 dark:text-zinc-400">/ {{ yearlyGoal }}</span>
          </div>
          
          <!-- Middle: Progress Bar -->
          <div class="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner border border-zinc-100 dark:border-zinc-800">
            <div class="bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-1000 ease-out" :style="{ width: `${Math.min((thisYearBooks/yearlyGoal)*100, 100)}%` }"></div>
          </div>

          <!-- Right: Percent -->
          <div class="shrink-0">
            <span class="text-sm font-black text-zinc-900 dark:text-white leading-none">{{ Math.round((thisYearBooks/yearlyGoal)*100) }}%</span>
          </div>
        </div>

        <!-- Footer: More Readable Meta Info -->
        <div class="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-300 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <span class="text-zinc-400 dark:text-zinc-500 font-bold">D-</span>
              <span>{{ daysLeftInYear }}</span>
            </div>
            <span class="w-px h-2.5 bg-zinc-300 dark:bg-zinc-600"></span>
            <div class="flex items-center gap-1">
              <span class="text-zinc-400 dark:text-zinc-500 font-bold">월</span>
              <span>{{ booksNeededPerMonth }}권</span>
            </div>
          </div>
          <span :class="onTrack ? 'text-zinc-900 dark:text-zinc-100' : 'text-orange-600 dark:text-orange-400'">{{ isGoalAchieved ? '🎉 달성 완료' : onTrack ? '✓ 순항 중' : '⚡️ 힘내요' }}</span>
        </div>
      </template>
    </div>

    <!-- Heatmap -->
    <ReadingHeatmap
      :activities="timeline"
      :currentStreak="currentStreak"
      :longestStreak="longestStreak"
      :finishedBooks="finishedBooks"
      :include-comments="includeComments"
      @day-click="(day) => $emit('day-click', day)"
      @year-change="(year) => $emit('year-change', year)"
    />
  </div>
</template>

<script setup lang="ts">
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'
const { isDark } = useTheme()

defineProps<{
  timeline: any[], isGoalAchieved: boolean, lastYearBooks: number, yearOverYearGrowth: number, editingGoal: boolean, tempGoal: number,
  thisYearBooks: number, yearlyGoal: number, daysLeftInYear: number, booksNeededPerMonth: number | string, onTrack: boolean,
  monthlyProgress: any[], maxMonthlyCount: number, currentStreak: number, longestStreak: number, thisMonthBooks: number, thisMonthComments: number,
  finishedBooks: any[],
  includeComments: boolean
}>()

defineEmits(['start-edit-goal', 'update:tempGoal', 'save-goal', 'cancel-edit-goal', 'day-click', 'year-change'])
</script>