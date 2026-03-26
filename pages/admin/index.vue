<template>
  <div>
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Pending TOC -->
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">승인 대기 목차</p>
            <h3 class="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{{ stats.pendingToc }}</h3>
          </div>
          <div class="w-12 h-12 bg-lime-100 dark:bg-lime-900/20 rounded-xl flex items-center justify-center">
            <FileText :size="24" class="text-lime-600 dark:text-lime-400" />
          </div>
        </div>
        <div class="flex items-center text-xs">
          <span class="text-lime-600 dark:text-lime-400 font-medium flex items-center gap-1">
            처리 필요
          </span>
          <span class="text-zinc-400 mx-2">•</span>
          <span class="text-zinc-500">임시 목차 → 공식 목차</span>
        </div>
      </div>

      <!-- Total Books -->
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">전체 도서</p>
            <h3 class="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{{ stats.totalBooks }}</h3>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <BookOpen :size="24" class="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div class="flex items-center text-xs">
          <span class="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
            등록됨
          </span>
          <span class="text-zinc-400 mx-2">•</span>
          <span class="text-zinc-500">등록된 전체 도서 수</span>
        </div>
      </div>

      <!-- Total Users -->
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">전체 사용자</p>
            <h3 class="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{{ stats.totalUsers }}</h3>
          </div>
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
            <Users :size="24" class="text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div class="flex items-center text-xs">
          <span class="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
            활동 중
          </span>
          <span class="text-zinc-400 mx-2">•</span>
          <span class="text-zinc-500">가입된 전체 회원 수</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Activity -->
      <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-fit">
        <div class="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 class="font-semibold text-zinc-900 dark:text-white">최근 등록된 책</h2>
          <NuxtLink to="/admin/books" class="text-sm text-lime-600 hover:text-lime-700 font-medium">전체 보기</NuxtLink>
        </div>
        
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
            class="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <div class="flex items-center gap-4">
              <div class="relative w-10 h-14 flex-shrink-0">
                <img
                  v-if="book.cover_url"
                  :src="book.cover_url"
                  class="w-full h-full object-cover rounded shadow-sm"
                />
                <div class="w-full h-full bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center" v-else>
                  <BookOpen :size="16" class="text-zinc-400" />
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-lime-600 transition-colors">{{ book.title }}</h3>
                <p class="text-xs text-zinc-500 truncate">{{ book.author }}</p>
              </div>
              
              <div class="text-right">
                <div class="text-xs text-zinc-500 mb-1">
                  {{ formatDate(book.created_at) }}
                </div>
                <div v-if="book.draft_toc && !book.official_toc" class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400">
                  승인 대기
                </div>
                <div v-else-if="book.official_toc" class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  승인 완료
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links / Guide (Optional Placeholder) -->
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 text-white">
          <h3 class="font-semibold text-lg mb-2">관리자 가이드</h3>
          <p class="text-zinc-400 text-sm mb-4">
            관리자 페이지에서는 도서 승인, 사용자 권한 관리, 그룹 모니터링을 수행할 수 있습니다.
            새로운 기능 요청이나 버그 제보는 GitHub 이슈를 이용해주세요.
          </p>
          <button class="text-sm bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-colors">
            매뉴얼 보기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FileText, BookOpen, Users } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
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
    const data = await $fetch('/api/admin/stats')
    stats.value = {
      pendingToc: data.pendingToc || 0,
      totalBooks: data.totalBooks || 0,
      totalUsers: data.totalUsers || 0
    }
  } catch (error) {
    console.error('[Admin] Stats fetch error:', error)
  }
}

const fetchRecentBooks = async () => {
  loading.value = true

  try {
    const { books } = await $fetch('/api/admin/books/list')
    recentBooks.value = (books || []).slice(0, 10)
  } catch (error: any) {
    console.error('[Admin] Recent books fetch error:', error)
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
