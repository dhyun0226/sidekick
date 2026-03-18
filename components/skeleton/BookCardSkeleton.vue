<template>
  <div class="grid gap-4" :class="gridClass">
    <div v-for="i in count" :key="i" class="animate-pulse">
      <div class="aspect-[2/3] bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-2"></div>
      <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/4 mb-1.5"></div>
      <div class="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-full w-1/2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  count?: number
  columns?: number
}>(), {
  count: 4,
  columns: 4
})

const gridClass = computed(() => {
  const cols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5'
  }
  return cols[props.columns] || 'grid-cols-4'
})
</script>
