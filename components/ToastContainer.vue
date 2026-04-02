<template>
  <div class="fixed top-5 left-0 right-0 z-[999999] flex flex-col items-center gap-2.5 pointer-events-none px-4">
    <TransitionGroup name="toast">
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-900/90 dark:bg-white/90 backdrop-blur-xl shadow-apple-lg min-w-[200px] max-w-[420px]"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <Check v-if="t.type === 'success'" :size="16" class="text-lime-400 dark:text-lime-600" />
          <AlertCircle v-else-if="t.type === 'error'" :size="16" class="text-red-400 dark:text-red-500" />
          <AlertTriangle v-else-if="t.type === 'warning'" :size="16" class="text-amber-400 dark:text-amber-500" />
          <Info v-else :size="16" class="text-zinc-400 dark:text-zinc-400" />
        </div>

        <!-- Message -->
        <p class="text-[13px] font-medium text-white dark:text-zinc-900 flex-1 leading-snug">
          {{ t.message }}
        </p>

        <!-- Undo Button -->
        <button
          v-if="t.onUndo"
          @click="handleUndo(t)"
          class="flex-shrink-0 text-[12px] font-semibold text-lime-400 dark:text-lime-600 hover:text-lime-300 dark:hover:text-lime-500 transition-colors ml-1"
        >
          되돌리기
        </button>

        <!-- Close Button -->
        <button
          v-if="!t.onUndo"
          @click="toastStore.remove(t.id)"
          class="flex-shrink-0 p-0.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-300 dark:hover:text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast'
import { Check, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const toastStore = useToastStore()

const handleUndo = (t: any) => {
  if (t.onUndo) t.onUndo()
  toastStore.remove(t.id)
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
