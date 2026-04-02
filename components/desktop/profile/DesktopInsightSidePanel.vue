<template>
  <div class="space-y-3">
    <!-- 목표 위젯 -->
    <div class="bg-zinc-50 dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-3 border border-zinc-200/50 dark:border-zinc-800 select-none">
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{{ new Date().getFullYear() }} 독서 목표</h4>
        <button
          v-if="!editingGoal"
          @click="$emit('start-edit-goal')"
          class="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
        >
          수정
        </button>
      </div>

      <!-- Editing -->
      <div v-if="editingGoal" class="flex gap-2 mb-1">
        <input
          :value="tempGoal"
          @input="$emit('update:temp-goal', Number(($event.target as HTMLInputElement).value))"
          type="number"
          class="flex-1 min-w-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white text-zinc-900 dark:text-white"
        />
        <button @click="$emit('save-goal')" class="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold">저장</button>
        <button @click="$emit('cancel-edit-goal')" class="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-bold">취소</button>
      </div>

      <!-- Display -->
      <template v-else>
        <div class="flex items-baseline gap-1 mb-2">
          <span class="text-2xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{{ thisYearBooks }}</span>
          <span class="text-xs font-bold text-zinc-500 dark:text-zinc-400">/ {{ yearlyGoal }}</span>
        </div>
        <div class="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div class="bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-1000 ease-out" :style="{ width: `${Math.min((thisYearBooks/yearlyGoal)*100, 100)}%` }"></div>
        </div>
        <div class="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
          <span>{{ Math.round((thisYearBooks/yearlyGoal)*100) }}% · D-{{ daysLeftInYear }}</span>
          <span :class="onTrack ? 'text-zinc-900 dark:text-zinc-100' : 'text-orange-600 dark:text-orange-400'">{{ isGoalAchieved ? '달성 완료' : onTrack ? '순항 중' : '힘내요' }}</span>
        </div>
      </template>
    </div>

    <!-- 스트릭 -->
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-zinc-50 dark:bg-zinc-900 rounded-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-2.5 text-center">
        <p class="text-xl font-black text-lime-600 dark:text-lime-400 tabular-nums leading-none mb-0.5">{{ currentStreak }}</p>
        <p class="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">현재</p>
      </div>
      <div class="bg-zinc-50 dark:bg-zinc-900 rounded-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-2.5 text-center">
        <p class="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none mb-0.5">{{ longestStreak }}</p>
        <p class="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">최장</p>
      </div>
    </div>

    <!-- 이달 -->
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-zinc-50 dark:bg-zinc-900 rounded-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-2.5 text-center">
        <p class="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none mb-0.5">{{ thisMonthBooks }}</p>
        <p class="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">이달 완독</p>
      </div>
      <div class="bg-zinc-50 dark:bg-zinc-900 rounded-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-2.5 text-center">
        <p class="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none mb-0.5">{{ thisMonthComments }}</p>
        <p class="text-[8px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">이달 기록</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  thisYearBooks: number
  yearlyGoal: number
  daysLeftInYear: number
  booksNeededPerMonth: number | string
  onTrack: boolean
  isGoalAchieved: boolean
  currentStreak: number
  longestStreak: number
  thisMonthBooks: number
  thisMonthComments: number
  editingGoal: boolean
  tempGoal: number
}>()

defineEmits(['start-edit-goal', 'save-goal', 'cancel-edit-goal', 'update:temp-goal'])
</script>
