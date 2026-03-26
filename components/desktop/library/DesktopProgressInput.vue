<template>
  <div class="flex items-center gap-3">
    <!-- Input -->
    <div class="relative flex-1">
      <input
        type="number"
        :value="displayValue"
        @input="handleInput"
        :min="0"
        :max="inputMode === 'page' ? totalPages : 100"
        :disabled="disabled"
        class="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-center text-desktop-body font-semibold text-zinc-900 dark:text-white pr-10 focus:outline-none focus:ring-2 focus:bg-zinc-100 dark:focus:bg-zinc-800 transition-all duration-200 ease-apple [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
        :class="inputError ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/10' : 'focus:ring-zinc-900/10 dark:focus:ring-white/10'"
        :placeholder="inputMode === 'page' ? '페이지' : '%'"
      />
      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-desktop-caption text-zinc-400 dark:text-zinc-400">
        {{ inputMode === 'page' ? `/ ${totalPages}p` : '%' }}
      </span>
    </div>

    <!-- Toggle (percent/page) -->
    <div
      v-if="totalPages"
      class="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-full p-0.5 flex-shrink-0"
    >
      <button
        @click="setMode('percent')"
        class="px-3 py-1.5 text-desktop-caption font-semibold rounded-full transition-all duration-200 ease-apple"
        :class="inputMode === 'percent'
          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'"
      >
        %
      </button>
      <button
        @click="setMode('page')"
        class="px-3 py-1.5 text-desktop-caption font-semibold rounded-full transition-all duration-200 ease-apple"
        :class="inputMode === 'page'
          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'"
      >
        p
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: number  // always percent (0-100)
  totalPages?: number
  preferredMode?: 'percent' | 'page'
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'update:mode': [mode: 'percent' | 'page']
}>()

const inputMode = ref<'percent' | 'page'>(props.preferredMode || 'percent')

// If no totalPages, force percent mode
watch(() => props.totalPages, (tp) => {
  if (!tp) inputMode.value = 'percent'
})

const displayValue = computed(() => {
  if (inputMode.value === 'page' && props.totalPages) {
    return Math.max(1, Math.round((props.modelValue / 100) * props.totalPages))
  }
  return Math.round(props.modelValue)
})

const inputError = ref(false)

const handleInput = (e: Event) => {
  const raw = Number((e.target as HTMLInputElement).value)
  if (isNaN(raw)) return

  const max = inputMode.value === 'page' && props.totalPages ? props.totalPages : 100
  if (raw > max || raw < 0) {
    inputError.value = true
    setTimeout(() => { inputError.value = false }, 800)
  }

  let pct: number
  if (inputMode.value === 'page' && props.totalPages) {
    const page = Math.min(Math.max(0, raw), props.totalPages)
    pct = Math.round((page / props.totalPages) * 100)
  } else {
    pct = Math.min(100, Math.max(0, raw))
  }

  emit('update:modelValue', pct)
}

const setMode = (mode: 'percent' | 'page') => {
  inputMode.value = mode
  emit('update:mode', mode)
}
</script>
