<template>
  <div class="relative">
    <!-- Trigger Button -->
    <button
      @click.stop="emit('toggle')"
      class="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors flex items-center justify-center"
    >
      <slot name="icon">
        <MoreVertical :size="iconSize" class="text-zinc-400 dark:text-zinc-300" />
      </slot>
    </button>

    <!-- Dropdown Content -->
    <div
      v-if="isOpen"
      class="absolute top-6 min-w-[160px] bg-white dark:bg-zinc-800 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-lg shadow-apple z-50 overflow-visible"
      :class="align === 'left' ? 'left-0' : 'right-0'"
      @click.stop
    >
      <div class="py-1">
        <slot></slot>
      </div>
    </div>

    <!-- Global Backdrop for closing (Inside component context) -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 cursor-default"
      @click.stop="emit('close')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { MoreVertical } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  iconSize?: number
  align?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 14,
  align: 'right'
})

const emit = defineEmits(['toggle', 'close'])
</script>
