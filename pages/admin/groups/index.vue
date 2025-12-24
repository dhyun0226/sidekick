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
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white">그룹 관리</h1>
          </div>
          <div class="text-sm text-zinc-500">
            전체: <span class="font-bold">{{ allGroups.length }}</span>개 /
            활성: <span class="font-bold text-lime-500">{{ activeCount }}</span>개
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
            placeholder="그룹명, 소유자로 검색..."
            class="w-full pl-12 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="filterStatus = filter.value"
            class="px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap"
            :class="filterStatus === filter.value
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
      <div v-else-if="filteredGroups.length === 0" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center py-16">
        <div class="text-6xl mb-4">👥</div>
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          {{ searchQuery ? '검색 결과가 없습니다' : '등록된 그룹이 없습니다' }}
        </h3>
        <p class="text-sm text-zinc-500">
          {{ searchQuery ? '다른 검색어를 입력해보세요.' : '새로운 그룹이 생성되면 여기에 표시됩니다.' }}
        </p>
      </div>

      <!-- Groups Table -->
      <div v-else class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">그룹명</th>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">소유자</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">멤버 수</th>
              <th class="text-left px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">현재 읽는 책</th>
              <th class="text-center px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">생성일</th>
              <th class="text-right px-6 py-4 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">작업</th>
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
                  <div class="w-10 h-10 bg-lime-100 dark:bg-lime-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users :size="20" class="text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <p class="font-bold text-zinc-900 dark:text-white">{{ group.name }}</p>
                    <p class="text-xs text-zinc-500">{{ group.description || '설명 없음' }}</p>
                  </div>
                </div>
              </td>

              <!-- Owner -->
              <td class="px-6 py-4">
                <p class="text-sm text-zinc-700 dark:text-zinc-300">{{ group.owner?.username || '알 수 없음' }}</p>
                <p class="text-xs text-zinc-500">{{ group.owner?.email }}</p>
              </td>

              <!-- Member Count -->
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                  {{ group.member_count || 0 }}명
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
                  <span class="text-sm text-zinc-700 dark:text-zinc-300 truncate">{{ group.current_book.title }}</span>
                </div>
                <span v-else class="text-xs text-zinc-400">읽는 책 없음</span>
              </td>

              <!-- Created Date -->
              <td class="px-6 py-4 text-center">
                <span class="text-xs text-zinc-500">{{ formatDate(group.created_at) }}</span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    :to="`/group/${group.id}`"
                    target="_blank"
                    class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                    title="그룹 페이지 보기"
                  >
                    <ExternalLink :size="18" />
                  </NuxtLink>
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
import { ArrowLeft, Search, Users, ExternalLink } from 'lucide-vue-next'

definePageMeta({
  middleware: 'admin'
})

const client = useSupabaseClient()

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
    // Fetch groups with owner info and current reading book
    const { data: groupsData, error: groupsError } = await client
      .from('groups')
      .select(`
        *,
        owner:users!groups_owner_id_fkey(id, username, email),
        group_books!inner(
          id,
          status,
          book:books(isbn, title, cover_url)
        )
      `)
      .order('created_at', { ascending: false })

    if (groupsError) throw groupsError

    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      (groupsData || []).map(async (group: any) => {
        const { count } = await client
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)

        // Find current reading book
        const currentBook = group.group_books?.find((gb: any) => gb.status === 'reading')

        return {
          ...group,
          member_count: count || 0,
          current_book: currentBook?.book || null
        }
      })
    )

    allGroups.value = groupsWithCounts
    console.log('[Admin] Total groups:', allGroups.value.length)
  } catch (error: any) {
    console.error('[Admin] Fetch error:', error)
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
