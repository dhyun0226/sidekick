<template>
  <nav 
    class="fixed top-0 left-0 right-0 z-[1000] h-16 transition-all duration-500 pt-safe"
    :class="[
      isScrolled 
        ? 'bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-apple'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-[480px] mx-auto h-full flex justify-between items-center px-4 gap-4">
      <!-- Back Button -->
      <button 
        @click="emit('back')" 
        class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-90 group"
        :class="[
          isScrolled
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
            : 'bg-black/20 dark:bg-white/10 backdrop-blur-md text-white'
        ]"
      >
        <ChevronLeft :size="22" class="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <!-- Central Title -->
      <div
        class="flex-1 min-w-0 transition-all duration-500 transform"
        :class="[
          isScrolled
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        ]"
      >
        <h1 class="text-sm font-semibold text-zinc-900 dark:text-white text-center truncate tracking-tight">
          {{ title }}
        </h1>
      </div>

      <!-- Menu Button -->
      <button 
        @click="emit('openDrawer')" 
        class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-90 group"
        :class="[
          isScrolled
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
            : 'bg-black/20 dark:bg-white/10 backdrop-blur-md text-white'
        ]"
      >
        <Menu :size="22" class="group-hover:rotate-90 transition-transform" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ChevronLeft, Menu } from 'lucide-vue-next'

interface Props {
  title: string
  isScrolled: boolean
}

interface Emits {
  (e: 'back'): void
  (e: 'openDrawer'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
</style>