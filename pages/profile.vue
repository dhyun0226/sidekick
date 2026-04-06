<template>
  <!-- Desktop View -->
  <template v-if="isDesktop && userStore.profile">
    <DesktopProfileView
      :profile="userStore.profile"
      :stats="stats"
      :active-tab="activeTab"
      @tab-change="(t) => t === 'insight' ? handleInsightTabClick() : activeTab = t"
    >
      <!-- 좌측 패널 하단: 탭별 추가 정보 -->
      <template #panel>
        <!-- 분석 탭: 목표/스트릭/이달 -->
        <DesktopInsightSidePanel
          v-if="activeTab === 'insight'"
          :this-year-books="thisYearBooks"
          :yearly-goal="yearlyGoal"
          :days-left-in-year="daysLeftInYear"
          :books-needed-per-month="booksNeededPerMonth"
          :on-track="onTrack"
          :is-goal-achieved="isGoalAchieved"
          :current-streak="stats.streak"
          :longest-streak="longestStreak"
          :this-month-books="thisMonthBooks"
          :this-month-comments="thisMonthComments"
          :editing-goal="editingGoal"
          :temp-goal="tempGoal"
          @start-edit-goal="startEditGoal"
          @save-goal="saveGoal"
          @cancel-edit-goal="cancelEditGoal"
          @update:temp-goal="tempGoal = $event"
        />
        <!-- 기록 탭: 월별 요약 -->
        <DesktopTimelineSidePanel v-if="activeTab === 'timeline'" :timeline="timeline" :monthly-totals="monthlyTotals" :visible-month="visibleMonth" />
      </template>

      <!-- 우측 콘텐츠 -->
      <div class="p-6 h-full">
        <!-- 서재 -->
        <ProfileLibraryTab v-if="activeTab === 'library'" :library="library" :reading-books="readingBooks" :library-groups="libraryByYear" :loading="loading" :desktop-wide="true" @open-book="openBookDetail" />
        <!-- 위시 -->
        <ProfileWishlistTab v-if="activeTab === 'wishlist'" :wishlist="wishlist" :loading="wishlistLoading" :desktop-wide="true" @refresh="fetchWishlistData" @start-book="handleStartBookFromWishlist" />
        <!-- 기록: 1열 (사이드 요약은 좌측 패널로 이동) -->
        <ProfileTimelineTab v-if="activeTab === 'timeline'" :timeline="timeline" :loading="loading" :is-loading-more="isLoadingMoreTimeline" :has-more="hasMoreTimeline" :monthly-totals="monthlyTotals" :is-book-finished="isBookFinished" @load-more="loadMoreTimeline" @navigate="navigateToItem" @visible-month-change="visibleMonth = $event" />
        <!-- 그룹 -->
        <ProfileGroupsTab v-if="activeTab === 'groups'" @refresh-stats="fetchData" @refresh-library="fetchData" />
        <!-- 분석: 캘린더 + 우측 날짜 상세 -->
        <div v-if="activeTab === 'insight'" class="h-full flex gap-6">
          <div class="min-w-[600px] flex-shrink-0 h-full">
            <ReadingHeatmap
              :activities="fullActivities"
              :currentStreak="stats.streak"
              :longestStreak="longestStreak"
              :finishedBooks="finishedLibraryForStats"
              :include-comments="appSettings.calendar_include_comments"
              :compact-year="true"
              :hide-footer-stats="true"
              :fixed-height="true"
              @day-click="isDesktop ? handleDesktopDayClick($event) : handleDayClick($event)"
              @year-change="handleYearChange"
            />
          </div>
          <!-- 데스크탑: 날짜 클릭 시 우측에 활동 표시 -->
          <!-- 날짜 미선택: 안내 -->
          <div v-if="!selectedDay" class="flex-1 min-w-0 h-full flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CalendarDays :size="28" class="text-zinc-300 dark:text-zinc-600" />
              </div>
              <p class="text-sm font-medium text-zinc-400 dark:text-zinc-500">날짜를 선택하면</p>
              <p class="text-sm font-medium text-zinc-400 dark:text-zinc-500">기록을 확인할 수 있어요</p>
            </div>
          </div>
          <!-- 날짜 선택됨: 활동 표시 -->
          <div v-else class="flex-1 min-w-0 overflow-y-auto h-full">
            <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden h-full flex flex-col">
              <div class="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 class="text-sm font-bold text-zinc-900 dark:text-white">{{ selectedDay.dateString }}</h3>
                  <p class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ selectedDay.count }}개의 활동</p>
                </div>
                <button @click="selectedDay = null" class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <X :size="16" class="text-zinc-400" />
                </button>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <div
                  v-for="item in selectedDay.activities"
                  :key="item.id"
                  @click="isBookFinished(item.groupBookId) ? navigateToItem(item) : null"
                  class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 transition-all"
                  :class="[isBookFinished(item.groupBookId) ? 'cursor-pointer hover:ring-1 hover:ring-lime-400' : 'opacity-60']"
                >
                  <div class="flex items-start gap-3 mb-3">
                    <div class="w-8 h-11 bg-zinc-200 dark:bg-zinc-700 overflow-hidden rounded flex-shrink-0">
                      <img v-if="item.bookCover" :src="item.bookCover" class="w-full h-full object-cover" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="text-sm font-semibold text-zinc-900 dark:text-white truncate">{{ item.bookTitle }}</h4>
                      <p class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ item.groupName }}</p>
                    </div>
                    <RatingBadge v-if="item.type === 'review'" :rating="item.rating" size="sm" />
                    <span v-else class="text-[10px] px-2 py-0.5 bg-lime-400/10 text-lime-600 dark:text-lime-400 rounded-full">{{ Math.round(item.position_pct) }}%</span>
                  </div>
                  <div v-if="item.anchor_text" class="pl-3 border-l-2 border-lime-400/50 mb-2">
                    <p class="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{{ item.anchor_text }}</p>
                  </div>
                  <p class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">{{ item.content }}</p>
                </div>
                <div v-if="selectedDay.count === 0" class="text-center py-8">
                  <p class="text-xs text-zinc-400">활동이 없습니다</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopProfileView>
  </template>

  <div v-else class="min-h-screen bg-gray-50 dark:bg-[#09090b] pb-20 pb-safe">
    <!-- Auth Guard: 프로필이 없으면 로딩 표시 -->
    <div v-if="!userStore.profile" class="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>

    <template v-else>
    <!-- 1. Common UI Section -->
    <ProfileHeader
      :profile="userStore.profile"
      @open-settings="openSettings"
    />
    <ProfileStats 
      :stats="stats" 
      @tab-change="(tabName) => activeTab = tabName" 
    />
    <ProfileSubscriptionBanner 
      :is-premium="isPremium" 
      :subscription-details="subscriptionDetails" 
    />

    <!-- 2. Sticky Tab Navigation -->
    <div class="sticky top-0 z-30 bg-gray-50/95 dark:bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div class="flex px-4">
        <button
          v-for="t in (['library', 'wishlist', 'timeline', 'groups', 'insight'] as const)"
          :key="t"
          @click="t === 'insight' ? handleInsightTabClick() : activeTab = t"
          class="flex-1 py-3 text-sm font-semibold transition-colors relative text-center"
          :class="activeTab === t ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'"
        >
          {{ t === 'library' ? '서재' : t === 'wishlist' ? '위시' : t === 'timeline' ? '기록' : t === 'insight' ? '분석' : '그룹' }}
          <div v-if="activeTab === t" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
        </button>
      </div>
    </div>

    <!-- 3. Dynamic Tab Content Section -->
    <div class="px-4 pt-3 min-h-[300px]">
      <ProfileLibraryTab
        v-if="activeTab === 'library'"
        :library="library"
        :reading-books="readingBooks"
        :library-groups="libraryByYear"
        :loading="loading"
        @open-book="openBookDetail"
      />

      <ProfileWishlistTab
        v-if="activeTab === 'wishlist'"
        :wishlist="wishlist"
        :loading="wishlistLoading"
        @refresh="fetchWishlistData"
        @start-book="handleStartBookFromWishlist"
      />

      <ProfileTimelineTab
        v-if="activeTab === 'timeline'"
        :timeline="timeline"
        :loading="loading"
        :is-loading-more="isLoadingMoreTimeline"
        :has-more="hasMoreTimeline"
        :monthly-totals="monthlyTotals"
        :is-book-finished="isBookFinished"
        @load-more="loadMoreTimeline"
        @navigate="navigateToItem"
      />

      <ProfileInsightTab
        v-if="activeTab === 'insight'"
        :timeline="fullActivities"
        :is-goal-achieved="isGoalAchieved"
        :last-year-books="lastYearBooks"
        :year-over-year-growth="yearOverYearGrowth"
        :editing-goal="editingGoal"
        v-model:temp-goal="tempGoal"
        :this-year-books="thisYearBooks"
        :yearly-goal="yearlyGoal"
        :days-left-in-year="daysLeftInYear"
        :books-needed-per-month="booksNeededPerMonth"
        :on-track="onTrack"
        :monthly-progress="monthlyProgress"
        :max-monthly-count="maxMonthlyCount"
        :current-streak="stats.streak"
        :longest-streak="longestStreak"
        :this-month-books="thisMonthBooks"
        :this-month-comments="thisMonthComments"
        :finishedBooks="finishedLibraryForStats"
        :include-comments="appSettings.calendar_include_comments"
        @start-edit-goal="startEditGoal"
        @save-goal="saveGoal"
        @cancel-edit-goal="cancelEditGoal"
        @day-click="handleDayClick"
        @year-change="handleYearChange"
      />

      <ProfileGroupsTab
        v-if="activeTab === 'groups'"
        @refresh-stats="fetchData"
        @refresh-library="fetchData"
      />
    </div>

    </template>
  </div>

  <!-- Shared Modals (desktop/mobile 공통) -->
  <ProfileSettingsModal
    v-if="settingsModalOpen"
    :is-open="settingsModalOpen"
    :profile="userStore.profile"
    :notification-settings="notificationSettings"
    :app-settings="appSettings"
    :is-saving="isSaving"
    @close="settingsModalOpen = false"
    @handle-file="handleFileChange"
    @save-profile="saveProfile"
    @sign-out="handleSignOut"
    @delete-account="handleDeleteAccount"
    @toggle-theme="toggleTheme"
    @open-inquiry="inquiryModalOpen = true"
  />

  <InquiryModal
    :is-open="inquiryModalOpen"
    @close="inquiryModalOpen = false"
  />

  <ProfileBookDetailModal
    :isOpen="showBookDetailModal"
    :book="selectedBook"
    @close="closeBookDetail"
    @navigate="navigateToItem"
  />

  <ProfileDayActivityModal
    v-if="showDayActivityModal"
    :is-open="showDayActivityModal"
    :selected-day="selectedDay"
    :is-book-finished="isBookFinished"
    @close="closeDayActivity"
    @navigate="navigateToItem"
  />

  <ConfirmModal
    :isOpen="showLogoutConfirm"
    title="로그아웃"
    message="정말 로그아웃 하시겠습니까?"
    description="다시 로그인하려면 구글 계정으로 로그인해야 합니다."
    confirmText="로그아웃"
    cancelText="취소"
    variant="warning"
    @confirm="confirmLogout"
    @cancel="showLogoutConfirm = false"
  />

  <ConfirmModal
    :isOpen="showDeleteAccountConfirm"
    title="계정 삭제"
    message="정말 계정을 삭제하시겠습니까?"
    description="모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다."
    confirmText="삭제하기"
    cancelText="취소"
    variant="danger"
    @confirm="confirmDeleteAccount"
    @cancel="showDeleteAccountConfirm = false"
  />

  <UpgradePromptModal
    :isOpen="upgradeInsightOpen"
    feature="insights"
    @close="upgradeInsightOpen = false"
  />

  <BookSearchModal
    :isOpen="bookSearchModalOpen"
    :initialBook="initialBookForModal"
    @close="bookSearchModalOpen = false; initialBookForModal = null"
    @confirm="handleBookConfirmFromWishlist"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch, nextTick, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { Lock, X, CalendarDays } from 'lucide-vue-next'
