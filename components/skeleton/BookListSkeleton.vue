<template>
  <div class="space-y-4">
    <div v-for="i in count" :key="i" class="flex gap-3 animate-pulse">
      <!-- Book cover -->
      <div class="w-14 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex-shrink-0"></div>
      <!-- Info -->
      <div class="flex-1 py-1">
        <div class="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/4 mb-2"></div>
        <div class="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-1/2 mb-1.5"></div>
        <div class="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-1/3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 4
})
</script>
