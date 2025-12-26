<template>
  <div class="bg-gray-100 dark:bg-black min-h-screen flex justify-center">
    <!-- Initial App Loading Screen -->
    <div
      v-if="appLoading"
      class="fixed inset-0 z-[9999] bg-white dark:bg-[#09090b] flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-6">
        <!-- Logo or App Name -->
        <div class="text-4xl font-bold text-lime-400">📚</div>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">Sidekick</h1>

        <!-- Loading Spinner -->
        <div class="w-12 h-12">
          <div class="w-full h-full border-3 border-lime-400/20 border-t-lime-400 rounded-full animate-spin"></div>
        </div>

        <p class="text-sm text-zinc-500 dark:text-zinc-400">로딩 중...</p>
      </div>
    </div>

    <!-- Main App Content -->
    <div
      v-else
      class="w-full min-h-screen bg-white dark:bg-[#09090b] relative"
      :class="isAdminPage ? '' : 'max-w-[480px] shadow-2xl'"
    >
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
import { ref, onMounted, computed } from 'vue'
import ToastContainer from '~/components/ToastContainer.vue'

// Global setup
const { initTheme } = useTheme()
const route = useRoute()
const userStore = useUserStore()

// App loading state
const appLoading = ref(true)

// Check if current page is admin page or subscription page (needs full width)
const isAdminPage = computed(() => {
  return route.path.startsWith('/admin') || route.path === '/subscription'
})

// Initialize app
onMounted(async () => {
  // Initialize theme first (synchronous)
  initTheme()

  // Minimum loading time for visual feedback (300ms)
  const minLoadTime = new Promise(resolve => setTimeout(resolve, 300))

  // Initialize user profile if authenticated
  const client = useSupabaseClient()
  const { data: { session } } = await client.auth.getSession()

  if (session?.user) {
    await userStore.fetchProfile()
  }

  // Wait for minimum load time
  await minLoadTime

  // Hide loading screen
  appLoading.value = false
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
