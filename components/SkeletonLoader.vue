<template>
  <div class="skeleton-wrapper">
    <!-- Hero Skeleton -->
    <div v-if="type === 'hero'" class="space-y-4 px-4 pt-6 pb-8">
      <!-- Cover -->
      <div class="flex gap-4">
        <div class="skeleton w-24 h-36 rounded-lg"></div>
        <div class="flex-1 space-y-3">
          <div class="skeleton h-6 rounded w-3/4"></div>
          <div class="skeleton h-4 rounded w-1/2"></div>
          <div class="flex gap-2 mt-4">
            <div class="skeleton h-6 rounded-full w-16"></div>
            <div class="skeleton h-6 rounded-full w-20"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Skeleton -->
    <div v-else-if="type === 'timeline'" class="space-y-6 px-4 pb-32">
      <div v-for="i in 3" :key="i" class="space-y-4">
        <!-- Position badge -->
        <div class="flex items-center gap-3 mb-4">
          <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
          <div class="skeleton h-6 w-12 rounded-full"></div>
          <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
        </div>

        <!-- Comment cards -->
        <div v-for="j in 2" :key="j" class="px-4 py-4 bg-white dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-3">
          <!-- User info -->
          <div class="flex items-center gap-2">
            <div class="skeleton h-4 rounded w-24"></div>
            <div class="skeleton h-3 rounded w-16"></div>
          </div>
          <!-- Content -->
          <div class="space-y-2">
            <div class="skeleton h-4 rounded w-full"></div>
            <div class="skeleton h-4 rounded w-5/6"></div>
            <div class="skeleton h-4 rounded w-4/6"></div>
          </div>
          <!-- Actions -->
          <div class="flex gap-4">
            <div class="skeleton h-6 rounded w-12"></div>
            <div class="skeleton h-6 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slider Skeleton -->
    <div v-else-if="type === 'slider'" class="fixed bottom-0 left-0 right-0 z-50">
      <div class="max-w-[480px] mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-zinc-300 dark:border-zinc-800 pb-safe">
        <div class="h-16 px-4 flex items-center">
          <div class="skeleton h-1 rounded-full w-full"></div>
        </div>
        <div class="flex justify-between items-center px-4 py-3">
          <div class="skeleton h-4 rounded w-24"></div>
          <div class="skeleton w-10 h-10 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Generic Card Skeleton -->
    <div v-else-if="type === 'card'" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      <div class="skeleton h-5 rounded w-3/4"></div>
      <div class="skeleton h-4 rounded w-full"></div>
      <div class="skeleton h-4 rounded w-5/6"></div>
    </div>

    <!-- List Item Skeleton -->
    <div v-else-if="type === 'list-item'" class="flex gap-3 p-3">
      <div class="skeleton w-12 h-12 rounded-full flex-shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 rounded w-3/4"></div>
        <div class="skeleton h-3 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Custom Skeleton -->
    <div v-else :class="customClass">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'hero' | 'timeline' | 'slider' | 'card' | 'list-item' | 'custom'
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  type: 'card',
  customClass: ''
})
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

/* Shimmer animation for skeleton elements */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgb(228 228 231) 0%,
    rgb(244 244 245) 50%,
    rgb(228 228 231) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Dark mode shimmer */
:global(.dark) .skeleton {
  background: linear-gradient(
    90deg,
    rgb(39 39 42) 0%,
    rgb(63 63 70) 50%,
    rgb(39 39 42) 100%
  );
  background-size: 200% 100%;
}
</style>
