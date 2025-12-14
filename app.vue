<template>
  <div>
    <NuxtLoadingIndicator color="#a3e635" />
    <ToastContainer />
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ToastContainer from '~/components/ToastContainer.vue' // Added by agent

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
