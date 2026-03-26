<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12 py-6">
    <div v-for="stat in stats" :key="stat.label" class="text-center">
      <p class="text-desktop-title font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums leading-none">{{ stat.value }}</p>
      <p class="text-desktop-caption text-zinc-400 dark:text-zinc-300 mt-2 uppercase tracking-widest font-medium">{{ stat.label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: Array<{ label: string; value: string | number }>
}>()
</script>
