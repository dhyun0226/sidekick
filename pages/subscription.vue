<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white mb-3">프리미엄으로 업그레이드</h1>
        <p class="text-zinc-600 dark:text-zinc-400">더 많은 기능을 사용하고 독서 경험을 향상시키세요</p>
      </div>

      <!-- Current Plan (if subscribed) -->
      <div v-if="currentSubscription" class="bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50 dark:from-lime-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 border-2 border-lime-200 dark:border-lime-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
        <!-- Background pattern -->
        <div class="absolute inset-0 opacity-5">
          <div class="absolute inset-0" style="background-image: radial-gradient(circle, #84cc16 1px, transparent 1px); background-size: 20px 20px;"></div>
        </div>

        <div class="relative">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center">
                <Check :size="24" class="text-black font-bold" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-lime-900 dark:text-lime-100">{{ currentSubscription.plan?.display_name }}</h3>
                <p class="text-xs text-lime-700 dark:text-lime-300">활성 구독</p>
              </div>
            </div>
            <div v-if="currentSubscription.auto_renew" class="px-3 py-1 bg-lime-400/30 dark:bg-lime-400/20 rounded-full">
              <span class="text-xs font-bold text-lime-900 dark:text-lime-100">자동 갱신</span>
            </div>
          </div>

          <!-- Details -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-white/50 dark:bg-black/20 rounded-xl p-3">
              <p class="text-xs text-zinc-600 dark:text-zinc-400 mb-1">다음 결제일</p>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">{{ formatDate(currentSubscription.end_date) }}</p>
            </div>
            <div class="bg-white/50 dark:bg-black/20 rounded-xl p-3">
              <p class="text-xs text-zinc-600 dark:text-zinc-400 mb-1">갱신 상태</p>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">
                {{ currentSubscription.auto_renew ? '자동 갱신' : '갱신 안 함' }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              v-if="currentSubscription.auto_renew"
              @click="handleCancelClick"
              :disabled="canceling"
              class="flex-1 py-3 bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertCircle :size="18" />
              {{ canceling ? '처리 중...' : '자동 갱신 취소' }}
            </button>
            <div v-else class="flex-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
              <p class="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>{{ formatDate(currentSubscription.end_date) }}</strong>까지 프리미엄 기능을 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Free Plan -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">무료</h2>
          <div class="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
            ₩0<span class="text-base font-normal text-zinc-500">/월</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check :size="16" class="text-lime-500" />
              기본 독서 기능
            </li>
            <li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check :size="16" class="text-lime-500" />
              그룹 참여 가능
            </li>
            <li class="flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-600">
              <X :size="16" class="text-zinc-400" />
              그룹 생성 제한 (최대 2개)
            </li>
          </ul>
          <button
            v-if="userStore.profile?.subscription_tier !== 'free'"
            disabled
            class="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-medium cursor-not-allowed"
          >
            현재 플랜
          </button>
        </div>

        <!-- Premium Monthly Plan -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border-2 border-lime-400 dark:border-lime-500 p-8 relative">
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">프리미엄 월간</h2>
          <div class="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
            ₩2,500<span class="text-base font-normal text-zinc-500">/월</span>
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check :size="16" class="text-lime-500" />
              무제한 그룹 생성
            </li>
            <li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check :size="16" class="text-lime-500" />
              무제한 책 추가
            </li>
            <li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check :size="16" class="text-lime-500" />
              고급 통계 및 인사이트
            </li>
            <li class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <Check :size="16" class="text-lime-500" />
              우선 지원
            </li>
          </ul>
          <button
            v-if="!currentSubscription || currentSubscription.status !== 'active'"
            @click="startPayment('premium_monthly')"
            :disabled="payingMonthly || payingYearly"
            class="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-500 text-black font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ payingMonthly ? '처리 중...' : '월간 시작하기' }}
          </button>
          <button
            v-else
            disabled
            class="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-medium cursor-not-allowed"
          >
            구독 중
          </button>
        </div>

        <!-- Premium Yearly Plan -->
        <div class="bg-gradient-to-br from-lime-400 to-lime-500 rounded-xl p-8 text-black relative overflow-hidden">
          <div class="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
            37% 할인
          </div>
          <h2 class="text-2xl font-bold mb-2">프리미엄 연간</h2>
          <div class="mb-1">
            <span class="text-3xl font-bold">₩19,000</span>
            <span class="text-base font-normal opacity-80">/년</span>
          </div>
          <div class="text-sm opacity-80 mb-6">
            월 ₩1,583 (37% 할인)
          </div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2 text-sm font-medium">
              <Check :size="16" class="text-black" />
              무제한 그룹 생성
            </li>
            <li class="flex items-center gap-2 text-sm font-medium">
              <Check :size="16" class="text-black" />
              무제한 책 추가
            </li>
            <li class="flex items-center gap-2 text-sm font-medium">
              <Check :size="16" class="text-black" />
              고급 통계 및 인사이트
            </li>
            <li class="flex items-center gap-2 text-sm font-medium">
              <Check :size="16" class="text-black" />
              우선 지원
            </li>
            <li class="flex items-center gap-2 text-sm font-medium">
              <Check :size="16" class="text-black" />
              <span class="font-bold">연간 ₩11,000 절약</span>
            </li>
          </ul>
          <button
            v-if="!currentSubscription || currentSubscription.status !== 'active'"
            @click="startPayment('premium_yearly')"
            :disabled="payingMonthly || payingYearly"
            class="w-full py-3 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ payingYearly ? '처리 중...' : '연간 시작하기' }}
          </button>
          <button
            v-else
            disabled
            class="w-full py-3 rounded-xl bg-white/20 backdrop-blur-sm text-black font-bold cursor-not-allowed"
          >
            구독 중
          </button>
        </div>
      </div>

      <!-- Quick Feature Highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 mb-8">
        <div class="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div class="w-12 h-12 bg-lime-400/10 rounded-full flex items-center justify-center mb-4">
            <Users :size="24" class="text-lime-500" />
          </div>
          <h4 class="font-bold text-zinc-900 dark:text-white mb-2">무제한 그룹 생성</h4>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">원하는 만큼 독서 모임을 만들고 관리하세요.</p>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div class="w-12 h-12 bg-lime-400/10 rounded-full flex items-center justify-center mb-4">
            <TrendingUp :size="24" class="text-lime-500" />
          </div>
          <h4 class="font-bold text-zinc-900 dark:text-white mb-2">고급 독서 분석</h4>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">연간 목표, 히트맵, 상세 통계로 습관을 파악하세요.</p>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
          <div class="w-12 h-12 bg-lime-400/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen :size="24" class="text-lime-500" />
          </div>
          <h4 class="font-bold text-zinc-900 dark:text-white mb-2">무제한 책 추가</h4>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">제한 없이 모든 그룹에서 책을 읽으세요.</p>
        </div>
      </div>

      <!-- Features Comparison -->
      <div class="mt-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <h3 class="text-xl font-bold text-zinc-900 dark:text-white mb-6">기능 비교</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
            <span class="text-sm text-zinc-700 dark:text-zinc-300">독서 진도 추적</span>
            <div class="flex gap-12">
              <Check :size="20" class="text-lime-500" />
              <Check :size="20" class="text-lime-500" />
            </div>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
            <span class="text-sm text-zinc-700 dark:text-zinc-300">그룹 독서 참여</span>
            <div class="flex gap-12">
              <Check :size="20" class="text-lime-500" />
              <Check :size="20" class="text-lime-500" />
            </div>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
            <span class="text-sm text-zinc-700 dark:text-zinc-300">그룹 생성</span>
            <div class="flex gap-12">
              <span class="text-xs text-zinc-500">최대 2개</span>
              <span class="text-xs font-bold text-lime-600">무제한</span>
            </div>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
            <span class="text-sm text-zinc-700 dark:text-zinc-300">책 추가</span>
            <div class="flex gap-12">
              <span class="text-xs text-zinc-500">제한적</span>
              <span class="text-xs font-bold text-lime-600">무제한</span>
            </div>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-sm text-zinc-700 dark:text-zinc-300">고급 통계</span>
            <div class="flex gap-12">
              <X :size="20" class="text-zinc-400" />
              <Check :size="20" class="text-lime-500" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Subscription Confirmation Modal -->
    <ConfirmModal
      :isOpen="showCancelConfirm"
      title="구독 취소"
      message="정말 자동 갱신을 취소하시겠습니까?"
      description="취소해도 현재 결제 기간이 끝날 때까지 프리미엄 기능을 계속 사용할 수 있습니다. 기간 종료 후 무료 플랜으로 전환됩니다."
      confirmText="취소하기"
      cancelText="유지하기"
      variant="warning"
      @confirm="confirmCancelSubscription"
      @cancel="cancelCancelSubscription"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Check, X, Users, TrendingUp, BookOpen, AlertCircle } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import ConfirmModal from '~/components/ConfirmModal.vue'

