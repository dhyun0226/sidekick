<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <!-- Header -->
    <div class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
      <div class="px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/admin" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <ArrowLeft :size="20" />
            </NuxtLink>
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white">구독 & 결제 관리</h1>
          </div>
          <div class="text-sm text-zinc-500">
            활성: <span class="font-bold text-lime-500">{{ activeCount }}</span>명 /
            월 수익: <span class="font-bold text-blue-500">₩{{ monthlyRevenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 bg-lime-100 dark:bg-lime-900/20 rounded-lg flex items-center justify-center">
              <Users :size="20" class="text-lime-600 dark:text-lime-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{{ activeCount }}</div>
          <div class="text-xs text-zinc-500">활성 구독</div>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <DollarSign :size="20" class="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">₩{{ monthlyRevenue.toLocaleString() }}</div>
          <div class="text-xs text-zinc-500">이번 달 수익</div>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp :size="20" class="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">₩{{ totalRevenue.toLocaleString() }}</div>
          <div class="text-xs text-zinc-500">전체 수익</div>
        </div>

        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-2">
            <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Calendar :size="20" class="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{{ expiringCount }}</div>
          <div class="text-xs text-zinc-500">7일 내 만료</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6 flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          class="px-4 py-2 rounded-lg font-medium transition-all"
          :class="activeTab === tab.value
            ? 'bg-lime-400 text-black'
            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
          "
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Subscriptions Tab -->
      <div v-if="activeTab === 'subscriptions'">
        <!-- Search -->
        <div class="mb-6">
          <div class="relative">
            <Search :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="사용자 이름, 이메일로 검색..."
              class="w-full pl-12 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </div>
        </div>

        <!-- Subscriptions Table -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table class="w-full">
            <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">사용자</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">플랜</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">상태</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">시작일</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">만료일</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">자동갱신</th>
                <th class="text-right px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr
                v-for="sub in filteredSubscriptions"
                :key="sub.id"
                class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <!-- User -->
                <td class="px-6 py-4">
                  <div>
                    <p class="font-bold text-zinc-900 dark:text-white text-sm">{{ sub.user?.username }}</p>
                    <p class="text-xs text-zinc-500">{{ sub.user?.email }}</p>
                  </div>
                </td>

                <!-- Plan -->
                <td class="px-6 py-4">
                  <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ sub.plan?.display_name }}</span>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': sub.status === 'active',
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-500': sub.status === 'cancelled',
                      'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400': sub.status === 'expired'
                    }"
                  >
                    {{ getStatusLabel(sub.status) }}
                  </span>
                </td>

                <!-- Start Date -->
                <td class="px-6 py-4 text-center">
                  <span class="text-xs text-zinc-500">{{ formatDate(sub.start_date) }}</span>
                </td>

                <!-- End Date -->
                <td class="px-6 py-4 text-center">
                  <span class="text-xs text-zinc-500">{{ formatDate(sub.end_date) }}</span>
                </td>

                <!-- Auto Renew -->
                <td class="px-6 py-4 text-center">
                  <span v-if="sub.auto_renew" class="text-lime-600 dark:text-lime-400">
                    <Check :size="16" class="inline" />
                  </span>
                  <span v-else class="text-zinc-400">
                    <X :size="16" class="inline" />
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="sub.status === 'active'"
                      @click="cancelSubscription(sub.id)"
                      class="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payments Tab -->
      <div v-else-if="activeTab === 'payments'">
        <!-- Payments Table -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table class="w-full">
            <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">주문ID</th>
                <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">사용자</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">금액</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">결제수단</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">상태</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">결제일</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr
                v-for="payment in allPayments"
                :key="payment.id"
                class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <!-- Order ID -->
                <td class="px-6 py-4">
                  <span class="text-xs font-mono text-zinc-600 dark:text-zinc-400">{{ payment.order_id.substring(0, 20) }}...</span>
                </td>

                <!-- User -->
                <td class="px-6 py-4">
                  <div>
                    <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ payment.user?.username }}</p>
                    <p class="text-xs text-zinc-500">{{ payment.user?.email }}</p>
                  </div>
                </td>

                <!-- Amount -->
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-bold text-zinc-900 dark:text-white">₩{{ payment.amount.toLocaleString() }}</span>
                </td>

                <!-- Method -->
                <td class="px-6 py-4 text-center">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">{{ getMethodLabel(payment.method) }}</span>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': payment.status === 'done',
                      'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400': payment.status === 'pending',
                      'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400': payment.status === 'failed'
                    }"
                  >
                    {{ getPaymentStatusLabel(payment.status) }}
                  </span>
                </td>

                <!-- Date -->
                <td class="px-6 py-4 text-center">
                  <span class="text-xs text-zinc-500">{{ formatDateTime(payment.approved_at || payment.created_at) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Search, Users, DollarSign, TrendingUp, Calendar, Check, X } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

definePageMeta({
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const activeTab = ref<'subscriptions' | 'payments'>('subscriptions')
const searchQuery = ref('')
const allSubscriptions = ref<any[]>([])
const allPayments = ref<any[]>([])

const tabs = [
  { label: '구독 관리', value: 'subscriptions' },
  { label: '결제 내역', value: 'payments' }
]

// Computed
const activeCount = computed(() => {
  return allSubscriptions.value.filter(s => s.status === 'active').length
})

const expiringCount = computed(() => {
  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  return allSubscriptions.value.filter(s => {
    if (s.status !== 'active') return false
    const endDate = new Date(s.end_date)
    return endDate <= sevenDaysLater && endDate > new Date()
  }).length
})

const monthlyRevenue = computed(() => {
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()

  return allPayments.value
    .filter(p => {
      if (p.status !== 'done') return false
      const date = new Date(p.approved_at)
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear
    })
    .reduce((sum, p) => sum + p.amount, 0)
})

const totalRevenue = computed(() => {
  return allPayments.value
    .filter(p => p.status === 'done')
    .reduce((sum, p) => sum + p.amount, 0)
})

const filteredSubscriptions = computed(() => {
  if (!searchQuery.value.trim()) return allSubscriptions.value

  const query = searchQuery.value.toLowerCase()
  return allSubscriptions.value.filter(s => {
    return (
      s.user?.username?.toLowerCase().includes(query) ||
      s.user?.email?.toLowerCase().includes(query)
    )
  })
})

onMounted(async () => {
  await Promise.all([
    fetchSubscriptions(),
    fetchPayments()
  ])
})

const fetchSubscriptions = async () => {
  const { data, error } = await client
    .from('subscriptions')
    .select(`
      *,
      user:users!subscriptions_user_id_fkey(id, username, email),
      plan:subscription_plans(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Subscriptions fetch error:', error)
  } else {
    allSubscriptions.value = data || []
  }
}

const fetchPayments = async () => {
  const { data, error } = await client
    .from('payments')
    .select(`
      *,
      user:users!payments_user_id_fkey(id, username, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Payments fetch error:', error)
  } else {
    allPayments.value = data || []
  }
}

const cancelSubscription = async (subscriptionId: string) => {
  if (!confirm('정말 이 구독을 취소하시겠습니까?')) return

  try {
    const { error } = await client
      .from('subscriptions')
      .update({
        auto_renew: false,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) throw error

    toast.success('구독이 취소되었습니다.')
    await fetchSubscriptions()
  } catch (error) {
    console.error('[Admin] Cancel error:', error)
    toast.error('구독 취소에 실패했습니다.')
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '활성',
    cancelled: '취소됨',
    expired: '만료'
  }
  return labels[status] || status
}

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    done: '완료',
    pending: '대기',
    failed: '실패',
    cancelled: '취소'
  }
  return labels[status] || status
}

const getMethodLabel = (method: string | null) => {
  if (!method) return '-'
  const labels: Record<string, string> = {
    card: '카드',
    transfer: '계좌이체',
    easy_payment: '간편결제'
  }
  return labels[method] || method
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
