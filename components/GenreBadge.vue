<template>
  <span
    v-if="genre"
    class="inline-flex items-center rounded font-bold transition-colors duration-200"
    :class="badgeClass"
  >
    {{ genre }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGenres } from '~/composables/useGenres'
import type { Genre } from '~/composables/useGenres'

interface Props {
  genre: Genre | string | null | undefined
  size?: 'sm' | 'md'
  variant?: 'default' | 'glass'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default'
})

const { getGenreColor } = useGenres()

const badgeClass = computed(() => {
  if (!props.genre) return ''

  // Try to get color for known genres
  const colorClass = getGenreColor(props.genre as Genre)

  // Add size class - matching other badges' padding and text size
  const sizeClass = props.size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-1'

  if (props.variant === 'glass') {
    // Extract only the text color from the original colorClass
    const textColors = colorClass.split(' ').filter(c => c.startsWith('text-') || c.startsWith('dark:text-')).join(' ')
    return `bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-sm ${textColors} ${sizeClass}`
  }

  return `${colorClass} ${sizeClass}`
})
</script>
