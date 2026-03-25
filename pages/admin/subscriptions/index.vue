<template>
  <div>
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
    <div class="mb-6 flex overflow-x-auto pb-2 scrollbar-hide">
      <div class="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="activeTab === tab.value
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          "
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Subscriptions Tab -->
    <div v-if="activeTab === 'subscriptions'">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="relative max-w-md">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="사용자 이름, 이메일로 검색..."
              class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">사용자</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">플랜</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">상태</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">시작일</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">만료일</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">자동갱신</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr
              v-for="sub in filteredSubscriptions"
              :key="sub.id"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div>
                  <p class="font-medium text-sm text-zinc-900 dark:text-white">{{ sub.user?.username }}</p>
                  <p class="text-xs text-zinc-500">{{ sub.user?.email }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ sub.plan?.display_name }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': sub.status === 'active',
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500': sub.status === 'cancelled',
                    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400': sub.status === 'expired'
                  }"
                >
                  {{ getStatusLabel(sub.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center text-xs text-zinc-500">
                {{ formatDate(sub.start_date) }}
              </td>
              <td class="px-6 py-4 text-center text-xs text-zinc-500">
                {{ formatDate(sub.end_date) }}
              </td>
              <td class="px-6 py-4 text-center">
                <Check v-if="sub.auto_renew" :size="16" class="inline text-lime-600 dark:text-lime-400" />
                <X v-else :size="16" class="inline text-zinc-400" />
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="sub.status === 'active'"
                  @click="cancelSubscription(sub.id)"
                  class="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  취소
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payments Tab -->
    <div v-else-if="activeTab === 'payments'">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">주문ID</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">사용자</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">금액</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">결제수단</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">상태</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">결제일</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr
              v-for="payment in allPayments"
              :key="payment.id"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="text-xs font-mono text-zinc-600 dark:text-zinc-400">{{ payment.order_id.substring(0, 12) }}...</span>
              </td>
              <td class="px-6 py-4">
                <div>
                  <p class="text-sm font-medium text-zinc-900 dark:text-white">{{ payment.user?.username }}</p>
                  <p class="text-xs text-zinc-500">{{ payment.user?.email }}</p>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-bold text-zinc-900 dark:text-white">₩{{ payment.amount.toLocaleString() }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-xs text-zinc-600 dark:text-zinc-400">{{ getMethodLabel(payment.method) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': payment.status === 'completed',
                    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400': payment.status === 'pending',
                    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400': payment.status === 'failed'
                  }"
                >
                  {{ getPaymentStatusLabel(payment.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-xs text-zinc-500">{{ formatDateTime(payment.approved_at || payment.created_at) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Tiers Tab -->
    <div v-else-if="activeTab === 'tiers'">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="relative max-w-md">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="사용자 이름, 이메일로 검색..."
              class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">사용자</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">현재 등급</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">가입일</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">참여 그룹</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">등급 변경</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover rounded-full" />
                    <Users v-else :size="16" class="text-zinc-500" />
                  </div>
                  <div>
                    <p class="font-medium text-sm text-zinc-900 dark:text-white">{{ user.nickname || user.username }}</p>
                    <p class="text-xs text-zinc-500">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="{
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400': user.subscription_tier === 'free',
                    'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': user.subscription_tier === 'premium',
                    'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400': user.subscription_tier === 'admin'
                  }"
                >
                  {{ getTierLabel(user.subscription_tier) }}
                </span>
              </td>
              <td class="px-6 py-4 text-center text-xs text-zinc-500">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-4 text-center text-sm font-bold text-zinc-900 dark:text-white">
                {{ user.group_count || 0 }}
              </td>
              <td class="px-6 py-4 text-right">
                <select
                  :value="user.subscription_tier"
                  @change="updateUserTier(user.id, ($event.target as HTMLSelectElement).value)"
                  class="text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white py-1 pl-2 pr-6"
                >
                  <option value="free">무료</option>
                  <option value="premium">프리미엄</option>
                  <option value="admin">관리자</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Limits Tab -->
    <div v-else-if="activeTab === 'limits'">
      <div class="mb-6">
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <div class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">ℹ️</div>
          <div class="text-sm text-blue-700 dark:text-blue-300">
            <p class="font-bold mb-1">구독 제한 설정</p>
            <p class="text-xs">여기서 변경한 값은 즉시 모든 사용자에게 적용됩니다. <strong>-1은 무제한</strong>을 의미합니다.</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="limit in subscriptionLimits"
          :key="limit.tier"
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-zinc-900 dark:text-white">{{ getTierLabel(limit.tier) }}</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {{ limit.tier }}
            </span>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-zinc-500 mb-1.5">최대 그룹 수</label>
              <input
                v-model.number="limit.max_groups_created"
                type="number"
                min="-1"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                @blur="updateLimit(limit)"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-500 mb-1.5">그룹당 최대 책</label>
              <input
                v-model.number="limit.max_books_per_group"
                type="number"
                min="-1"
                class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 outline-none"
                @blur="updateLimit(limit)"
              />
            </div>

            <div class="pt-2">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="limit.has_statistics_access"
                  type="checkbox"
                  class="w-4 h-4 text-lime-600 rounded border-zinc-300 focus:ring-lime-500"
                  @change="updateLimit(limit)"
                />
                <span class="text-sm text-zinc-700 dark:text-zinc-300">통계 기능 접근 허용</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Tab -->
    <div v-else-if="activeTab === 'analytics'">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div class="text-xs text-zinc-500 mb-1">전환율</div>
          <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ conversionRate.toFixed(1) }}%</div>
        </div>
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div class="text-xs text-zinc-500 mb-1">이탈률</div>
          <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ churnRate.toFixed(1) }}%</div>
        </div>
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div class="text-xs text-zinc-500 mb-1">평균 구독 기간</div>
          <div class="text-xl font-bold text-zinc-900 dark:text-white">{{ avgSubscriptionDuration.toFixed(1) }}개월</div>
        </div>
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div class="text-xs text-zinc-500 mb-1">MRR</div>
          <div class="text-xl font-bold text-zinc-900 dark:text-white">₩{{ Math.floor(mrr).toLocaleString() }}</div>
        </div>
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div class="text-xs text-zinc-500 mb-1">ARR</div>
          <div class="text-xl font-bold text-zinc-900 dark:text-white">₩{{ Math.floor(arr).toLocaleString() }}</div>
        </div>
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div class="text-xs text-zinc-500 mb-1">ARPU</div>
          <div class="text-xl font-bold text-zinc-900 dark:text-white">₩{{ Math.floor(arpu).toLocaleString() }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Monthly Revenue Chart -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 class="text-base font-bold text-zinc-900 dark:text-white mb-4">월별 수익</h3>
          <div class="space-y-4">
            <div v-for="month in monthlyRevenueData" :key="month.label">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-zinc-500">{{ month.label }}</span>
                <span class="font-bold text-zinc-900 dark:text-white">₩{{ month.revenue.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-blue-500 h-full rounded-full"
                  :style="{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Churn Chart -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 class="text-base font-bold text-zinc-900 dark:text-white mb-4">신규 vs 해지</h3>
          <div class="space-y-4">
            <div v-for="month in monthlyChurnData" :key="month.label">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-zinc-500">{{ month.label }}</span>
                <div class="flex gap-2">
                  <span class="text-lime-600">+{{ month.newSubs }}</span>
                  <span class="text-red-600">-{{ month.churned }}</span>
                </div>
              </div>
              <div class="flex gap-1 h-2">
                <div class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-l-full overflow-hidden flex justify-end">
                   <div class="bg-lime-500 h-full" :style="{ width: `${(month.newSubs / maxChurnCount) * 100}%` }"></div>
                </div>
                <div class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-r-full overflow-hidden">
                   <div class="bg-red-500 h-full" :style="{ width: `${(month.churned / maxChurnCount) * 100}%` }"></div>
                </div>
              </div>
            </div>
          </div>
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
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const activeTab = ref<'subscriptions' | 'payments' | 'tiers' | 'limits' | 'analytics'>('subscriptions')
const searchQuery = ref('')
const allSubscriptions = ref<any[]>([])
const allPayments = ref<any[]>([])
const allUsers = ref<any[]>([])
const subscriptionLimits = ref<any[]>([])
const subscriptionPlans = ref<any[]>([])
const editingLimit = ref<any>(null)

const tabs = [
  { label: '구독 관리', value: 'subscriptions' },
  { label: '결제 내역', value: 'payments' },
  { label: '등급 관리', value: 'tiers' },
  { label: '제한 설정', value: 'limits' },
  { label: '통계', value: 'analytics' }
]

// Computed: Filtered Subscriptions
const filteredSubscriptions = computed(() => {
  if (!searchQuery.value) return allSubscriptions.value
  const query = searchQuery.value.toLowerCase()
  return allSubscriptions.value.filter(sub => 
    sub.user?.username?.toLowerCase().includes(query) ||
    sub.user?.email?.toLowerCase().includes(query)
  )
})

// Computed: Filtered Users
const filteredUsers = computed(() => {
  if (!searchQuery.value) return allUsers.value
  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(user => 
    user.username?.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query) ||
    user.nickname?.toLowerCase().includes(query)
  )
})

// Computed: Stats
const activeCount = computed(() => allSubscriptions.value.filter(s => s.status === 'active').length)

const monthlyRevenue = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return allPayments.value
    .filter(p => {
      const d = new Date(p.approved_at || p.created_at)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status === 'completed'
    })
    .reduce((sum, p) => sum + p.amount, 0)
})

const totalRevenue = computed(() => {
  return allPayments.value
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
})

const expiringCount = computed(() => {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return allSubscriptions.value.filter(s => {
    if (s.status !== 'active') return false
    const endDate = new Date(s.end_date)
    return endDate > now && endDate <= sevenDaysLater
  }).length
})

// Analytics Computed Properties
const conversionRate = computed(() => {
  if (allUsers.value.length === 0) return 0
  const premiumUsers = allUsers.value.filter(u => u.subscription_tier !== 'free').length
  return (premiumUsers / allUsers.value.length) * 100
})

const churnRate = computed(() => {
  const totalSubs = allSubscriptions.value.length
  if (totalSubs === 0) return 0
  const cancelledSubs = allSubscriptions.value.filter(s => s.status === 'cancelled').length
  return (cancelledSubs / totalSubs) * 100
})

const avgSubscriptionDuration = computed(() => {
  const endedSubs = allSubscriptions.value.filter(s => s.status === 'cancelled' || s.status === 'expired')
  if (endedSubs.length === 0) return 0
  
  const totalDurationDays = endedSubs.reduce((sum, s) => {
    const start = new Date(s.start_date)
    const end = new Date(s.cancelled_at || s.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return sum + (diffTime / (1000 * 60 * 60 * 24)) 
  }, 0)
  
  return (totalDurationDays / endedSubs.length) / 30 // Convert to months
})

// MRR (Monthly Recurring Revenue): 월간 반복 수익
const mrr = computed(() => {
  if (subscriptionPlans.value.length === 0) return 0

  return allSubscriptions.value
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      // 해당 구독의 플랜 정보 찾기
      const plan = subscriptionPlans.value.find(p => p.id === s.plan_id)
      if (!plan) return sum

      // 월간 플랜이면 가격 그대로, 연간이면 / 12
      if (plan.interval === 'monthly') {
        return sum + plan.price
      } else if (plan.interval === 'yearly') {
        return sum + (plan.price / 12)
      }
      return sum
    }, 0)
})

const arr = computed(() => mrr.value * 12)

const arpu = computed(() => {
  if (activeCount.value === 0) return 0
  return mrr.value / activeCount.value
})

const monthlyRevenueData = computed(() => {
  const months = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = d.toLocaleString('ko-KR', { month: 'long' })
    const year = d.getFullYear()
    const month = d.getMonth()
    
    const revenue = allPayments.value
      .filter(p => {
        const pd = new Date(p.approved_at || p.created_at)
        return pd.getMonth() === month && pd.getFullYear() === year && p.status === 'completed'
      })
      .reduce((sum, p) => sum + p.amount, 0)
      
    months.push({ label: monthLabel, revenue })
  }
  return months
})

