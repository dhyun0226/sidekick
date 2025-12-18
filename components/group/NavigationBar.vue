<template>
  <nav class="fixed top-0 left-0 right-0 z-50 h-14 transition-colors duration-300" :class="isScrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800' : 'bg-transparent'">
    <div class="max-w-[480px] mx-auto h-full flex justify-between items-center px-4">
      <button @click="emit('back')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-zinc-900 dark:text-white hover:bg-white/40 transition-colors shadow-sm">
        <ChevronLeft :size="24" />
      </button>

      <h1 class="text-sm font-bold text-zinc-900 dark:text-white transition-opacity duration-300" :class="isScrolled ? 'opacity-100' : 'opacity-0'">
        {{ title }}
      </h1>

      <button @click="emit('openDrawer')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-zinc-900 dark:text-white hover:bg-white/40 transition-colors shadow-sm">
        <Menu :size="24" />
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
