<template>
  <div class="space-y-3 pb-10">
    <!-- Yearly Goal Card -->
    <div class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 relative"
         :class="isGoalAchieved ? 'ring-2 ring-lime-400/50' : ''">

      <div class="flex items-center justify-between mb-3 text-left">
        <div class="flex items-center gap-2">
          <h4 class="text-sm font-bold text-zinc-900 dark:text-white">
            {{ new Date().getFullYear() }}년 독서 목표
          </h4>
          <div v-if="lastYearBooks > 0" class="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
               :class="yearOverYearGrowth >= 0
                 ? 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400'
                 : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'">
            <span>{{ yearOverYearGrowth >= 0 ? '+' : '' }}{{ yearOverYearGrowth }}%</span>
          </div>
        </div>
        <button v-if="!editingGoal" @click="$emit('start-edit-goal')" class="text-xs text-lime-600 hover:text-lime-500 font-bold">수정</button>
      </div>

      <!-- Goal Display/Edit -->
      <div v-if="editingGoal" class="space-y-3">
        <div class="flex items-center gap-2">
          <input :value="tempGoal" @input="$emit('update:tempGoal', Number(($event.target as HTMLInputElement).value))" type="number" min="1" class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white" />
          <span class="text-sm text-zinc-600 dark:text-zinc-400">권</span>
        </div>
        <div class="flex gap-2">
          <button @click="$emit('save-goal')" class="flex-1 px-3 py-1.5 bg-lime-400 text-black rounded-lg text-xs font-bold hover:bg-lime-300">저장</button>
          <button @click="$emit('cancel-edit-goal')" class="flex-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600">취소</button>
        </div>
      </div>

      <div v-else class="text-left">
        <div class="mb-2">
          <div class="flex justify-between items-end mb-1">
            <span class="text-2xl font-bold text-zinc-900 dark:text-white">
              {{ thisYearBooks }}<span class="text-base text-zinc-500">/ {{ yearlyGoal }}</span>
            </span>
            <span class="text-sm text-zinc-500">{{ Math.round((thisYearBooks/yearlyGoal)*100) }}%</span>
          </div>
          <div class="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
            <div class="bg-lime-400 h-2 rounded-full transition-all duration-500" :style="{ width: `${Math.min((thisYearBooks/yearlyGoal)*100, 100)}%` }"></div>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          <span>{{ daysLeftInYear }}일 남음</span>
          <span>·</span>
          <span>월 {{ booksNeededPerMonth }}권 필요</span>
          <span>·</span>
          <span v-if="isGoalAchieved" class="text-lime-600 dark:text-lime-400 font-bold">🎉 달성!</span>
          <span v-else-if="onTrack" class="text-green-600 dark:text-green-400 font-bold">✅ 달성 중</span>
          <span v-else class="text-orange-600 dark:text-orange-400 font-bold">💪 파이팅</span>
        </div>

        <!-- Chart -->
        <div v-if="monthlyProgress.length > 0" class="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <h5 class="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">월별 진행</h5>
          <div class="w-full px-3">
            <div class="h-16 w-full mb-2 relative">
              <svg class="absolute inset-0 w-full h-full" :viewBox="`-10 0 ${Math.max(monthlyProgress.length - 1, 1) * 100 + 20} 100`" preserveAspectRatio="none">
                <polyline v-if="monthlyProgress.length > 1" :points="monthlyProgress.map((m, i) => `${i * 100},${100 - (m.count / maxMonthlyCount) * 90}`).join(' ')" fill="none" stroke="#a3e635" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <g v-for="(month, i) in monthlyProgress" :key="'point-' + month.month">
                  <circle :cx="i * 100" :cy="100 - (month.count / maxMonthlyCount) * 90" r="4" fill="#84cc16" />
                </g>
              </svg>
            </div>
            <div class="relative w-full h-4">
              <span v-for="(month, i) in monthlyProgress" :key="'label-' + month.month" class="absolute text-[9px] text-zinc-400 transform -translate-x-1/2 whitespace-nowrap" :style="{ left: monthlyProgress.length === 1 ? '50%' : `${((i * 100 + 10) / (Math.max(monthlyProgress.length - 1, 1) * 100 + 20)) * 100}%` }">{{ month.month }}월</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <ReadingHeatmap
      :activities="timeline"
      :currentStreak="currentStreak"
      :longestStreak="longestStreak"
      @day-click="(day) => $emit('day-click', day)"
    />

    <!-- Summary -->
    <div class="pt-3 border-t border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-3 text-left">이번 달</h3>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div><div class="text-lg font-bold text-zinc-900 dark:text-white">{{ thisMonthBooks }}</div><div class="text-[10px] text-zinc-500">완독</div></div>
        <div><div class="text-lg font-bold text-zinc-900 dark:text-white">{{ thisMonthComments }}</div><div class="text-[10px] text-zinc-500">기록</div></div>
        <div><div class="text-lg font-bold text-lime-600 dark:text-lime-400">{{ currentStreak }}</div><div class="text-[10px] text-zinc-500">연속</div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'

defineProps<{
  timeline: any[], isGoalAchieved: boolean, lastYearBooks: number, yearOverYearGrowth: number, editingGoal: boolean, tempGoal: number,
  thisYearBooks: number, yearlyGoal: number, daysLeftInYear: number, booksNeededPerMonth: number | string, onTrack: boolean,
  monthlyProgress: any[], maxMonthlyCount: number, currentStreak: number, longestStreak: number, thisMonthBooks: number, thisMonthComments: number
}>()

defineEmits(['start-edit-goal', 'update:tempGoal', 'save-goal', 'cancel-edit-goal', 'day-click'])
</script>