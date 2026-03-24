<template>
  <div>
    <!-- Stats / Summary (Optional, smaller version) -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">전체 사용자</p>
          <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ allUsers.length }}</p>
        </div>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <Users :size="20" class="text-zinc-500" />
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">관리자</p>
          <p class="text-2xl font-bold text-purple-600">{{ adminCount }}</p>
        </div>
        <div class="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Shield :size="20" class="text-purple-600" />
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">프리미엄</p>
          <p class="text-2xl font-bold text-blue-600">{{ premiumCount }}</p>
        </div>
        <div class="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bg-white dark:bg-zinc-900 rounded-t-xl border-x border-t border-zinc-200 dark:border-zinc-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <!-- Search -->
      <div class="relative w-full md:w-96">
        <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="사용자 검색..."
          class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
        />
      </div>

      <!-- Filters -->
      <div class="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="filterTier = filter.value"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          :class="filterTier === filter.value
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          "
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-zinc-900 rounded-b-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-2"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
        <div class="text-4xl mb-3">👻</div>
        <p class="text-zinc-900 dark:text-white font-medium">검색 결과가 없습니다</p>
      </div>

      <!-- Table Content -->
      <table v-else class="w-full">
        <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">사용자</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">이메일</th>
            <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">등급</th>
            <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">활동</th>
            <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">가입일</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            @click="openUserDrawer(user)"
            class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <!-- User -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-lime-400 to-lime-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                  {{ getUserInitial(user.username) }}
                </div>
                <span class="font-medium text-sm text-zinc-900 dark:text-white">{{ user.username }}</span>
              </div>
            </td>

            <!-- Email -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
              {{ user.email }}
            </td>

            <!-- Tier Select -->
            <td class="px-6 py-4 whitespace-nowrap text-center" @click.stop>
              <select
                v-model="user.subscription_tier"
                @change="updateSubscriptionTier(user)"
                class="text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer focus:ring-2 focus:ring-lime-500"
                :class="{
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': user.subscription_tier === 'admin',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': user.subscription_tier === 'premium',
                  'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400': user.subscription_tier === 'free'
                }"
              >
                <option value="admin">관리자</option>
                <option value="premium">프리미엄</option>
                <option value="free">무료</option>
              </select>
            </td>

            <!-- Activity -->
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-500">
              {{ formatLastActive(user.last_active_at) }}
            </td>

             <!-- Joined -->
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-500">
              {{ formatDate(user.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- User Detail Drawer -->
    <UserDetailDrawer 
      :show="showDrawer" 
      :user="selectedUser" 
      @close="showDrawer = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Users, Shield } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import UserDetailDrawer from '~/components/admin/UserDetailDrawer.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const loading = ref(true)
const allUsers = ref<any[]>([])
const showDrawer = ref(false)
const selectedUser = ref<any>(null)

const openUserDrawer = (user: any) => {
  selectedUser.value = user
  showDrawer.value = true
}

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
    // 서버 API를 통해 모든 사용자 조회 (RLS 우회)
    const { users } = await $fetch('/api/admin/users/list')

    allUsers.value = users || []

    console.log('[Admin] Total users:', allUsers.value.length)
  } catch (error: any) {
    console.error('[Admin] Fetch error:', error)
    toast.error('사용자 목록을 불러오는 데 실패했습니다')
  } finally {
    loading.value = false
  }
}

const updateSubscriptionTier = async (user: any) => {
  try {
    await $fetch('/api/admin/users/update-tier', {
      method: 'POST',
      body: {
        userId: user.id,
        tier: user.subscription_tier
      }
    })

    toast.success(`${user.username}님의 구독 등급이 ${getTierLabel(user.subscription_tier)}(으)로 변경되었습니다`)
  } catch (error: any) {
    console.error('[Admin] Update tier error:', error)
    toast.error('구독 등급 변경에 실패했습니다')
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
