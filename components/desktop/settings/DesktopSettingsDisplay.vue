<template>
  <div class="pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
    <h3 class="text-desktop-micro text-zinc-400 dark:text-zinc-400 uppercase tracking-widest font-medium mb-5">화면 설정</h3>

    <div class="space-y-5">
      <!-- Theme -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-desktop-body text-zinc-900 dark:text-white">다크 모드</p>
          <p class="text-desktop-caption text-zinc-400 dark:text-zinc-400 mt-0.5">어두운 테마를 사용합니다</p>
        </div>
        <button
          @click="$emit('toggle-theme')"
          class="relative w-11 h-[24px] rounded-full transition-colors ease-apple duration-200"
          :class="isDark ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'"
        >
          <div
            class="absolute top-[3px] w-[18px] h-[18px] bg-white dark:bg-zinc-900 rounded-full shadow-sm transition-transform ease-apple duration-200"
            :class="isDark ? 'translate-x-[22px]' : 'translate-x-[3px]'"
          ></div>
        </button>
      </div>

      <!-- Input Mode -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-desktop-body text-zinc-900 dark:text-white">진행률 입력</p>
          <p class="text-desktop-caption text-zinc-400 dark:text-zinc-400 mt-0.5">기본 입력 모드를 설정합니다</p>
        </div>
        <div class="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5">
          <button
            @click="$emit('change-input-mode', 'percent')"
            class="px-3.5 py-1 text-desktop-callout-regular font-medium rounded-full transition-all ease-apple duration-200"
            :class="inputMode === 'percent'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
              : 'text-zinc-400 dark:text-zinc-400'"
          >퍼센트</button>
          <button
            @click="$emit('change-input-mode', 'page')"
            class="px-3.5 py-1 text-desktop-callout-regular font-medium rounded-full transition-all ease-apple duration-200"
            :class="inputMode === 'page'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
              : 'text-zinc-400 dark:text-zinc-400'"
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
