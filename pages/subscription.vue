<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#09090b] py-16 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div class="inline-block px-3 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-xs font-black rounded-full mb-4 uppercase tracking-widest">Premium Membership</div>
        <h1 class="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter">독서의 가치를 더 깊게</h1>
        <p class="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Sidekick 프리미엄과 함께 제한 없는 독서 여행을 시작하고<br/>나만의 독서 인사이트를 정교하게 쌓아보세요.
        </p>
      </div>

      <!-- Current Subscription Status (if active) -->
      <div v-if="currentSubscription" class="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div class="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-lime-200 dark:border-lime-900/30 shadow-xl shadow-lime-500/5 relative overflow-hidden">
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-lime-400/10 blur-[100px] rounded-full"></div>
          
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div class="flex items-center gap-5">
              <div class="w-16 h-16 bg-gradient-to-tr from-lime-400 to-lime-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-500/20">
                <Crown :size="32" class="text-black" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-xl font-black text-zinc-900 dark:text-white">{{ currentSubscription.plan?.display_name }}</h3>
                  <span class="px-2 py-0.5 bg-lime-400 text-black text-[10px] font-black rounded uppercase">Active</span>
                </div>
                <p class="text-sm text-zinc-500 font-medium">프리미엄 멤버십을 이용 중입니다</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl px-5 py-3 border border-zinc-100 dark:border-zinc-800">
                <p class="text-[10px] text-zinc-400 font-black uppercase tracking-wider mb-1">다음 결제일</p>
                <p class="text-sm font-bold text-zinc-900 dark:text-white">{{ formatDate(currentSubscription.end_date) }}</p>
              </div>
              <button
                v-if="currentSubscription.auto_renew"
                @click="handleCancelClick"
                :disabled="canceling"
                class="px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black hover:opacity-80 transition-all active:scale-95 disabled:opacity-50"
              >
                {{ canceling ? '처리 중...' : '구독 관리' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <!-- 1. Free Plan -->
        <div class="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 flex flex-col hover:shadow-lg transition-all">
          <div class="mb-8">
            <h2 class="text-lg font-black text-zinc-900 dark:text-white mb-2">무료 플랜</h2>
            <p class="text-zinc-500 text-sm mb-6 font-medium">기본적인 독서 경험</p>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-black text-zinc-900 dark:text-white">₩0</span>
              <span class="text-zinc-400 font-bold">/월</span>
            </div>
          </div>
          
          <ul class="space-y-4 mb-10 flex-1">
            <li class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 font-bold">
              <Check :size="18" class="text-lime-500" />
              독서 진도 추적
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 font-bold">
              <Check :size="18" class="text-lime-500" />
              생성 및 참여 가능 그룹 수 (1개)
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300 font-bold">
              <Check :size="18" class="text-lime-500" />
              열람 가능 도서 (최대 10권)
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-400 dark:text-zinc-600 font-bold opacity-60 line-through">
              <X :size="18" class="text-zinc-400" />
              고급 통계 분석
            </li>
          </ul>

          <button v-if="userStore.profile?.subscription_tier === 'free'" disabled class="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-black rounded-2xl cursor-not-allowed">
            현재 플랜
          </button>
          <button v-else disabled class="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-black rounded-2xl cursor-not-allowed">
            기본 플랜
          </button>
        </div>

        <!-- 2. Premium Monthly -->
        <div class="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-2 border-lime-400 dark:border-lime-500 flex flex-col shadow-xl shadow-lime-500/5 hover:scale-[1.02] transition-all relative">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-lime-400 text-black px-4 py-1 rounded-full text-xs font-black shadow-lg">POPULAR</div>
          <div class="mb-8">
            <h2 class="text-lg font-black text-zinc-900 dark:text-white mb-2">프리미엄 월간</h2>
            <p class="text-zinc-500 text-sm mb-6 font-medium">매달 가볍게 시작하기</p>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-black text-zinc-900 dark:text-white">₩2,500</span>
              <span class="text-zinc-400 font-bold">/월</span>
            </div>
          </div>
          
          <ul class="space-y-4 mb-10 flex-1">
            <li v-for="item in ['무제한 그룹 생성', '무제한 책 추가', '고급 독서 통계 및 분석', '우선 고객 지원']" :key="item" class="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200 font-bold">
              <Check :size="18" class="text-lime-500" />
              {{ item }}
            </li>
          </ul>

          <button
            @click="startPayment('premium_monthly')"
            :disabled="paying"
            class="w-full py-4 bg-lime-400 hover:bg-lime-300 text-black font-black rounded-2xl transition-all shadow-lg shadow-lime-400/20 active:scale-95"
          >
            {{ payingMonthly ? '처리 중...' : '시작하기' }}
          </button>
        </div>

        <!-- 3. Premium Yearly -->
        <div class="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 flex flex-col shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden">
          <div class="absolute -right-16 -top-16 w-48 h-48 bg-lime-400/10 blur-3xl rounded-full"></div>
          <div class="absolute top-4 right-4 bg-lime-400 text-black px-3 py-1 rounded-full text-[10px] font-black shadow-lg animate-pulse">37% 할인</div>
          
          <div class="mb-8 relative z-10">
            <h2 class="text-lg font-black text-white mb-2">프리미엄 연간</h2>
            <p class="text-zinc-400 text-sm mb-6 font-medium">최고의 효율로 즐기기</p>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-black text-lime-400">₩19,000</span>
              <span class="text-zinc-500 font-bold">/년</span>
            </div>
            <div class="text-[11px] text-lime-400/60 font-bold mt-1">월 ₩1,583 꼴 (연 11,000원 절약)</div>
          </div>
          
          <ul class="space-y-4 mb-10 flex-1 relative z-10">
            <li v-for="item in ['무제한 그룹 생성', '무제한 책 추가', '고급 독서 통계 및 분석', '우선 고객 지원']" :key="item" class="flex items-center gap-3 text-sm text-zinc-300 font-bold">
              <Check :size="18" class="text-lime-400" />
              {{ item }}
            </li>
          </ul>

          <button
            @click="startPayment('premium_yearly')"
            :disabled="paying"
            class="w-full py-4 bg-white hover:bg-zinc-100 text-black font-black rounded-2xl transition-all shadow-lg active:scale-95 relative z-10"
          >
            {{ payingYearly ? '처리 중...' : '연간 구독 시작' }}
          </button>
        </div>
      </div>

      <!-- Detailed Feature List -->
      <div class="bg-white dark:bg-zinc-900 rounded-[40px] p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h3 class="text-2xl font-black text-zinc-900 dark:text-white mb-10 text-center">왜 프리미엄인가요?</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div v-for="feat in [
            { title: '무제한 독서 모임', desc: '참여 및 생성 그룹 수에 제한이 없습니다. 다양한 모임에서 여러 권의 책을 동시에 즐기세요.', icon: Users, color: 'blue' },
            { title: '심도 있는 데이터 분석', desc: '독서 히트맵, 월별 패턴, 연간 목표 달성률 등 나만의 독서 데이터를 시각화해 드립니다.', icon: TrendingUp, color: 'lime' },
            { title: '무제한 도서 추가', desc: '모든 그룹에서 제한 없이 새로운 책을 추가하고 목차를 관리할 수 있습니다.', icon: BookOpen, color: 'purple' },
            { title: '신규 기능 우선 체험', desc: '앞으로 추가될 Sidekick의 다양한 신규 기능들을 누구보다 먼저 경험하고 제안할 수 있습니다.', icon: Sparkles, color: 'amber' }
          ]" :key="feat.title" class="flex gap-5">
            <div :class="`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-${feat.color}-50 dark:bg-${feat.color}-900/20 text-${feat.color}-500 shadow-sm`">
              <component :is="feat.icon" :size="28" />
            </div>
            <div>
              <h4 class="text-base font-bold text-zinc-900 dark:text-white mb-2">{{ feat.title }}</h4>
              <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ feat.desc }}</p>
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
import { Check, X, Users, TrendingUp, BookOpen, AlertCircle, Crown, Sparkles } from 'lucide-vue-next'
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
    if (error) throw error
    currentSubscription.value = data
  } catch (error) {
    console.error('[Subscription] Error:', error)
  }
}

