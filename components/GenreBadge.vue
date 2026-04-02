<template>
  <Badge v-if="genre" :variant="genreVariant" :size="size">
    {{ genre }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Badge from './Badge.vue'
import { useGenres } from '~/composables/useGenres'
import type { Genre } from '~/composables/useGenres'

interface Props {
  genre: Genre | string | null | undefined
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const genreVariant = computed(() => {
  if (!props.genre) return 'zinc'
  
  const variantMap: Record<string, any> = {
    '소설': 'purple',
    '시/시집': 'fuchsia',
    '에세이': 'blue',
    '자기계발': 'orange',
    '경영/경제': 'emerald',
    '인문/철학': 'indigo',
    '사회/정치': 'red',
    '과학/기술': 'cyan',
    '역사': 'amber',
    '예술': 'rose',
    '종교': 'violet',
    '기타': 'teal'
  }
  
  return variantMap[props.genre] || 'zinc'
})
</script>
