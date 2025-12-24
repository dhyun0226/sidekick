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
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white">사용자 관리</h1>
          </div>
          <div class="text-sm text-zinc-500">
            전체: <span class="font-bold">{{ allUsers.length }}</span>명 /
            관리자: <span class="font-bold text-purple-500">{{ adminCount }}</span>명 /
            프리미엄: <span class="font-bold text-blue-500">{{ premiumCount }}</span>명
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-8 py-8">
      <!-- Search & Filter -->
      <div class="mb-6 flex items-center gap-4">
        <!-- Search Bar -->
        <div class="relative flex-1">
          <Search :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="이름, 이메일로 검색..."
            class="w-full pl-12 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="filterTier = filter.value"
            class="px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap"
            :class="filterTier === filter.value
              ? 'bg-lime-400 text-black'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            "
          >
            {{ filter.label }} <span class="ml-1.5 text-sm opacity-75">({{ filter.count }})</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-sm text-zinc-500">불러오는 중...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center py-16">
        <div class="text-6xl mb-4">👤</div>
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          {{ searchQuery ? '검색 결과가 없습니다' : '등록된 사용자가 없습니다' }}
        </h3>
        <p class="text-sm text-zinc-500">
          {{ searchQuery ? '다른 검색어를 입력해보세요.' : '새로운 사용자가 가입하면 여기에 표시됩니다.' }}
        </p>
      </div>

      <!-- Users Table -->
      <div v-else class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">사용자</th>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">이메일</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">구독 등급</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">가입 그룹</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">가입일</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">마지막 활동</th>
              <th class="text-right px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">작업</th>
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
                  <div class="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-bold text-sm">{{ getUserInitial(user.username) }}</span>
                  </div>
                  <div>
                    <p class="font-bold text-zinc-900 dark:text-white">{{ user.username }}</p>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="px-6 py-4">
                <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ user.email }}</p>
              </td>

              <!-- Subscription Tier -->
              <td class="px-6 py-4 text-center">
                <select
                  v-model="user.subscription_tier"
                  @change="updateSubscriptionTier(user)"
                  class="text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer"
                  :class="{
                    'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400': user.subscription_tier === 'admin',
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400': user.subscription_tier === 'premium',
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400': user.subscription_tier === 'free'
                  }"
                >
                  <option value="admin">관리자</option>
                  <option value="premium">프리미엄</option>
                  <option value="free">무료</option>
                </select>
              </td>

              <!-- Group Count -->
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                  {{ user.group_count || 0 }}개
                </span>
              </td>

              <!-- Created At -->
              <td class="px-6 py-4 text-center">
                <span class="text-xs text-zinc-500">{{ formatDate(user.created_at) }}</span>
              </td>

              <!-- Last Active -->
              <td class="px-6 py-4 text-center">
                <span class="text-xs text-zinc-500">{{ formatLastActive(user.last_active_at) }}</span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <!-- No actions for now -->
                  <span class="text-xs text-zinc-400">-</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Search } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

definePageMeta({
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const loading = ref(true)
const allUsers = ref<any[]>([])

// Search & Filter
const searchQuery = ref('')
const filterTier = ref<'all' | 'admin' | 'premium' | 'free'>('all')

// Computed
const adminCount = computed(() => {
  return allUsers.value.filter(u => u.subscription_tier === 'admin').length
})

const premiumCount = computed(() => {
  return allUsers.value.filter(u => u.subscription_tier === 'premium').length
})

const freeCount = computed(() => {
  return allUsers.value.filter(u => u.subscription_tier === 'free').length
})

const filters = computed(() => [
  { label: '전체', value: 'all' as const, count: allUsers.value.length },
  { label: '관리자', value: 'admin' as const, count: adminCount.value },
  { label: '프리미엄', value: 'premium' as const, count: premiumCount.value },
  { label: '무료', value: 'free' as const, count: freeCount.value }
])

const filteredUsers = computed(() => {
  let users = allUsers.value

  // Filter by tier
  if (filterTier.value !== 'all') {
    users = users.filter(u => u.subscription_tier === filterTier.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    users = users.filter(u => {
      return (
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      )
    })
  }

  return users
})

onMounted(async () => {
  await fetchAllUsers()
})

const fetchAllUsers = async () => {
  loading.value = true

  try {
    // Fetch all users
    const { data: usersData, error: usersError } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Get group counts for each user
    const usersWithCounts = await Promise.all(
      (usersData || []).map(async (user: any) => {
        const { count } = await client
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        return {
          ...user,
          group_count: count || 0
        }
      })
    )

    allUsers.value = usersWithCounts
    console.log('[Admin] Total users:', allUsers.value.length)
  } catch (error: any) {
    console.error('[Admin] Fetch error:', error)
  } finally {
    loading.value = false
  }
}

const updateSubscriptionTier = async (user: any) => {
  try {
    const { error } = await client
      .from('users')
      .update({ subscription_tier: user.subscription_tier })
      .eq('id', user.id)

    if (error) throw error

    toast.success(`${user.username}님의 구독 등급이 ${getTierLabel(user.subscription_tier)}(으)로 변경되었습니다.`)
  } catch (error: any) {
    console.error('[Admin] Update tier error:', error)
    toast.error('구독 등급 변경에 실패했습니다.')
    // Revert on error
    await fetchAllUsers()
  }
}

const getTierLabel = (tier: string) => {
  const labels: Record<string, string> = {
    admin: '관리자',
    premium: '프리미엄',
    free: '무료'
  }
  return labels[tier] || tier
}

const getUserInitial = (username: string) => {
  return username?.charAt(0).toUpperCase() || '?'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatLastActive = (dateStr: string) => {
  if (!dateStr) return '활동 없음'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`

  return formatDate(dateStr)
}
</script>