const startPayment = async (planName: string) => {
  if (!userStore.profile) { toast.error('로그인이 필요합니다.'); return }
  const isMonthly = planName === 'premium_monthly'
  if (isMonthly) payingMonthly.value = true; else payingYearly.value = true
  paying.value = true
  try {
    const { data: plan } = await client.from('subscription_plans').select('*').eq('name', planName).eq('is_active', true).single()
    if (!plan) throw new Error('플랜을 찾을 수 없습니다.')
    const orderResponse = await $fetch('/api/payments/create-order', { method: 'POST', body: { planId: plan.id, amount: plan.price } })
    const clientKey = useRuntimeConfig().public.tossClientKey
    const tossPayments = await loadTossPayments(clientKey)
    const orderName = plan.billing_period === 'yearly' ? 'Sidekick 프리미엄 (연간)' : 'Sidekick 프리미엄 (월간)'
    await tossPayments.requestPayment('카드', {
      amount: plan.price,
      orderId: orderResponse.orderId,
      orderName,
      customerName: userStore.profile.nickname || userStore.profile.username,
      customerEmail: userStore.profile.email,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`
    })
  } catch (error: any) {
    toast.error(error.data?.message || '결제 요청 중 오류가 발생했습니다.')
  } finally {
    paying.value = false; payingMonthly.value = false; payingYearly.value = false
  }
}

const handleCancelClick = () => { showCancelConfirm.value = true }
const confirmCancelSubscription = async () => {
  showCancelConfirm.value = false; canceling.value = true
  try {
    await $fetch('/api/payments/cancel-subscription', { method: 'POST' })
    toast.success('구독이 취소되었습니다.')
    await fetchCurrentSubscription()
  } catch (error: any) {
    toast.error('구독 취소 중 오류가 발생했습니다.')
  } finally { canceling.value = false }
}
const cancelCancelSubscription = () => { showCancelConfirm.value = false }

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-top { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slide-in-bottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.animate-in { animation-fill-mode: both; }
.fade-in { animation-name: fade-in; }
.slide-in-from-top-4 { animation-name: slide-in-top; }
.slide-in-from-bottom-4 { animation-name: slide-in-bottom; }
.slide-in-from-bottom-8 { animation-name: slide-in-bottom; animation-duration: 1s; }
.zoom-in-95 { animation-name: zoom-in; }
</style>