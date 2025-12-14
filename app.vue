<template>
  <div class="bg-gray-100 dark:bg-black min-h-screen flex justify-center">
    <div class="w-full max-w-[480px] min-h-screen bg-white dark:bg-[#09090b] shadow-2xl relative">
      <NuxtLoadingIndicator color="#a3e635" />
      <ToastContainer />
      <NuxtPwaManifest />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ToastContainer from '~/components/ToastContainer.vue'

// Global setup
const { initTheme } = useTheme()

// Initialize theme on app mount
onMounted(() => {
  initTheme()
})
</script>

<style>
body {
  margin: 0;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

/* Scrollbar styling for desktop aesthetic */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #d4d4d8;
  border-radius: 3px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #3f3f46;
}
</style>
