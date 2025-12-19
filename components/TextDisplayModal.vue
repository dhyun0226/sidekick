<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 mx-4 shadow-2xl border border-zinc-300 dark:border-zinc-800 transition-all duration-300">
      <div class="mb-4">
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ message }}</p>
      </div>

      <!-- Text Display Area -->
      <div class="mb-4">
        <div class="relative">
          <input
            ref="textInput"
            :value="text"
            readonly
            class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-4 py-3 pr-20 text-sm border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-400"
            @focus="$event.target.select()"
          />
          <button
            @click="copyToClipboard"
            class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-lime-400 text-black text-xs font-medium rounded-lg hover:bg-lime-300 transition-colors"
          >
            {{ copied ? '복사됨!' : '복사' }}
          </button>
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-600 mt-2">
          위 텍스트를 길게 눌러 복사하거나, 복사 버튼을 눌러주세요
        </p>
      </div>

      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="w-full py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
      >
        닫기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  isOpen: boolean
  title: string
  message: string
  text: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const textInput = ref<HTMLInputElement | null>(null)
const copied = ref(false)

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    // If clipboard API fails, select the text for manual copy
    textInput.value?.select()
  }
}
</script>
