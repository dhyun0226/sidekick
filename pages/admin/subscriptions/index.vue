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

      <!-- User Tiers Tab -->
      <div v-else-if="activeTab === 'tiers'">
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

        <!-- Users Table -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table class="w-full">
            <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">사용자</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">현재 등급</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">가입일</th>
                <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">참여 그룹</th>
                <th class="text-right px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">등급 변경</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <!-- User Info -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                      <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                        <Users :size="20" />
                      </div>
                    </div>
                    <div>
                      <p class="font-bold text-zinc-900 dark:text-white text-sm">{{ user.nickname || user.username }}</p>
                      <p class="text-xs text-zinc-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Current Tier -->
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                    :class="{
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400': user.subscription_tier === 'free',
                      'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': user.subscription_tier === 'premium',
                      'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400': user.subscription_tier === 'admin'
                    }"
                  >
                    {{ getTierLabel(user.subscription_tier) }}
                  </span>
                </td>

                <!-- Created At -->
                <td class="px-6 py-4 text-center">
                  <span class="text-xs text-zinc-500">{{ formatDate(user.created_at) }}</span>
                </td>

                <!-- Group Count -->
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ user.group_count || 0 }}개</span>
                </td>

                <!-- Tier Change -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <select
                      :value="user.subscription_tier"
                      @change="updateUserTier(user.id, ($event.target as HTMLSelectElement).value)"
                      class="px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="free">무료</option>
                      <option value="premium">프리미엄</option>
                      <option value="admin">관리자</option>
                    </select>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Limits Tab -->
      <div v-else-if="activeTab === 'limits'">
        <div class="mb-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <div class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">ℹ️</div>
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-bold mb-1">구독 제한 설정</p>
                <p class="text-xs">여기서 변경한 값은 즉시 모든 사용자에게 적용됩니다. <strong>-1은 무제한</strong>을 의미합니다.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Limits Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="limit in subscriptionLimits"
            :key="limit.tier"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h3
                class="text-lg font-bold"
                :class="{
                  'text-zinc-600 dark:text-zinc-400': limit.tier === 'free',
                  'text-lime-600 dark:text-lime-400': limit.tier === 'premium',
                  'text-purple-600 dark:text-purple-400': limit.tier === 'admin'
                }"
              >
                {{ getTierLabel(limit.tier) }}
              </h3>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold"
                :class="{
                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400': limit.tier === 'free',
                  'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400': limit.tier === 'premium',
                  'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400': limit.tier === 'admin'
                }"
              >
                {{ limit.tier.toUpperCase() }}
              </span>
            </div>

            <!-- Settings -->
            <div class="space-y-4">
              <!-- Max Groups -->
              <div>
                <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">최대 그룹 수</label>
                <input
                  v-model.number="limit.max_groups_created"
                  type="number"
                  min="-1"
                  class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  @blur="updateLimit(limit)"
                />
                <p class="text-xs text-zinc-500 mt-1">-1 = 무제한</p>
              </div>

              <!-- Max Books Per Group -->
              <div>
                <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">그룹당 최대 책</label>
                <input
                  v-model.number="limit.max_books_per_group"
                  type="number"
                  min="-1"
                  class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  @blur="updateLimit(limit)"
                />
                <p class="text-xs text-zinc-500 mt-1">-1 = 무제한</p>
              </div>

              <!-- Has Statistics Access -->
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="limit.has_statistics_access"
                    type="checkbox"
                    class="w-4 h-4 text-lime-600 border-zinc-300 rounded focus:ring-lime-500"
                    @change="updateLimit(limit)"
                  />
                  <span class="text-sm text-zinc-700 dark:text-zinc-300">통계 기능 접근</span>
                </label>
              </div>

              <!-- Save Button -->
              <button
                @click="updateLimit(limit)"
                class="w-full py-2 bg-lime-400 text-black font-bold rounded-lg hover:bg-lime-300 transition-colors text-sm"
              >
                변경사항 저장
              </button>
            </div>
          </div>
        </div>

        <!-- Current Settings Table -->
        <div class="mt-8">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">현재 설정 요약</h3>
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table class="w-full">
              <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">등급</th>
                  <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">최대 그룹</th>
                  <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">그룹당 최대 책</th>
                  <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">통계 접근</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr
                  v-for="limit in subscriptionLimits"
                  :key="limit.tier"
                  class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td class="px-6 py-4">
                    <span class="font-bold text-zinc-900 dark:text-white">{{ getTierLabel(limit.tier) }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-sm text-zinc-700 dark:text-zinc-300">
                      {{ limit.max_groups_created === -1 ? '무제한' : limit.max_groups_created }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-sm text-zinc-700 dark:text-zinc-300">
                      {{ limit.max_books_per_group === -1 ? '무제한' : limit.max_books_per_group }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span v-if="limit.has_statistics_access" class="text-lime-600 dark:text-lime-400">
                      <Check :size="16" class="inline" />
                    </span>
                    <span v-else class="text-zinc-400">
                      <X :size="16" class="inline" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-else-if="activeTab === 'analytics'">
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <!-- Conversion Rate -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">전환율</div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{{ conversionRate.toFixed(1) }}%</div>
            <div class="text-xs text-zinc-400">프리미엄 전환</div>
          </div>

          <!-- Churn Rate -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">이탈률</div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{{ churnRate.toFixed(1) }}%</div>
            <div class="text-xs text-zinc-400">구독 취소</div>
          </div>

          <!-- Avg Duration -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">평균 구독</div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{{ avgSubscriptionDuration.toFixed(1) }}</div>
            <div class="text-xs text-zinc-400">개월</div>
          </div>

          <!-- MRR -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">MRR</div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">₩{{ Math.floor(mrr).toLocaleString() }}</div>
            <div class="text-xs text-zinc-400">월간 반복 수익</div>
          </div>

          <!-- ARR -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">ARR</div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">₩{{ Math.floor(arr).toLocaleString() }}</div>
            <div class="text-xs text-zinc-400">연간 반복 수익</div>
          </div>

          <!-- ARPU -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">ARPU</div>
            <div class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">₩{{ Math.floor(arpu).toLocaleString() }}</div>
            <div class="text-xs text-zinc-400">사용자당 수익</div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Monthly Revenue Chart -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">월별 수익 추이</h3>
            <div class="space-y-3">
              <div v-for="month in monthlyRevenueData" :key="month.label" class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-zinc-600 dark:text-zinc-400">{{ month.label }}</span>
                  <span class="font-bold text-zinc-900 dark:text-white">₩{{ month.revenue.toLocaleString() }}</span>
                </div>
                <div class="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-300"
                    :style="{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Churn Chart -->
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">신규 가입 vs 해지</h3>
            <div class="space-y-3">
              <div v-for="month in monthlyChurnData" :key="month.label" class="space-y-1">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-zinc-600 dark:text-zinc-400">{{ month.label }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-lime-600 dark:text-lime-400">+{{ month.newSubs }}</span>
                    <span class="text-red-600 dark:text-red-400">-{{ month.churned }}</span>
                  </div>
                </div>
                <div class="flex gap-1">
                  <!-- New Subs Bar -->
                  <div class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      class="bg-gradient-to-r from-lime-400 to-lime-600 h-full rounded-full transition-all duration-300"
                      :style="{ width: `${(month.newSubs / maxChurnCount) * 100}%` }"
                    ></div>
                  </div>
                  <!-- Churned Bar -->
                  <div class="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      class="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-300"
                      :style="{ width: `${(month.churned / maxChurnCount) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Summary Table -->
        <div>
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">월별 요약</h3>
          <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table class="w-full">
              <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">월</th>
                  <th class="text-right px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">수익</th>
                  <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">신규 가입</th>
                  <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">해지</th>
                  <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">순증감</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr
                  v-for="(month, idx) in monthlyRevenueData"
                  :key="month.label"
                  class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td class="px-6 py-4">
                    <span class="font-medium text-zinc-900 dark:text-white">{{ month.label }}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="font-bold text-zinc-900 dark:text-white">₩{{ month.revenue.toLocaleString() }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-sm text-lime-600 dark:text-lime-400 font-medium">+{{ monthlyChurnData[idx].newSubs }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-sm text-red-600 dark:text-red-400 font-medium">{{ monthlyChurnData[idx].churned }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      class="text-sm font-bold"
                      :class="(monthlyChurnData[idx].newSubs - monthlyChurnData[idx].churned) >= 0
                        ? 'text-lime-600 dark:text-lime-400'
                        : 'text-red-600 dark:text-red-400'
                      "
                    >
                      {{ monthlyChurnData[idx].newSubs - monthlyChurnData[idx].churned >= 0 ? '+' : '' }}{{ monthlyChurnData[idx].newSubs - monthlyChurnData[idx].churned }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
const editingLimit = ref<any>(null)

const tabs = [
  { label: '구독 관리', value: 'subscriptions' },
  { label: '결제 내역', value: 'payments' },
  { label: '사용자 등급', value: 'tiers' },
  { label: '제한 설정', value: 'limits' },
  { label: '분석', value: 'analytics' }
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

// Computed for filtered users
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return allUsers.value

  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(u => {
    return (
      u.nickname?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  })
})

// === KPI Metrics ===

// 전환율: (프리미엄 사용자 / 전체 사용자) * 100
const conversionRate = computed(() => {
  const totalUsers = allUsers.value.length
  if (totalUsers === 0) return 0
  const premiumUsers = allUsers.value.filter(u => u.subscription_tier === 'premium' || u.subscription_tier === 'admin').length
  return (premiumUsers / totalUsers) * 100
})

// 이탈률: (취소된 구독 / (활성 + 취소된 구독)) * 100
const churnRate = computed(() => {
  const activeAndCancelled = allSubscriptions.value.filter(s => s.status === 'active' || s.status === 'cancelled')
  if (activeAndCancelled.length === 0) return 0
  const cancelled = allSubscriptions.value.filter(s => s.status === 'cancelled').length
  return (cancelled / activeAndCancelled.length) * 100
})

// 평균 구독 기간 (개월)
const avgSubscriptionDuration = computed(() => {
  const completed = allSubscriptions.value.filter(s => s.status === 'expired' || s.status === 'cancelled')
  if (completed.length === 0) return 0

  const totalMonths = completed.reduce((sum, s) => {
    const start = new Date(s.start_date)
    const end = new Date(s.end_date)
    const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    return sum + months
  }, 0)

  return totalMonths / completed.length
})

// MRR (Monthly Recurring Revenue): 월간 반복 수익
const mrr = computed(() => {
  const activeMonthly = allSubscriptions.value.filter(s => {
    return s.status === 'active' && s.plan?.interval === 'monthly'
  }).length

  const activeYearly = allSubscriptions.value.filter(s => {
    return s.status === 'active' && s.plan?.interval === 'yearly'
  }).length

  return (activeMonthly * 2500) + (activeYearly * 19000 / 12)
})

// ARR (Annual Recurring Revenue): 연간 반복 수익
const arr = computed(() => {
  return mrr.value * 12
})

// ARPU (Average Revenue Per User): 사용자당 평균 수익
const arpu = computed(() => {
  const premiumUsers = allUsers.value.filter(u => u.subscription_tier === 'premium' || u.subscription_tier === 'admin').length
  if (premiumUsers === 0) return 0
  return totalRevenue.value / premiumUsers
})

// 월별 수익 데이터 (최근 6개월)
const monthlyRevenueData = computed(() => {
  const months: any[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.getMonth()
    const year = date.getFullYear()

    const revenue = allPayments.value
      .filter(p => {
        if (p.status !== 'done') return false
        const paymentDate = new Date(p.approved_at)
        return paymentDate.getMonth() === month && paymentDate.getFullYear() === year
      })
      .reduce((sum, p) => sum + p.amount, 0)

    months.push({
      label: `${year}.${(month + 1).toString().padStart(2, '0')}`,
      revenue,
      month,
      year
    })
  }

  return months
})

// 월별 신규 가입 vs 해지
const monthlyChurnData = computed(() => {
  const months: any[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.getMonth()
    const year = date.getFullYear()

    const newSubs = allSubscriptions.value.filter(s => {
      const startDate = new Date(s.start_date)
      return startDate.getMonth() === month && startDate.getFullYear() === year
    }).length

    const churned = allSubscriptions.value.filter(s => {
      if (!s.cancelled_at) return false
      const cancelDate = new Date(s.cancelled_at)
      return cancelDate.getMonth() === month && cancelDate.getFullYear() === year
    }).length

    months.push({
      label: `${year}.${(month + 1).toString().padStart(2, '0')}`,
      newSubs,
      churned,
      month,
      year
    })
  }

  return months
})

// 최대 수익 (차트 스케일용)
const maxMonthlyRevenue = computed(() => {
  return Math.max(...monthlyRevenueData.value.map(m => m.revenue), 1)
})

// 최대 가입/해지 수 (차트 스케일용)
const maxChurnCount = computed(() => {
  return Math.max(
    ...monthlyChurnData.value.map(m => Math.max(m.newSubs, m.churned)),
    1
  )
})

onMounted(async () => {
  await Promise.all([
    fetchSubscriptions(),
    fetchPayments(),
    fetchUsers(),
    fetchLimits()
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

// Fetch all users with group participation count
const fetchUsers = async () => {
  try {
    const { data, error } = await client
      .from('users')
      .select(`
        *,
        group_members(group_id)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process data to count unique groups per user
    allUsers.value = (data || []).map(u => ({
      ...u,
      group_count: u.group_members?.length || 0
    }))
  } catch (error) {
    console.error('[Admin] Users fetch error:', error)
    toast.error('사용자 목록 조회 실패')
  }
}

// Fetch subscription limits configuration
const fetchLimits = async () => {
  try {
    const { data, error } = await client
      .from('subscription_limits')
      .select('*')
      .order('tier')

    if (error) throw error

    subscriptionLimits.value = data || []
  } catch (error) {
    console.error('[Admin] Limits fetch error:', error)
    toast.error('제한 설정 조회 실패')
  }
}

// Update user's subscription tier
const updateUserTier = async (userId: string, newTier: string) => {
  try {
    const { error } = await client
      .from('users')
      .update({ subscription_tier: newTier })
      .eq('id', userId)

    if (error) throw error

    toast.success('사용자 등급이 변경되었습니다.')
    await fetchUsers()
  } catch (error) {
    console.error('[Admin] Update tier error:', error)
    toast.error('등급 변경에 실패했습니다.')
  }
}

// Update subscription limit settings
const updateLimit = async (limit: any) => {
  try {
    const { error } = await client
      .from('subscription_limits')
      .update({
        max_groups_created: limit.max_groups_created,
        max_books_per_group: limit.max_books_per_group,
        has_statistics_access: limit.has_statistics_access
      })
      .eq('tier', limit.tier)

    if (error) throw error

    toast.success('설정이 저장되었습니다.')
    await fetchLimits()
  } catch (error) {
    console.error('[Admin] Update limit error:', error)
    toast.error('설정 저장에 실패했습니다.')
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