const maxMonthlyRevenue = computed(() => {
  return Math.max(...monthlyRevenueData.value.map(d => d.revenue), 1)
})

const monthlyChurnData = computed(() => {
  const months = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = d.toLocaleString('ko-KR', { month: 'long' })
    const year = d.getFullYear()
    const month = d.getMonth()
    
    const newSubs = allSubscriptions.value.filter(s => {
      const sd = new Date(s.created_at)
      return sd.getMonth() === month && sd.getFullYear() === year
    }).length
    
    const churned = allSubscriptions.value.filter(s => {
      if (s.status !== 'cancelled' && s.status !== 'expired') return false
      const ed = new Date(s.cancelled_at || s.end_date)
      return ed.getMonth() === month && ed.getFullYear() === year
    }).length
    
    months.push({ label: monthLabel, newSubs, churned })
  }
  return months
})

const maxChurnCount = computed(() => {
  return Math.max(
    ...monthlyChurnData.value.map(d => Math.max(d.newSubs, d.churned)),
    1
  )
})

onMounted(async () => {
  await Promise.all([
    fetchSubscriptions(),
    fetchPayments(),
    fetchUsers(),
    fetchLimits(),
    fetchPlans()
  ])
})

// Fetch subscription plans
const fetchPlans = async () => {
  try {
    const { plans } = await $fetch('/api/admin/plans/list')
    subscriptionPlans.value = plans || []
  } catch (error) {
    console.error('[Admin] Plans fetch error:', error)
  }
}


