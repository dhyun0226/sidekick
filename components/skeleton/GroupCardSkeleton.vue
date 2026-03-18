<template>
  <div class="space-y-4">
    <div v-for="i in count" :key="i" class="animate-pulse rounded-2xl bg-white dark:bg-zinc-900 p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <div class="flex gap-3">
        <!-- Book cover -->
        <div class="w-12 h-[68px] bg-zinc-200 dark:bg-zinc-800 rounded-lg flex-shrink-0"></div>
        <!-- Info -->
        <div class="flex-1">
          <div class="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-2/3 mb-2"></div>
          <div class="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-1/2 mb-3"></div>
          <!-- Progress bar -->
          <div class="h-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-full"></div>
        </div>
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
