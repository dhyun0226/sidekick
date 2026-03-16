<template>
  <div class="relative inline-block group">
    <slot />
    <div
      class="absolute z-50 px-2 py-1 text-xs font-medium text-white bg-zinc-900 dark:bg-white dark:text-black rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap"
      :class="positionClass"
    >
      {{ text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}>()

const positionClass = computed(() => {
  switch (props.position) {
    case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2'
    case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2'
    case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2'
    default: return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
  }
})
</script>
