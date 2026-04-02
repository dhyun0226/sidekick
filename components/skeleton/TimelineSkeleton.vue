<template>
  <div class="space-y-5">
    <div v-for="i in count" :key="i" class="animate-pulse">
      <!-- Quote line -->
      <div v-if="i % 2 === 0" class="pl-3 border-l-2 border-zinc-200 dark:border-zinc-800 mb-3">
        <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-4/5 mb-1.5"></div>
        <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/5"></div>
      </div>
      <!-- Author row -->
      <div class="flex items-center gap-2 mb-3">
        <div class="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
        <div class="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-16"></div>
        <div class="ml-auto h-2 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-8"></div>
      </div>
      <!-- Content -->
      <div class="space-y-1.5">
        <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-full"></div>
        <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-5/6"></div>
        <div class="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-2/3"></div>
      </div>
      <!-- Actions -->
      <div class="flex gap-4 mt-3">
        <div class="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-12"></div>
        <div class="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-10"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 3
})
</script>
