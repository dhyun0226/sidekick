<template>
  <div class="px-4 border-t border-zinc-100 dark:border-zinc-800/50 py-3">
    <div class="flex justify-between items-center">
      <button @click="$emit('tab-change', 'library')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-semibold text-zinc-900 dark:text-white">{{ formatNumber(stats.books) }}</span>
        <span class="text-[11px] text-zinc-500 dark:text-zinc-400">완독</span>
      </button>
      <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

      <button @click="$emit('tab-change', 'wishlist')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-semibold text-zinc-900 dark:text-white">{{ formatNumber(stats.wish) }}</span>
        <span class="text-[11px] text-zinc-500 dark:text-zinc-400">위시</span>
      </button>
      <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

      <button @click="$emit('tab-change', 'timeline')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-semibold text-zinc-900 dark:text-white">{{ formatNumber(stats.comments) }}</span>
        <span class="text-[11px] text-zinc-500 dark:text-zinc-400">기록</span>
      </button>
      <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

      <button @click="$emit('tab-change', 'groups')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-semibold text-zinc-900 dark:text-white">{{ formatNumber(stats.groups) }}</span>
        <span class="text-[11px] text-zinc-500 dark:text-zinc-400">그룹</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    books: number
    wish: number
    comments: number
    groups: number
  }
}>()

defineEmits(['tab-change'])

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
</script>
