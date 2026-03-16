<template>
  <div class="apple-card p-6">
    <h3 class="text-desktop-headline text-zinc-900 dark:text-white mb-6">화면 설정</h3>

    <div class="space-y-4">
      <!-- Theme -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-desktop-body text-zinc-900 dark:text-white">다크 모드</p>
          <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400">어두운 테마를 사용합니다</p>
        </div>
        <button
          @click="$emit('toggle-theme')"
          class="relative w-12 h-7 rounded-full transition-colors"
          :class="isDark ? 'bg-lime-400' : 'bg-zinc-300'"
        >
          <div
            class="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
            :class="isDark ? 'translate-x-5' : 'translate-x-0.5'"
          ></div>
        </button>
      </div>

      <!-- Input Mode -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-desktop-body text-zinc-900 dark:text-white">진행률 입력</p>
          <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400">기본 입력 모드를 설정합니다</p>
        </div>
        <div class="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            @click="$emit('change-input-mode', 'percent')"
            class="px-3 py-1.5 text-desktop-caption font-semibold rounded-md transition-all"
            :class="inputMode === 'percent'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400'"
          >퍼센트</button>
          <button
            @click="$emit('change-input-mode', 'page')"
            class="px-3 py-1.5 text-desktop-caption font-semibold rounded-md transition-all"
            :class="inputMode === 'page'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400'"
          >페이지</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isDark: boolean
  inputMode: 'percent' | 'page'
}>()

defineEmits(['toggle-theme', 'change-input-mode'])
</script>
