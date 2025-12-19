<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="onCancel"
      >
        <div
          class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-center gap-3 mb-2">
              <!-- Icon based on variant -->
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                :class="{
                  'bg-red-100 dark:bg-red-950/30': variant === 'danger',
                  'bg-yellow-100 dark:bg-yellow-950/30': variant === 'warning',
                  'bg-blue-100 dark:bg-blue-950/30': variant === 'info'
                }"
              >
                <component
                  :is="iconComponent"
                  :size="24"
                  :class="{
                    'text-red-600 dark:text-red-400': variant === 'danger',
                    'text-yellow-600 dark:text-yellow-400': variant === 'warning',
                    'text-blue-600 dark:text-blue-400': variant === 'info'
                  }"
                />
              </div>
              <h3 class="text-xl font-bold text-zinc-900 dark:text-white">
                {{ title }}
              </h3>
            </div>
            <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {{ message }}
            </p>
            <p v-if="description" class="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
              {{ description }}
            </p>
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6 flex gap-3">
            <button
              @click="onCancel"
              class="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              @click="onConfirm"
              class="flex-1 px-4 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
              :class="{
                'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
                'bg-yellow-500 text-white hover:bg-yellow-600': variant === 'warning',
                'bg-lime-400 text-black hover:bg-lime-300': variant === 'info'
              }"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, AlertCircle, Info } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  title: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '확인',
  cancelText: '취소',
  variant: 'info',
  description: ''
})

const emit = defineEmits<Emits>()

const iconComponent = computed(() => {
  switch (props.variant) {
    case 'danger':
      return AlertTriangle
    case 'warning':
      return AlertCircle
    case 'info':
    default:
      return Info
  }
})

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .animate-scale-up {
  animation: scale-up 0.3s ease-out;
}

@keyframes scale-up {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
