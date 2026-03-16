<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
    <div v-for="stat in stats" :key="stat.label" class="apple-card p-4 text-center">
      <p class="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{{ stat.value }}</p>
      <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400">{{ stat.label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: Array<{ label: string; value: string | number }>
}>()
</script>
