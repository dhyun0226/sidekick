<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle :size="32" class="text-red-600 dark:text-red-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">결제 실패</h2>
        <p class="text-zinc-600 dark:text-zinc-400">{{ friendlyMessage }}</p>
      </div>

      <div v-if="errorCode" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p class="text-xs text-red-700 dark:text-red-300">
          <span class="font-bold">오류 코드:</span> {{ errorCode }}
        </p>
      </div>

      <!-- 해결 방법 안내 -->
      <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 mb-6 space-y-2">
        <p class="text-sm font-bold text-zinc-700 dark:text-zinc-300">해결 방법</p>
        <ul class="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
          <li class="flex items-start gap-2">
            <span class="text-lime-500 mt-0.5">•</span>
            <span>카드 한도 및 잔액을 확인해주세요</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-lime-500 mt-0.5">•</span>
            <span>카드 유효기간이 만료되지 않았는지 확인해주세요</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-lime-500 mt-0.5">•</span>
            <span>다른 결제 수단으로 시도해보세요</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-lime-500 mt-0.5">•</span>
            <span>문제가 지속되면 카드사에 문의해주세요</span>
          </li>
        </ul>
      </div>

      <div class="flex gap-3">
        <NuxtLink
          to="/subscription"
          class="flex-1 py-3 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl text-center transition-colors"
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
import { ref, computed, onMounted } from 'vue'
import { XCircle } from 'lucide-vue-next'

useHead({ title: '결제 실패' })

const route = useRoute()

const errorMessage = ref('결제가 취소되었거나 오류가 발생했습니다.')
const errorCode = ref('')

// 에러 코드별 사용자 친화적 메시지
const errorMessages: Record<string, string> = {
  'PAY_PROCESS_CANCELED': '결제가 취소되었습니다.',
  'PAY_PROCESS_ABORTED': '결제가 중단되었습니다.',
  'REJECT_CARD_COMPANY': '카드사에서 결제를 거부했습니다. 카드사에 문의해주세요.',
  'INSUFFICIENT_BALANCE': '잔액이 부족합니다.',
  'CARD_LIMIT_EXCEEDED': '카드 한도를 초과했습니다.',
  'INVALID_CARD_NUMBER': '유효하지 않은 카드 번호입니다.',
  'EXPIRED_CARD': '만료된 카드입니다.',
  'INVALID_CARD_EXPIRATION': '카드 유효기간을 확인해주세요.',
  'RESTRICTED_CARD': '사용이 제한된 카드입니다.',
  'NOT_FOUND_PAYMENT_SESSION': '결제 세션이 만료되었습니다. 다시 시도해주세요.',
  'PROVIDER_ERROR': '결제 서비스에 일시적인 문제가 발생했습니다.'
}

const friendlyMessage = computed(() => {
  if (errorCode.value && errorMessages[errorCode.value]) {
    return errorMessages[errorCode.value]
  }
  return errorMessage.value
})

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