import RatingBadge from '~/components/RatingBadge.vue'

const DesktopProfileView = defineAsyncComponent(() => import('~/components/desktop/profile/DesktopProfileView.vue'))
const DesktopTimelineSidePanel = defineAsyncComponent(() => import('~/components/desktop/profile/DesktopTimelineSidePanel.vue'))
const DesktopGroupSidePanel = defineAsyncComponent(() => import('~/components/desktop/profile/DesktopGroupSidePanel.vue'))
const DesktopInsightSidePanel = defineAsyncComponent(() => import('~/components/desktop/profile/DesktopInsightSidePanel.vue'))
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'
const { isDesktop } = useDevice()

useHead({ title: '프로필' })

import ProfileHeader from '~/components/profile/ProfileHeader.vue'
import ProfileStats from '~/components/profile/ProfileStats.vue'
import ProfileSubscriptionBanner from '~/components/profile/ProfileSubscriptionBanner.vue'
import ProfileLibraryTab from '~/components/profile/ProfileLibraryTab.vue'
import ProfileTimelineTab from '~/components/profile/ProfileTimelineTab.vue'
import ProfileInsightTab from '~/components/profile/ProfileInsightTab.vue'
import ProfileGroupsTab from '~/components/profile/ProfileGroupsTab.vue'
import ProfileWishlistTab from '~/components/profile/ProfileWishlistTab.vue'
import ProfileSettingsModal from '~/components/profile/ProfileSettingsModal.vue'
import ProfileDayActivityModal from '~/components/profile/ProfileDayActivityModal.vue'
import ProfileBookDetailModal from '~/components/ProfileBookDetailModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import UpgradePromptModal from '~/components/UpgradePromptModal.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'

