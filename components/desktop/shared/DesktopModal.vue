<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-apple"
      leave-active-class="transition-opacity duration-150 ease-apple"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center" @click.self="$emit('close')" @keydown.esc="$emit('close')" tabindex="-1">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/25 backdrop-blur-md" @click="$emit('close')"></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden"
          :class="sizeClass"
          @click.stop
        >
          <!-- Header -->
          <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-zinc-100/80 dark:border-zinc-800/60">
            <h2 class="text-desktop-headline text-zinc-900 dark:text-white">{{ title }}</h2>
            <button
              @click="$emit('close')"
              class="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X :size="15" />
            </button>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto" :class="bodyClass">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-zinc-100/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/30">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}>()

defineEmits(['close'])

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-[400px] max-h-[60vh]'
    case 'md': return 'w-[560px] max-h-[70vh]'
    case 'lg': return 'w-[720px] max-h-[80vh]'
    case 'xl': return 'w-[900px] max-h-[85vh]'
    case 'full': return 'w-[90vw] max-w-[1200px] max-h-[90vh]'
    default: return 'w-[560px] max-h-[70vh]'
  }
})

const bodyClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'max-h-[calc(60vh-120px)]'
    case 'lg': return 'max-h-[calc(80vh-120px)]'
    case 'xl': return 'max-h-[calc(85vh-120px)]'
    case 'full': return 'max-h-[calc(90vh-120px)]'
    default: return 'max-h-[calc(70vh-120px)]'
  }
})
</script>
