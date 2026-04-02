<template>
  <div>
    <!-- Stats / Summary -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">전체 그룹</p>
          <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ allGroups.length }}</p>
        </div>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <Users :size="20" class="text-zinc-500" />
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-zinc-500">활성 그룹</p>
          <p class="text-2xl font-bold text-lime-600">{{ activeCount }}</p>
        </div>
        <div class="p-2 bg-lime-100 dark:bg-lime-900/20 rounded-lg">
          <Activity :size="20" class="text-lime-600" />
        </div>
      </div>
      <!-- Add more metrics if needed, e.g., Total Members across all groups -->
    </div>

    <!-- Toolbar -->
    <div class="bg-white dark:bg-zinc-900 rounded-t-xl border-x border-t border-zinc-200 dark:border-zinc-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <!-- Search -->
      <div class="relative w-full md:w-96">
        <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="그룹명, 소유자로 검색..."
          class="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none"
        />
      </div>

      <!-- Filters -->
      <div class="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="filterStatus = filter.value"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          :class="filterStatus === filter.value
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          "
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Groups Table -->
    <div class="bg-white dark:bg-zinc-900 rounded-b-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-2"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGroups.length === 0" class="text-center py-12">
        <Users :size="28" class="text-zinc-300 dark:text-zinc-500 mx-auto mb-3" />
        <p class="text-zinc-900 dark:text-white font-medium">검색 결과가 없습니다</p>
      </div>

      <div v-else class="max-h-[600px] overflow-y-auto">
        <table class="w-full">
          <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 z-10">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500">그룹명</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500">소유자</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500">멤버</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-zinc-500">현재 읽는 책</th>
              <th class="text-center px-6 py-3 text-xs font-medium text-zinc-500">생성일</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-zinc-500">작업</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
          <tr
            v-for="group in filteredGroups"
            :key="group.id"
            class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <!-- Group Name -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-lime-100 dark:bg-lime-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users :size="16" class="text-lime-600 dark:text-lime-400" />
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-sm text-zinc-900 dark:text-white truncate max-w-[200px]">{{ group.name }}</p>
                  <p class="text-xs text-zinc-500 truncate max-w-[200px]">{{ group.description || '설명 없음' }}</p>
                </div>
              </div>
            </td>

            <!-- Owner -->
            <td class="px-6 py-4 text-sm">
              <p class="text-zinc-900 dark:text-zinc-100">{{ group.owner?.username || '알 수 없음' }}</p>
              <p class="text-xs text-zinc-500">{{ group.owner?.email }}</p>
            </td>

            <!-- Member Count -->
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {{ group.member_count || 0 }}
              </span>
            </td>

            <!-- Current Book -->
            <td class="px-6 py-4">
              <div v-if="group.current_book" class="flex items-center gap-2">
                <img
                  v-if="group.current_book.cover_url"
                  :src="group.current_book.cover_url"
                  class="w-6 h-8 object-cover rounded shadow-sm"
                />
                <span class="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]" :title="group.current_book.title">{{ group.current_book.title }}</span>
              </div>
              <span v-else class="text-xs text-zinc-400">-</span>
            </td>

            <!-- Created Date -->
            <td class="px-6 py-4 text-center text-xs text-zinc-500">
              {{ formatDate(group.created_at) }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-right">
               <NuxtLink
                  :to="`/group/${group.id}`"
                  target="_blank"
                  class="inline-flex p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  title="그룹 페이지 보기"
                >
                  <ExternalLink :size="16" />
                </NuxtLink>
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
import { Search, Users, ExternalLink, Activity } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const client = useSupabaseClient()
const toast = useToastStore()

const loading = ref(true)
const allGroups = ref<any[]>([])

// Search & Filter
const searchQuery = ref('')
const filterStatus = ref<'all' | 'active'>('all')

// Computed
const activeCount = computed(() => {
  return allGroups.value.filter(g => g.current_book).length
})

const filters = computed(() => [
  { label: '전체', value: 'all' as const, count: allGroups.value.length },
  { label: '활성', value: 'active' as const, count: activeCount.value }
])

const filteredGroups = computed(() => {
  let groups = allGroups.value

  // Filter by status
  if (filterStatus.value === 'active') {
    groups = groups.filter(g => g.current_book)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    groups = groups.filter(g => {
      return (
        g.name?.toLowerCase().includes(query) ||
        g.owner?.username?.toLowerCase().includes(query) ||
        g.owner?.email?.toLowerCase().includes(query)
      )
    })
  }

  return groups
})

onMounted(async () => {
  await fetchAllGroups()
})

const fetchAllGroups = async () => {
  loading.value = true

  try {
    // 서버 API를 통해 모든 그룹 조회 (RLS 우회)
    const { groups } = await $fetch('/api/admin/groups/list')

    allGroups.value = groups || []
  } catch (error: any) {
    console.error('[Admin] Fetch error:', error)
    toast.error('그룹 목록을 불러오는 데 실패했습니다')
  } finally {
    loading.value = false
  }
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