// 인증 미들웨어 적용
definePageMeta({ middleware: ['auth'] })

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { toggleTheme } = useTheme()
const { isPremium, subscription: subscriptionDetails, fetchLimits, fetchSubscription, limits } = useSubscription()
const { wishlist, loading: wishlistLoading, fetchWishlist } = useWishlist()

// Core State
const activeTab = ref<'timeline' | 'library' | 'insight' | 'groups' | 'wishlist'>('library')
const loading = ref(true)
const timeline = ref<any[]>([])
const library = ref<any[]>([])
const selectedGroupForPanel = ref<any>(null)
const visibleMonth = ref('')

// 분석 탭: 2달 나란히 표시 (연동)
const calPrimaryMonth = ref(new Date().getMonth())
const calPrimaryYear = ref(new Date().getFullYear())
const calSecondaryMonth = computed(() => {
  const d = new Date(calPrimaryYear.value, calPrimaryMonth.value - 1, 1)
  return d.getMonth()
})
const calSecondaryYear = computed(() => {
  const d = new Date(calPrimaryYear.value, calPrimaryMonth.value - 1, 1)
  return d.getFullYear()
})
const handleCalNavigate = (payload: { month: number; year: number }) => {
  calPrimaryMonth.value = payload.month
  calPrimaryYear.value = payload.year
}
const stats = ref({ books: 0, wish: 0, comments: 0, streak: 0, groups: 0 })
const longestStreak = ref(0)

