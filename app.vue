<template>
  <div class="bg-gray-100 dark:bg-black h-screen flex justify-center overflow-hidden">
    <!-- Initial App Loading Screen -->
    <div
      v-if="appLoading"
      class="fixed inset-0 z-[9999] bg-white dark:bg-[#09090b] flex items-center justify-center"
    >
      <div class="flex flex-col items-center gap-6">
        <BookOpen :size="32" class="text-lime-400" />
        <div class="text-center space-y-1.5">
          <h1 class="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">치어리더스</h1>
          <p class="text-[13px] text-zinc-400 dark:text-zinc-500">당신의 독서를 응원합니다</p>
        </div>
        <div class="w-5 h-5 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Main App Content -->
    <div
      v-else
      class="w-full h-screen bg-white dark:bg-[#09090b] relative"
      :class="[
        isAdminPage ? '' : (isDesktop ? '' : 'max-w-[480px] shadow-2xl'),
        isDesktop ? 'overflow-hidden' : 'overflow-y-auto'
      ]"
    >
      <NuxtLoadingIndicator color="#a3e635" />
      <ToastContainer />
      <NuxtPwaManifest />

      <!-- Desktop Layout with Sidebar -->
      <div v-if="isDesktop && !isAdminPage" class="flex h-full">
        <DesktopSidebar />
        <main class="flex-1 overflow-y-auto">
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </main>
      </div>

      <!-- Mobile Layout (original) -->
      <template v-else>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { BookOpen } from 'lucide-vue-next'
import ToastContainer from '~/components/ToastContainer.vue'


const DesktopSidebar = defineAsyncComponent(() => import('~/components/desktop/core/DesktopSidebar.vue'))

// Global setup
const { initTheme } = useTheme()
const { isDesktop } = useDevice()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// App loading state
const appLoading = ref(true)


// Check if current page is admin page or subscription page (needs full width)
const isAdminPage = computed(() => {
  return route.path.startsWith('/admin') || route.path === '/subscription' || route.path === '/about'
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
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  overscroll-behavior: none;
  overflow-x: hidden; /* 가로 스크롤만 차단 */
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