const fetchSubscriptions = async () => {
  try {
    const { subscriptions } = await $fetch('/api/admin/subscriptions/list')
    allSubscriptions.value = subscriptions || []
  } catch (error) {
    console.error('[Admin] Subscriptions fetch error:', error)
  }
}

const fetchPayments = async () => {
  try {
    const { payments } = await $fetch('/api/admin/payments/list')
    allPayments.value = payments || []
  } catch (error) {
    console.error('[Admin] Payments fetch error:', error)
  }
}

const cancelSubscription = async (subscriptionId: string) => {
  if (!confirm('정말 이 구독을 취소하시겠습니까?')) return

  try {
    // 취소는 일단 직접 DB 조회 (나중에 API로 변경 가능)
    const { error } = await client
      .from('subscriptions')
      .update({
        auto_renew: false,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) throw error

    toast.success('구독이 취소되었습니다')
    await fetchSubscriptions()
  } catch (error) {
    console.error('[Admin] Cancel error:', error)
    toast.error('구독 취소에 실패했습니다')
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
    completed: '완료',
    pending: '대기',
    failed: '실패',
    cancelled: '취소',
    refunded: '환불'
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

// Fetch all users with group participation count
const fetchUsers = async () => {
  try {
    const { users } = await $fetch('/api/admin/users/list')
    allUsers.value = users || []
  } catch (error) {
    console.error('[Admin] Users fetch error:', error)
    toast.error('사용자 목록 조회에 실패했습니다')
  }
}

// Fetch subscription limits configuration
const fetchLimits = async () => {
  try {
    const { limits } = await $fetch('/api/admin/limits/list')
    subscriptionLimits.value = limits || []
  } catch (error) {
    console.error('[Admin] Limits fetch error:', error)
    toast.error('제한 설정 조회에 실패했습니다')
  }
}

// Update user's subscription tier
const updateUserTier = async (userId: string, newTier: string) => {
  try {
    await $fetch('/api/admin/users/update-tier', {
      method: 'POST',
      body: { userId, tier: newTier }
    })

    toast.success('사용자 등급이 변경되었습니다')
    await fetchUsers()
  } catch (error) {
    console.error('[Admin] Update tier error:', error)
    toast.error('등급 변경에 실패했습니다')
  }
}

// Update subscription limit settings
const updateLimit = async (limit: any) => {
  try {
    await $fetch('/api/admin/limits/update', {
      method: 'POST',
      body: {
        tier: limit.tier,
        max_groups_created: limit.max_groups_created,
        max_books_per_group: limit.max_books_per_group,
        has_statistics_access: limit.has_statistics_access
      }
    })

    toast.success('설정이 저장되었습니다')
    await fetchLimits()
  } catch (error) {
    console.error('[Admin] Update limit error:', error)
    toast.error('설정 저장에 실패했습니다')
  }
}

// Get Korean label for tier
const getTierLabel = (tier: string) => {
  const labels: Record<string, string> = {
    free: '무료',
    premium: '프리미엄',
    admin: '관리자'
  }
  return labels[tier] || tier
}
</script>