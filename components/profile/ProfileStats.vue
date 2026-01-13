<template>
  <div class="px-4 border-t border-zinc-200 dark:border-zinc-800/50 py-3">
    <div class="flex justify-between items-center">
      <button @click="$emit('tab-change', 'library')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.books }}</span>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400">완독</span>
      </button>
      <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

      <button @click="$emit('tab-change', 'timeline')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.comments }}</span>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400">기록</span>
      </button>
      <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

      <button @click="$emit('tab-change', 'insight')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-bold text-lime-600 dark:text-lime-400">{{ stats.streak }}</span>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400">연속</span>
      </button>
      <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

      <button @click="router.push('/')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
        <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.groups }}</span>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400">그룹</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  stats: {
    books: number
    comments: number
    streak: number
    groups: number
  }
}>()

defineEmits(['tab-change'])

const router = useRouter()
</script>