// Pagination & Totals
const timelineOffset = ref(0)
const hasMoreTimeline = ref(true)
const isLoadingMoreTimeline = ref(false)
const TIMELINE_PAGE_SIZE = 20
const monthlyTotals = ref<Record<string, number>>({})
const fullActivities = ref<any[]>([]) // 🎯 히트맵용 전체 데이터

// Modals UI State
const settingsModalOpen = ref(false)
const inquiryModalOpen = ref(false)
const showBookDetailModal = ref(false)
const selectedBook = ref<any>(null)
const showDayActivityModal = ref(false)
const selectedDay = ref<any>(null)
const showLogoutConfirm = ref(false)
const showDeleteAccountConfirm = ref(false)
const upgradeInsightOpen = ref(false)
const bookSearchModalOpen = ref(false)
const initialBookForModal = ref<any>(null)

// Data State
const notificationSettings = ref({ comment_reply: true, reaction: true, member_join: true, completion: true, book_added: true, group_archived: true })
const appSettings = ref({ library_view_mode: 'year', calendar_include_comments: true })
const yearlyGoal = ref(50), editingGoal = ref(false), tempGoal = ref(50)
const isSaving = ref(false)

// Computed Properties
// hidden 책은 서재에서 숨김, isBookDeleted는 표시하되 UI에서 다르게 처리
// 읽고 있는 책: 완독 안 한 책 (중단된 책 포함)
const readingBooks = computed(() => library.value.filter(book => !book.finished_at && !book.hidden))
// 완독한 책만
const finishedLibrary = computed(() => library.value.filter(book => book.finished_at && !book.hidden))
// 통계용: 삭제된 책 제외
const finishedLibraryForStats = computed(() => library.value.filter(book => book.finished_at && !book.hidden && !book.isBookDeleted))
const libraryByYear = computed(() => {
  const grouped: Record<string, any[]> = {}
  finishedLibrary.value.forEach(book => {
    if (!book.finished_at) return

    const d = new Date(book.finished_at)
    // Group by Year or Month based on settings
    const key = appSettings.value.library_view_mode === 'year'
      ? `${d.getFullYear()}`
      : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`

    if (!grouped[key]) grouped[key] = []
    grouped[key].push(book)
  })
  // Sort keys descending
  return Object.entries(grouped).map(([label, books]) => ({ label, books })).sort((a, b) => b.label.localeCompare(a.label))
})

const thisMonthBooks = computed(() => {
  const now = new Date()
  return library.value.filter(b => b.finished_at && !b.isBookDeleted && new Date(b.finished_at).getMonth() === now.getMonth() && new Date(b.finished_at).getFullYear() === now.getFullYear()).length
})

const thisMonthComments = computed(() => {
  const now = new Date()
  const key = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`
  return monthlyTotals.value[key] || 0
})

const thisYearBooks = computed(() => {
  const now = new Date()
  return library.value.filter(b => b.finished_at && !b.isBookDeleted && new Date(b.finished_at).getFullYear() === now.getFullYear()).length
})

const daysLeftInYear = computed(() => Math.ceil((new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).getTime() - new Date().getTime()) / 86400000))
const monthsLeftInYear = computed(() => 12 - new Date().getMonth())
const booksNeededPerMonth = computed(() => {
  const remainingBooks = yearlyGoal.value - thisYearBooks.value
  if (remainingBooks <= 0) return 0
  if (daysLeftInYear.value <= 0) return remainingBooks // 남은 기간이 없으면 남은 권수 그대로 표시
  
  // 남은 일수를 평균 월일수(30.44)로 나누어 '남은 개월 수(소수점 포함)'를 구함
  const monthsRemainingExact = daysLeftInYear.value / 30.44
  return (remainingBooks / monthsRemainingExact).toFixed(1)
})
const onTrack = computed(() => thisYearBooks.value >= (yearlyGoal.value / 12) * (new Date().getMonth() + 1))
const isGoalAchieved = computed(() => thisYearBooks.value >= yearlyGoal.value)

const monthlyProgress = computed(() => {
  const cy = new Date().getFullYear(), ms = []
  for (let m = 0; m < 12; m++) {
    const count = library.value.filter(b => b.finished_at && new Date(b.finished_at).getFullYear() === cy && new Date(b.finished_at).getMonth() === m).length
    ms.push({ month: m + 1, count })
  }
  return ms
})
const maxMonthlyCount = computed(() => Math.max(...monthlyProgress.value.map(m => m.count), 1))

const lastYearBooks = computed(() => {
  const now = new Date(), ly = now.getFullYear() - 1, cdoy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  return library.value.filter(b => {
    if (!b.finished_at) return false
    const d = new Date(b.finished_at)
    return d.getFullYear() === ly && Math.floor((d.getTime() - new Date(ly, 0, 0).getTime()) / 86400000) <= cdoy
  }).length
})
const yearOverYearGrowth = computed(() => lastYearBooks.value === 0 ? (thisYearBooks.value > 0 ? 100 : 0) : Math.round(((thisYearBooks.value - lastYearBooks.value) / lastYearBooks.value) * 100))

// Data Fetching
const loadedYears = ref(new Set<number>())
const isFetchingInsight = ref(false)

const fetchData = async () => {
  const userId = userStore.profile?.id
  if (!userId) { loading.value = false; return }
  loading.value = true
  timeline.value = []; timelineOffset.value = 0; hasMoreTimeline.value = true

  try {
    const data = await $fetch('/api/pages/profile')

    library.value = data.library
    stats.value = data.stats
    yearlyGoal.value = data.yearlyGoal
    longestStreak.value = data.longestStreak
    monthlyTotals.value = data.monthlyTotals
    fullActivities.value = data.lightweightActivities

    await loadMoreTimeline()
  } catch (err) { console.error(err) } finally { loading.value = false }
}

const fetchInsightData = async (year: number) => {
  if (loadedYears.value.has(year) || isFetchingInsight.value) return
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return

  isFetchingInsight.value = true
  try {
    const startOfYear = new Date(year, 0, 1).toISOString()
    const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString()

    // 🎯 해당 연도의 상세 활동 데이터 가져오기 (모달 표시용 필드 포함)
    const [ { data: yearC }, { data: yearR } ] = await Promise.all([
      client.from('comments').select(`
        id, content, anchor_text, position_pct, created_at, parent_id, 
        parent:parent_id (content, anchor_text, user:users (nickname, avatar_url)), 
        group_book:group_books (id, group:groups (name, id), book:books (title, cover_url))
      `)
        .eq('user_id', userId)
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear),
      client.from('reviews').select(`
        id, content, rating, created_at, group_book_id, 
        group_book:group_books (id, group:groups (name, id), book:books (title, cover_url))
      `)
        .eq('user_id', userId)
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear)
    ])

    const processedYear = [
      ...(yearC || []).map((c: any) => {
        const p = Array.isArray(c.parent) ? c.parent[0] : c.parent
        const pu = p ? (Array.isArray(p.user) ? p.user[0] : p.user) : null
        const pd = p ? { nickname: pu?.nickname || '알 수 없는 사용자', avatar_url: pu?.avatar_url, content: p.content, anchor_text: p.anchor_text } : null
        return { 
          type: 'comment', 
          id: c.id, 
          created_at: c.created_at, 
          content: c.content, 
          anchor_text: c.anchor_text, 
          position_pct: c.position_pct, 
          isReply: !!c.parent_id, 
          parentData: pd, 
          groupId: c.group_book?.group?.id, 
          groupName: c.group_book?.group?.name, 
          bookTitle: c.group_book?.book?.title, 
          bookCover: c.group_book?.book?.cover_url, 
          groupBookId: c.group_book?.id,
          isLightweight: false 
        }
      }),
      ...(yearR || []).map((r: any) => ({ 
        type: 'review', 
        id: r.id, 
        created_at: r.created_at, 
        content: r.content, 
        rating: r.rating, 
        groupId: r.group_book?.group?.id, 
        groupName: r.group_book?.group?.name, 
        bookTitle: r.group_book?.book?.title, 
        bookCover: r.group_book?.book?.cover_url, 
        groupBookId: r.group_book?.id,
        isLightweight: false 
      }))
    ]
    
    // 기존 경량 데이터를 해당 연도의 상세 데이터로 교체
    const otherYearsData = fullActivities.value.filter(a => new Date(a.created_at).getFullYear() !== year)
    fullActivities.value = [...otherYearsData, ...processedYear]
    
    loadedYears.value.add(year)
  } catch (err) { console.error(err) } finally { isFetchingInsight.value = false }
}

