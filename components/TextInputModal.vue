<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click.self="$emit('cancel')"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 mx-4 shadow-2xl border border-zinc-300 dark:border-zinc-800 transition-all duration-300">
      <!-- Header -->
      <div class="mb-4">
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ message }}</p>
      </div>

      <!-- Expected Text Display -->
      <div v-if="expectedText" class="mb-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700">
        <p class="text-xs text-zinc-500 dark:text-zinc-500 mb-1">입력해야 할 텍스트:</p>
        <p class="text-sm font-medium text-zinc-900 dark:text-white">{{ expectedText }}</p>
      </div>

      <!-- Input Field -->
      <div class="mb-4">
        <input
          v-model="inputValue"
          :placeholder="placeholder"
          class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-4 py-3 text-sm border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          @keyup.enter="handleConfirm"
          @keyup.esc="$emit('cancel')"
          ref="inputElement"
        />
        <p v-if="errorMessage" class="text-xs text-red-400 mt-1">{{ errorMessage }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="$emit('cancel')"
          class="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          @click="handleConfirm"
          :disabled="!canConfirm"
          class="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface Props {
  isOpen: boolean
  title: string
  message: string
  expectedText?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  caseSensitive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '입력하세요',
  confirmText: '확인',
  cancelText: '취소',
  caseSensitive: true
})

const emit = defineEmits(['confirm', 'cancel'])

const inputValue = ref('')
const errorMessage = ref('')
const inputElement = ref<HTMLInputElement | null>(null)

const canConfirm = computed(() => {
  if (!props.expectedText) return inputValue.value.trim().length > 0

  const input = props.caseSensitive ? inputValue.value : inputValue.value.toLowerCase()
  const expected = props.caseSensitive ? props.expectedText : props.expectedText.toLowerCase()

  return input === expected
})

const handleConfirm = () => {
  if (!canConfirm.value) {
    if (props.expectedText) {
      errorMessage.value = '입력한 텍스트가 일치하지 않습니다'
    } else {
      errorMessage.value = '텍스트를 입력해주세요'
    }
    return
  }

  emit('confirm', inputValue.value)
  resetState()
}

const resetState = () => {
  inputValue.value = ''
  errorMessage.value = ''
}

// Watch isOpen to focus input and reset state
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetState()
    nextTick(() => {
      inputElement.value?.focus()
    })
  }
})
</script>
