<template>
  <div :class="`relative ${sizeClass} rounded-full overflow-hidden ${className}`">
    <!-- Image -->
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      @error="handleError"
      loading="lazy"
    />

    <!-- Fallback -->
    <div
      v-else
      class="w-full h-full flex items-center justify-center bg-gradient-to-br from-lime-400 to-lime-500 text-white font-bold uppercase"
      :style="{ fontSize: fallbackFontSize }"
    >
      {{ fallbackText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  src?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Avatar',
  size: 'md',
  fallback: '?',
  className: ''
})

const hasError = ref(false)

const sizeClass = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const fallbackFontSize = computed(() => {
  const fontSizes = {
    xs: '10px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px'
  }
  return fontSizes[props.size]
})

const fallbackText = computed(() => {
  if (props.fallback && props.fallback.length > 0) {
    return props.fallback.charAt(0).toUpperCase()
  }
  return '?'
})

const handleError = () => {
  hasError.value = true
}
</script>