const loadMoreTimeline = async () => {
  if (isLoadingMoreTimeline.value || !hasMoreTimeline.value) return
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return
  isLoadingMoreTimeline.value = true
  const from = timelineOffset.value, to = from + TIMELINE_PAGE_SIZE - 1
  try {
    // 현재 멤버십이 있는 그룹의 group_book ID만 필터링
    const { data: memberGroups } = await client
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
    const memberGroupIds = (memberGroups || []).map((m: any) => m.group_id)

    if (memberGroupIds.length === 0) {
      hasMoreTimeline.value = false
      isLoadingMoreTimeline.value = false
      return
    }

    const [ { data: cd }, { data: rd } ] = await Promise.all([
      client.from('comments').select(`id, content, anchor_text, position_pct, created_at, parent_id, parent:parent_id (content, anchor_text, user:users (nickname, avatar_url)), group_book:group_books!inner (id, group:groups (name, id), book:books (title, cover_url, isbn))`).eq('user_id', userId).in('group_book.group_id', memberGroupIds).order('created_at', { ascending: false }).range(from, to),
      client.from('reviews').select(`id, content, rating, created_at, group_book_id, group_book:group_books!inner (id, group:groups (name, id), book:books (title, cover_url, isbn))`).eq('user_id', userId).in('group_book.group_id', memberGroupIds).order('created_at', { ascending: false }).range(from, to)
    ])
    const nc = (cd || []).map((c: any) => {
      const p = Array.isArray(c.parent) ? c.parent[0] : c.parent, pu = p ? (Array.isArray(p.user) ? p.user[0] : p.user) : null
      const pd = p ? { nickname: pu?.nickname || '알 수 없는 사용자', avatar_url: pu?.avatar_url, content: p.content, anchor_text: p.anchor_text } : null
      return { type: 'comment', id: c.id, created_at: c.created_at, content: c.content, anchor_text: c.anchor_text, position_pct: c.position_pct, isReply: !!c.parent_id, parentData: pd, groupId: c.group_book?.group?.id, groupName: c.group_book?.group?.name, bookTitle: c.group_book?.book?.title, bookCover: c.group_book?.book?.cover_url, groupBookId: c.group_book?.id }
    })
    const nr = (rd || []).map((r: any) => ({ type: 'review', id: r.id, created_at: r.created_at, content: r.content, rating: r.rating, groupId: r.group_book?.group?.id, groupName: r.group_book?.group?.name, bookTitle: r.group_book?.book?.title, bookCover: r.group_book?.book?.cover_url, groupBookId: r.group_book?.id }))
    const combined = [...nc, ...nr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (combined.length === 0) hasMoreTimeline.value = false
    else {
      timeline.value = [...timeline.value, ...combined]
      timelineOffset.value += TIMELINE_PAGE_SIZE
    }
  } catch (err) { console.error(err) } finally { isLoadingMoreTimeline.value = false }
}

// Event Handlers
const openBookDetail = (book: any) => { selectedBook.value = book; showBookDetailModal.value = true }
const closeBookDetail = () => { showBookDetailModal.value = false; selectedBook.value = null }
const openSettings = () => settingsModalOpen.value = true
const handleDayClick = (day: any) => { selectedDay.value = day; showDayActivityModal.value = true }
const handleDesktopDayClick = (day: any) => { selectedDay.value = selectedDay.value?.dateString === day.dateString ? null : day }
const closeDayActivity = () => { showDayActivityModal.value = false; selectedDay.value = null }
const startEditGoal = () => { tempGoal.value = yearlyGoal.value; editingGoal.value = true }
const cancelEditGoal = () => editingGoal.value = false
const handleInsightTabClick = () => {
  activeTab.value = 'insight'
  fetchInsightData(new Date().getFullYear())
}
const handleYearChange = (year: number) => fetchInsightData(year)
const isBookFinished = (id: string) => library.value.find(b => b.groupBookId === id)?.finished_at != null

const navigateToItem = (item: any) => {
  if (item.groupId) {
    const q: any = {}
    if (item.groupBookId) q.bookId = item.groupBookId
    if (item.type === 'comment') { q.jumpTo = item.position_pct; q.highlightComment = item.id }
    const path = item.groupType === 'solo' ? '/my-library' : `/group/${item.groupId}`
    router.push({ path, query: q })
  } else toast.warning('해당 그룹을 찾을 수 없습니다.')
}

const saveGoal = async () => {
  if (tempGoal.value <= 0) { toast.error('목표는 1권 이상이어야 합니다'); return }
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) { toast.error('사용자 정보를 찾을 수 없습니다'); return }
  
  try {
    const { error } = await client.from('users').update({ yearly_reading_goal: tempGoal.value }).eq('id', userId)
    if (error) throw error
    yearlyGoal.value = tempGoal.value; editingGoal.value = false; toast.success('목표가 저장되었습니다')
  } catch (err) { toast.error('목표 저장에 실패했습니다') }
}