definePageMeta({
  middleware: 'auth'
})

const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()

const currentSubscription = ref<any>(null)
const paying = ref(false)
const payingMonthly = ref(false)
const payingYearly = ref(false)
const showCancelConfirm = ref(false)
const canceling = ref(false)

onMounted(async () => {
  await userStore.fetchProfile()
  await fetchCurrentSubscription()
})

const fetchCurrentSubscription = async () => {
  if (!userStore.profile?.id) return

  try {
    const { data, error } = await client
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', userStore.profile.id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('[Subscription] Fetch error:', error)
      return
    }

    currentSubscription.value = data
  } catch (error) {
    console.error('[Subscription] Error:', error)
  }
}

const startPayment = async (planName: string) => {
  if (!userStore.profile) {
    toast.error('로그인이 필요합니다.')
    return
  }

  // 개별 버튼 로딩 상태 설정
  const isMonthly = planName === 'premium_monthly'
  if (isMonthly) {
    payingMonthly.value = true
  } else {
    payingYearly.value = true
  }
  paying.value = true

  try {
    // 1. 플랜 정보 조회
    const { data: plan } = await client
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single()

    if (!plan) {
      throw new Error('플랜을 찾을 수 없습니다.')
    }

    // 2. 주문 ID 생성 (서버에서 생성)
    const orderResponse = await $fetch('/api/payments/create-order', {
      method: 'POST',
      body: {
        planId: plan.id,
        amount: plan.price
      }
    })

    // 3. 토스 페이먼츠 SDK 로드
    const clientKey = useRuntimeConfig().public.tossClientKey
    const tossPayments = await loadTossPayments(clientKey)

    // 4. 결제 위젯 실행
    const orderName = plan.billing_period === 'yearly'
      ? '프리미엄 구독 (연간)'
      : '프리미엄 구독 (월간)'

    await tossPayments.requestPayment('카드', {
      amount: plan.price,
      orderId: orderResponse.orderId,
      orderName,
      customerName: userStore.profile.username,
      customerEmail: userStore.profile.email,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`
    })
  } catch (error: any) {
    console.error('[Payment] Error:', error)
    toast.error(error.data?.message || '결제 요청 중 오류가 발생했습니다.')
  } finally {
    paying.value = false
    payingMonthly.value = false
    payingYearly.value = false
  }
}

const handleCancelClick = () => {
  showCancelConfirm.value = true
}

const confirmCancelSubscription = async () => {
  showCancelConfirm.value = false
  canceling.value = true

  try {
    await $fetch('/api/payments/cancel-subscription', {
      method: 'POST'
    })

    toast.success('구독이 취소되었습니다. 현재 기간 종료일까지 프리미엄 기능을 사용할 수 있습니다.')
    await fetchCurrentSubscription()
  } catch (error: any) {
    console.error('[Subscription] Cancel error:', error)
    toast.error('구독 취소 중 오류가 발생했습니다.')
  } finally {
    canceling.value = false
  }
}

const cancelCancelSubscription = () => {
  showCancelConfirm.value = false
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
