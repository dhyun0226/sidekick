<template>
  <Badge v-if="rating" variant="amber" :size="size">
    <template #icon>
      <Star :size="iconSize" fill="#EAB308" class="text-yellow-500" />
    </template>
    {{ formattedRating }}
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import Badge from './Badge.vue'

interface Props {
  rating: number | string | null | undefined
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const formattedRating = computed(() => {
  const r = Number(props.rating)
  return isNaN(r) ? '0.0' : r.toFixed(1).replace('.0', '')
})

const iconSize = computed(() => {
  return props.size === 'sm' ? 10 : 12
})
</script>
