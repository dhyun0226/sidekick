<template>
  <div class="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-[90vw]"
        :class="{
          'bg-white/90 dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700': toast.type === 'info',
          'bg-lime-50 dark:bg-lime-900/30 border-lime-200 dark:border-lime-700/50': toast.type === 'success',
          'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50': toast.type === 'error',
          'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50': toast.type === 'warning',
        }"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <CheckCircle v-if="toast.type === 'success'" :size="20" class="text-lime-500" />
          <AlertCircle v-else-if="toast.type === 'error'" :size="20" class="text-red-500" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="20" class="text-amber-500" />
          <Info v-else :size="20" class="text-zinc-500 dark:text-zinc-400" />
        </div>

        <!-- Message -->
        <p 
          class="text-sm font-medium flex-1"
          :class="{
            'text-zinc-800 dark:text-zinc-200': toast.type === 'info',
            'text-lime-800 dark:text-lime-200': toast.type === 'success',
            'text-red-800 dark:text-red-200': toast.type === 'error',
            'text-amber-800 dark:text-amber-200': toast.type === 'warning',
          }"
        >
          {{ toast.message }}
        </p>

        <!-- Close Button -->
        <button 
          @click="toastStore.remove(toast.id)"
          class="flex-shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          :class="{
            'text-zinc-400': toast.type === 'info',
            'text-lime-600 dark:text-lime-400': toast.type === 'success',
            'text-red-600 dark:text-red-400': toast.type === 'error',
            'text-amber-600 dark:text-amber-400': toast.type === 'warning',
          }"
        >
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>
