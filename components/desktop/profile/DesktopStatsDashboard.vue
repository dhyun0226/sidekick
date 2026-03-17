<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12 py-6">
    <div v-for="stat in stats" :key="stat.label" class="text-center">
      <p class="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{{ stat.value }}</p>
      <p class="text-desktop-caption text-zinc-400 dark:text-zinc-500 mt-1">{{ stat.label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: Array<{ label: string; value: string | number }>
}>()
</script>