const handleFileChange = async (file: File) => {
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) { toast.error('사용자 정보를 찾을 수 없습니다'); return }

  isSaving.value = true
  try {
    const ext = file.name.split('.').pop(), path = `${userId}/${Date.now()}.${ext}`
    const { error: ue } = await client.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (ue) throw ue
    const { data: { publicUrl: url } } = client.storage.from('avatars').getPublicUrl(path)
    const { error: de } = await client.from('users').update({ avatar_url: url }).eq('id', userId)
    if (de) throw de
    await userStore.fetchProfile(true); toast.success('프로필 사진이 변경되었습니다')
  } catch (err) { toast.error('사진 업로드에 실패했습니다') } finally { isSaving.value = false }
}

const saveProfile = async (nickname: string) => {
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) { toast.error('사용자 정보를 찾을 수 없습니다'); return }

  isSaving.value = true
  try {
    const { error } = await client.from('users').update({ nickname: nickname.trim() }).eq('id', userId)
    if (error) throw error
    await userStore.fetchProfile(true); toast.success('닉네임이 변경되었습니다'); settingsModalOpen.value = false
  } catch (err) { toast.error('저장에 실패했습니다') } finally { isSaving.value = false }
}

const handleSignOut = () => showLogoutConfirm.value = true
const confirmLogout = async () => { showLogoutConfirm.value = false; await userStore.signOut(); router.push('/login') }
const handleDeleteAccount = () => showDeleteAccountConfirm.value = true
const confirmDeleteAccount = async () => {
  try {
    const { error } = await client.from('users').delete().eq('id', userStore.user!.id)
    if (error) throw error
    await userStore.signOut(); toast.success('계정이 삭제되었습니다'); router.push('/login')
  } catch (err) { toast.error('계정 삭제에 실패했습니다') }
}

