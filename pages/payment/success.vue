<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Loading -->
      <div v-if="loading" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <div class="inline-block w-12 h-12 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">결제 처리 중...</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">잠시만 기다려주세요.</p>
      </div>

      <!-- Success -->
      <div v-else-if="success" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle :size="32" class="text-lime-600 dark:text-lime-400" />
          </div>
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">결제 완료!</h2>
          <p class="text-zinc-600 dark:text-zinc-400">프리미엄 구독이 활성화되었습니다.</p>
        </div>

        <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 mb-6 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-zinc-600 dark:text-zinc-400">구독 플랜</span>
            <span class="font-bold text-zinc-900 dark:text-white">프리미엄</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-zinc-600 dark:text-zinc-400">결제 금액</span>
            <span class="font-bold text-zinc-900 dark:text-white">{{ formatAmount(paymentInfo.amount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-zinc-600 dark:text-zinc-400">구독 만료일</span>
            <span class="font-bold text-zinc-900 dark:text-white">{{ subscriptionEndDate }}</span>
          </div>
        </div>

        <NuxtLink
          to="/"
          class="block w-full py-3 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl text-center transition-colors"
        >
          홈으로 이동
        </NuxtLink>
      </div>

      <!-- Error -->
      <div v-else class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle :size="32" class="text-red-600 dark:text-red-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">결제 실패</h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ errorMessage }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircle, XCircle } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'

useHead({ title: '결제 완료' })

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const success = ref(false)
const paymentInfo = ref<any>({})
const errorMessage = ref('')

onMounted(async () => {
  const { authKey, customerKey, planName, reactivate, orderId, paymentKey, amount } = route.query

  // 재활성화 콜백 (카드 재등록 후)
  if (authKey && customerKey && reactivate === 'true') {
    try {
      // 빌링키 발급
      const billingResponse: any = await $fetch('/api/payments/billing-reactivate', {
        method: 'POST',
        body: { authKey, customerKey }
      })
      success.value = true
      paymentInfo.value = { subscription: billingResponse.subscription }
      await userStore.fetchProfile(true)
    } catch (error: any) {
      console.error('[Payment] Reactivate error:', error)
      errorMessage.value = error.data?.message || '자동갱신 재활성화에 실패했습니다.'
    } finally {
      loading.value = false
    }
    return
  }

  // 빌링 방식 (새로운 자동결제 플로우)
  if (authKey && customerKey && planName) {
    try {
      const response = await $fetch('/api/payments/billing-subscribe', {
        method: 'POST',
        body: {
          authKey,
          customerKey,
          planName
        }
      })

      success.value = true
      paymentInfo.value = {
        amount: response.subscription?.plan_id ? undefined : 0,
        subscription: response.subscription
      }

      // 사용자 정보 + 구독 제한값 강제 새로고침
      await userStore.fetchProfile(true)
    } catch (error: any) {
      console.error('[Payment] Billing subscribe error:', error)
      errorMessage.value = error.data?.message || '결제 처리 중 오류가 발생했습니다.'
    } finally {
      loading.value = false
    }
    return
  }

  // 레거시 방식 (기존 일회성 결제 — 호환용)
  if (!orderId || !paymentKey || !amount) {
    errorMessage.value = '결제 정보가 올바르지 않습니다.'
    loading.value = false
    return
  }

  try {
    const response = await $fetch('/api/payments/confirm', {
      method: 'POST',
      body: {
        orderId,
        paymentKey,
        amount: Number(amount)
      }
    })

    success.value = true
    paymentInfo.value = {
      amount: Number(amount),
      subscription: response.subscription
    }

    await userStore.fetchProfile(true)
  } catch (error: any) {
    console.error('[Payment] Confirm error:', error)
    errorMessage.value = error.data?.message || '결제 승인 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
})

const subscriptionEndDate = computed(() => {
  if (!paymentInfo.value.subscription) return ''
  const date = new Date(paymentInfo.value.subscription.end_date)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formatAmount = (amount: number) => {
  return `₩${amount.toLocaleString()}`
}
</script>
