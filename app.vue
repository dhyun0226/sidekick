<template>
  <div class="min-h-[100dvh] bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 max-w-[480px] mx-auto relative shadow-2xl overflow-hidden font-sans">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// Global setup
const { initTheme } = useTheme()

// Initialize theme on app mount
onMounted(() => {
  initTheme()
})
</script>

<style>
body {
  background-color: #f5f5f5; /* Light mode default */
  margin: 0;
  transition: background-color 0.2s;
}

body.dark,
html.dark body {
  background-color: #000;
}
</style>