const fetchWishlistData = async () => {
  const userId = userStore.profile?.id
  if (userId) {
    await fetchWishlist(userId)
    stats.value.wish = wishlist.value.length
  }
}

const handleStartBookFromWishlist = (item: any) => {
  // 위시에서 책 선택 시 BookSearchModal을 열어서 바로 Step 2로 이동
  initialBookForModal.value = {
    isbn: item.isbn,
    title: item.book.title,
    author: item.book.author,
    publisher: item.book.publisher,
    cover: item.book.cover_url
  }
  bookSearchModalOpen.value = true
}

const handleBookConfirmFromWishlist = async (bookData: any) => {
  try {
    // 솔로 그룹 찾기
    const { data: memberData } = await client
      .from('group_members')
      .select('group_id, groups!inner(id, group_type, deleted_at)')
      .eq('user_id', userStore.profile?.id)
      .is('groups.deleted_at', null)
      .eq('groups.group_type', 'solo')
      .single()

    if (!memberData) {
      toast.error('내 서재를 찾을 수 없습니다')
      return
    }

    const soloGroupId = memberData.group_id

    // 1. books 테이블에 책 정보 upsert
    await client.from('books').upsert({
      isbn: bookData.book.isbn,
      title: bookData.book.title,
      author: bookData.book.author,
      publisher: bookData.book.publisher,
      cover_url: bookData.book.cover,
      draft_pages: bookData.totalPages,
      draft_toc: bookData.toc,
      draft_genre: bookData.genre
    }, { onConflict: 'isbn' })

    // 2. group_books에 추가
    const { data: groupBook, error: gbError } = await client.from('group_books').insert({
      group_id: soloGroupId,
      isbn: bookData.book.isbn,
      pages_snapshot: bookData.totalPages,
      toc_snapshot: bookData.toc,
      genre_snapshot: bookData.genre,
      target_start_date: bookData.startDate,
      target_end_date: bookData.endDate
    }).select().single()

    if (gbError) throw gbError

    // 3. reading progress 초기화
    await client.from('user_reading_progress').insert({
      user_id: userStore.profile?.id,
      group_book_id: groupBook.id,
      progress_pct: 0
    })

    toast.success('책이 내 서재에 추가되었습니다')
    bookSearchModalOpen.value = false
    initialBookForModal.value = null
    router.push('/my-library')
  } catch (err) {
    console.error('Failed to add book:', err)
    toast.error('책 추가에 실패했습니다')
  }
}

