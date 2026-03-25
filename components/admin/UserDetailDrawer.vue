<template>
  <Teleport to="body">
    <div v-if="show" class="relative z-50" role="dialog" aria-modal="true">
      <Transition
        enter-active-class="ease-in-out duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="ease-in-out duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="show" class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="close" />
      </Transition>

      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Transition
              enter-active-class="transform transition ease-in-out duration-300"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition ease-in-out duration-300"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
            >
              <div v-if="show" class="pointer-events-auto w-screen max-w-md">
                <div class="flex h-full flex-col overflow-y-auto bg-white dark:bg-zinc-900 shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                  <!-- Header -->
                  <div class="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 class="text-base font-semibold text-zinc-900 dark:text-white">사용자 상세</h2>
                    <button @click="close" class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <X :size="18" />
                    </button>
                  </div>

                  <div v-if="user" class="flex-1 py-6 px-6 space-y-8">
                    <!-- Profile -->
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" />
                        <span v-else class="text-lg font-semibold text-zinc-500">{{ (user.username || '?')[0] }}</span>
                      </div>
                      <div class="min-w-0">
                        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white truncate">{{ user.username }}</h3>
                        <p class="text-sm text-zinc-500 dark:text-zinc-400 truncate">{{ user.email || '-' }}</p>
                        <div class="flex items-center gap-2 mt-1.5">
                          <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            :class="{
                              'bg-zinc-100 dark:bg-zinc-800 text-zinc-500': user.subscription_tier === 'free',
                              'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': user.subscription_tier === 'premium',
                              'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400': user.subscription_tier === 'admin'
                            }"
                          >
                            {{ { free: '무료', premium: '프리미엄', admin: '관리자' }[user.subscription_tier] || user.subscription_tier }}
                          </span>
                          <span class="text-[10px] text-zinc-400">{{ formatDate(user.created_at) }} 가입</span>
                        </div>
                      </div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-3 gap-3">
                      <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-center ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                        <p class="text-2xl font-semibold text-zinc-900 dark:text-white tabular-nums">{{ stats.group_count }}</p>
                        <p class="text-[10px] text-zinc-400 mt-1">참여 그룹</p>
                      </div>
                      <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-center ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                        <p class="text-2xl font-semibold text-zinc-900 dark:text-white tabular-nums">{{ stats.read_count }}</p>
                        <p class="text-[10px] text-zinc-400 mt-1">완독</p>
                      </div>
                      <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-center ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                        <p class="text-2xl font-semibold text-zinc-900 dark:text-white tabular-nums">{{ stats.comment_count }}</p>
                        <p class="text-[10px] text-zinc-400 mt-1">댓글</p>
                      </div>
                    </div>

                    <!-- Recent Payments -->
                    <div>
                      <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">최근 결제</h3>
                      <div v-if="loadingPayments" class="flex justify-center py-6">
                        <div class="w-5 h-5 border-2 border-lime-400/30 border-t-lime-400 rounded-full animate-spin"></div>
                      </div>
                      <div v-else-if="payments.length === 0" class="text-sm text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl text-center ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                        결제 내역 없음
                      </div>
                      <div v-else class="space-y-2">
                        <div
                          v-for="payment in payments"
                          :key="payment.id"
                          class="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
                        >
                          <div>
                            <p class="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">{{ formatPrice(payment.amount) }}</p>
                            <p class="text-[10px] text-zinc-400 mt-0.5">{{ payment.plan?.display_name || '-' }} · {{ formatDateTime(payment.approved_at || payment.created_at) }}</p>
                          </div>
                          <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            :class="{
                              'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400': payment.status === 'completed',
                              'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400': payment.status === 'failed' || payment.status === 'cancelled',
                              'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400': payment.status === 'pending'
                            }"
                          >
                            {{ { completed: '완료', pending: '대기', failed: '실패', cancelled: '취소', refunded: '환불' }[payment.status] || payment.status }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div>
                      <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">관리</h3>
                      <button
                        @click="copyEmail"
                        class="w-full flex items-center gap-3 p-3.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Copy :size="15" />
                        이메일 복사
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Copy } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  show: boolean
  user: any
}>()

const emit = defineEmits(['close'])
const toast = useToastStore()

const payments = ref<any[]>([])
const loadingPayments = ref(false)
const stats = ref({ group_count: 0, read_count: 0, comment_count: 0 })

watch(() => props.show, async (val) => {
  if (val && props.user) {
    await Promise.all([
      fetchPayments(props.user.id),
      fetchStats(props.user.id)
    ])
  }
})

const close = () => emit('close')

const fetchPayments = async (userId: string) => {
  loadingPayments.value = true
  try {
    const { payments: data } = await $fetch('/api/admin/users/payments', { query: { userId } })
    payments.value = data
  } catch {
    payments.value = []
  } finally {
    loadingPayments.value = false
  }
}

const fetchStats = async (userId: string) => {
  try {
    const data = await $fetch('/api/admin/users/stats', { query: { userId } })
    stats.value = data
  } catch {
    stats.value = { group_count: 0, read_count: 0, comment_count: 0 }
  }
}

const copyEmail = () => {
  if (props.user?.email) {
    navigator.clipboard.writeText(props.user.email)
    toast.success('이메일이 복사되었습니다')
  }
}

const formatDate = (str: string) => {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear().toString().slice(-2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (str: string) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatPrice = (amount: number) => `₩${amount?.toLocaleString() || 0}`
</script>
