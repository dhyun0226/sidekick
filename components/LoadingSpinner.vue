<template>
  <div class="loading-spinner-container" :class="containerClass">
    <div class="loading-spinner" :class="sizeClass">
      <div class="spinner"></div>
    </div>
    <p v-if="message" class="loading-message" :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  fullscreen?: boolean
  containerClass?: string
  messageClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  message: '',
  fullscreen: false,
  containerClass: '',
  messageClass: ''
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }
  return sizes[props.size]
})
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(163, 230, 53, 0.2);
  border-top-color: #a3e635;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  font-size: 0.875rem;
  color: #71717a;
  text-align: center;
}

.dark .loading-message {
  color: #a1a1aa;
}
</style>