const formatDate = (d: string) => {
  const date = new Date(d)
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
}

onMounted(async () => {
  await Promise.all([userStore.fetchProfile(), fetchSubscription(), fetchLimits()])

  // Auth guard: 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!userStore.profile) {
    navigateTo('/login')
    return
  }

  if (userStore.profile?.notification_settings) {
    // 🎯 기존 설정과 DB 설정을 병합 (새로 추가된 항목 누락 방지)
    notificationSettings.value = { ...notificationSettings.value, ...userStore.profile.notification_settings }
  }
  if (userStore.profile?.app_settings) {
    appSettings.value = { ...appSettings.value, ...userStore.profile.app_settings }
  }
  await Promise.all([fetchData(), fetchWishlistData()])
  settingsReady.value = true
})

onActivated(async () => {
  if (!userStore.profile) await userStore.fetchProfile()
  await fetchData()
})

const settingsReady = ref(false)

watch(notificationSettings, async (s) => {
  if (!settingsReady.value) return
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return
  try { await client.from('users').update({ notification_settings: s }).eq('id', userId); await userStore.fetchProfile(true) }
  catch (err) { console.error(err) }
}, { deep: true })

watch(appSettings, async (s) => {
  if (!settingsReady.value) return
  const userId = userStore.profile?.id || userStore.user?.id
  if (!userId) return
  try {
    const { error } = await client.from('users').update({ app_settings: s }).eq('id', userId)
    if (error) {
      toast.error('설정 저장에 실패했습니다')
    }
  } catch (err) { console.error(err) }
}, { deep: true })
</script>

