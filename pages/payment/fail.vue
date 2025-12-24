<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle :size="32" class="text-red-600 dark:text-red-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">결제 실패</h2>
        <p class="text-zinc-600 dark:text-zinc-400">{{ errorMessage }}</p>
      </div>

      <div v-if="errorCode" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p class="text-xs text-red-700 dark:text-red-300">
          <span class="font-bold">오류 코드:</span> {{ errorCode }}
        </p>
      </div>

      <div class="flex gap-3">
        <NuxtLink
          to="/subscription"
          class="flex-1 py-3 bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl text-center transition-colors"
        >
          다시 시도
        </NuxtLink>
        <NuxtLink
          to="/"
          class="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium rounded-xl text-center transition-colors"
        >
          홈으로
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XCircle } from 'lucide-vue-next'

const route = useRoute()

const errorMessage = ref('결제가 취소되었거나 오류가 발생했습니다.')
const errorCode = ref('')

onMounted(() => {
  const { message, code } = route.query

  if (message) {
    errorMessage.value = String(message)
  }

  if (code) {
    errorCode.value = String(code)
  }
})
</script>
