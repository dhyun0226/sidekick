<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <!-- Header -->
    <div class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div class="px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <ArrowLeft :size="20" />
            </NuxtLink>
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white">관리자 대시보드</h1>
          </div>
          <div class="flex items-center gap-2 text-xs text-zinc-500">
            <Shield :size="14" class="text-lime-500" />
            <span>슈퍼 관리자</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Pending TOC -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-lime-100 dark:bg-lime-900/20 rounded-xl flex items-center justify-center">
              <FileText :size="24" class="text-lime-600 dark:text-lime-400" />
            </div>
            <span class="text-3xl font-bold text-lime-600 dark:text-lime-400">{{ stats.pendingToc }}</span>
          </div>
          <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">승인 대기 목차</h3>
          <p class="text-xs text-zinc-500">draft_toc → official_toc</p>
        </div>

        <!-- Total Books -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <BookOpen :size="24" class="text-blue-600 dark:text-blue-400" />
            </div>
            <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ stats.totalBooks }}</span>
          </div>
          <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">전체 도서</h3>
          <p class="text-xs text-zinc-500">books 테이블 등록 수</p>
        </div>

        <!-- Total Users -->
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <Users :size="24" class="text-purple-600 dark:text-purple-400" />
            </div>
            <span class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ stats.totalUsers }}</span>
          </div>
          <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">전체 사용자</h3>
          <p class="text-xs text-zinc-500">가입 사용자 수</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">빠른 작업</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            to="/admin/books"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-lime-400 dark:hover:border-lime-600 hover:shadow-lg transition-all group"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-lime-100 dark:bg-lime-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText :size="24" class="text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <h3 class="font-bold text-zinc-900 dark:text-white mb-1">목차 승인</h3>
                <p class="text-xs text-zinc-500">{{ stats.pendingToc }}개 대기 중</p>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/admin/subscriptions"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-lg transition-all group"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-400"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div>
                <h3 class="font-bold text-zinc-900 dark:text-white mb-1">구독 & 결제</h3>
                <p class="text-xs text-zinc-500">구독 및 결제 내역</p>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/admin/groups"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users :size="24" class="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 class="font-bold text-zinc-900 dark:text-white mb-1">그룹 관리</h3>
                <p class="text-xs text-zinc-500">전체 그룹 조회 및 관리</p>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/admin/users"
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg transition-all group"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield :size="24" class="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 class="font-bold text-zinc-900 dark:text-white mb-1">사용자 관리</h3>
                <p class="text-xs text-zinc-500">권한 및 구독 관리</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">최근 등록된 책</h2>
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div v-if="loading" class="p-8 text-center">
            <div class="inline-block w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="recentBooks.length === 0" class="p-8 text-center text-sm text-zinc-500">
            등록된 책이 없습니다.
          </div>
          <div v-else class="divide-y divide-zinc-200 dark:divide-zinc-800">
            <div
              v-for="book in recentBooks"
              :key="book.isbn"
              class="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="book.cover_url"
                  :src="book.cover_url"
                  class="w-12 h-16 object-cover rounded shadow-sm"
                />
                <div class="w-12 h-16 bg-zinc-200 dark:bg-zinc-800 rounded" v-else></div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-sm text-zinc-900 dark:text-white truncate">{{ book.title }}</h3>
                  <p class="text-xs text-zinc-600 dark:text-zinc-400 truncate">{{ book.author }}</p>
                </div>
                <div class="text-xs text-zinc-500">
                  {{ formatDate(book.created_at) }}
                </div>
                <div v-if="book.draft_toc && !book.official_toc" class="text-xs bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 px-2 py-1 rounded">
                  승인 대기
                </div>
                <div v-else-if="book.official_toc" class="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                  승인 완료
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
import { ref, onMounted } from 'vue'
import { ArrowLeft, Shield, FileText, BookOpen, Users } from 'lucide-vue-next'

definePageMeta({
  middleware: 'admin'
})

const client = useSupabaseClient()

const loading = ref(true)
const stats = ref({
  pendingToc: 0,
  totalBooks: 0,
  totalUsers: 0
})
const recentBooks = ref<any[]>([])

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchRecentBooks()
  ])
})

const fetchStats = async () => {
  try {
    // Pending TOC
    const { count: pendingCount } = await client
      .from('books')
      .select('*', { count: 'exact', head: true })
      .not('draft_toc', 'is', null)

    // Total Books
    const { count: booksCount } = await client
      .from('books')
      .select('*', { count: 'exact', head: true })

    // Total Users
    const { count: usersCount } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })

    stats.value = {
      pendingToc: pendingCount || 0,
      totalBooks: booksCount || 0,
      totalUsers: usersCount || 0
    }
  } catch (error) {
    console.error('[Admin] Stats fetch error:', error)
  }
}

const fetchRecentBooks = async () => {
  loading.value = true

  try {
    const { data, error } = await client
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    recentBooks.value = data || []
  } catch (error: any) {
    console.error('[Admin] Recent books fetch error:', error)
    toast.error('최근 책 목록을 불러오는 데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
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

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>
