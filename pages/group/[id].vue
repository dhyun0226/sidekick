<template>
  <div 
    class="relative h-[100dvh] bg-gray-50 dark:bg-background overflow-y-auto overflow-x-hidden" 
    style="overscroll-behavior: none;"
    @scroll="handleContainerScroll"
  >
    <!-- 1. Fixed Navigation Bar (Always visible) -->
    <NavigationBar
      :title="bookTitle || groupName"
      :is-scrolled="isScrolled"
      @back="router.push('/')"
      @open-drawer="modals.drawer = true"
    />

    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="타임라인 불러오는 중..."/>
      </div>
    </template>

    <!-- Error State -->
    <template v-else-if="loadError">
      <div class="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle :size="32" class="text-red-500" />
        </div>
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">문제가 발생했습니다</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{{ loadError }}</p>
        <div class="flex gap-3">
          <button
            @click="fetchData"
            class="px-6 py-3 bg-lime-400 text-black font-bold rounded-xl hover:bg-lime-300 transition-all"
          >
            다시 시도
          </button>
          <button
            @click="router.push('/')"
            class="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
          >
            홈으로
          </button>
        </div>
      </div>
    </template>

    <!-- Loaded Content -->
    <template v-else>
      <!-- Read-Only Mode Banner (Free users in Social groups) -->
      <div v-if="isReadOnlyMode" class="bg-blue-500/10 dark:bg-blue-500/20 border-b border-blue-500/30 px-4 py-3 relative z-30">
        <div class="max-w-md mx-auto text-center space-y-2">
          <p class="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
            <Lock :size="16" /> 읽기 전용 모드
          </p>
          <p class="text-xs text-blue-600/80 dark:text-blue-400/80">
            무료 플랜에서는 그룹 내용을 확인만 할 수 있습니다. 참여하려면 프리미엄이 필요합니다.
          </p>
          <button
            @click="modals.upgradeReadOnly = true"
            class="w-full max-w-xs mx-auto py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 text-sm"
          >
            <Lock :size="16" />
            프리미엄으로 참여하기
          </button>
        </div>
      </div>

      <!-- Archived Notice Banner -->
      <div v-if="isArchived" class="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center relative z-30">
        <p class="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 uppercase tracking-tighter">
          <Archive :size="12" /> 이 그룹은 종료되었습니다. (과거의 기록만 열람 가능)
        </p>
      </div>

      <!-- Paused Notice Banner -->
      <div v-if="isPausedGroup && !isArchived" class="bg-orange-500/10 dark:bg-orange-500/20 border-b border-orange-500/30 px-4 py-3 relative z-30">
        <div class="max-w-md mx-auto text-center space-y-3">
          <p class="text-sm font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2">
            <Pause :size="16" /> 그룹이 일시 정지되었습니다
          </p>
          <p class="text-xs text-orange-600/80 dark:text-orange-400/80">
            방장의 프리미엄 구독이 만료되어 그룹 활동이 중단되었습니다.
          </p>

          <!-- 프리미엄 유저: 방장 되기 버튼 -->
          <button
            v-if="isPremium"
            @click="handleBecomeOwner"
            class="w-full max-w-xs mx-auto py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <User :size="18" />
            방장 되기 (그룹 활성화)
          </button>

          <!-- 무료 유저: 결제 유도 -->
          <div v-else class="space-y-2">
            <p class="text-xs text-orange-600/70 dark:text-orange-400/70">
              프리미엄으로 업그레이드하면 이 그룹을 다시 활성화할 수 있습니다.
            </p>
            <button
              @click="router.push('/subscription')"
              class="w-full max-w-xs mx-auto py-2.5 bg-white dark:bg-zinc-800 border-2 border-orange-500 text-orange-600 dark:text-orange-400 font-bold rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all flex items-center justify-center gap-2"
            >
              ⭐ 프리미엄 가입하기
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Hero Section (Immersive Book Info) -->
      <BookHeroSection
        :book="selectedBook ? {
          coverUrl: bookCover,
          title: bookTitle,
          author: bookAuthor,
          publisher: selectedBook.book?.publisher,
          total_pages: selectedBook.total_pages,
          genre: selectedBook.genre,
          status: selectedBook.status,
          round: selectedBook.round,
          finishedAt: selectedBook.finished_at,
          target_start_date: selectedBook.target_start_date,
          target_end_date: selectedBook.target_end_date
        } : null"
        :days-remaining="daysRemaining"
        :member-count="members.length"
        :is-solo="false"
      />

      <!-- Timeline Content (Flows naturally) -->
      <div class="px-safe max-w-[480px] mx-auto min-h-[50vh] pb-[200px]">
        <!-- 책이 없을 때 Empty State (개선된 온보딩) -->
        <div v-if="!selectedBook" class="flex flex-col items-center justify-center pt-32 px-4">
          <div class="w-24 h-24 bg-gradient-to-br from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner text-5xl">
            📚
          </div>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            {{ isAdmin ? '함께 읽을 책을 정해주세요' : '읽을 책을 기다리고 있어요' }}
          </h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-xs leading-relaxed">
            <template v-if="isAdmin">
              어떤 책으로 시작해볼까요?<br />새로운 책을 검색해서 등록해보세요!
            </template>
            <template v-else>
              관리자가 책을 등록하면<br />함께 독서를 시작할 수 있습니다.
            </template>
          </p>
          
          <button
            v-if="isAdmin"
            @click="openSearchModal"
            class="px-8 py-4 bg-lime-400 text-black font-extrabold rounded-2xl hover:bg-lime-300 transition-all shadow-lg hover:shadow-lime-400/30 flex items-center gap-2 active:scale-95"
          >
            <Plus :size="20" stroke-width="3" />
            새 책 시작하기
          </button>
          
          <button
            v-else
            @click="modals.drawer = true"
            class="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            <Menu :size="18" />
            그룹 메뉴 보기
          </button>
        </div>

        <!-- 책이 있을 때 Timeline 표시 -->
        <Timeline
          v-else
          :comments="comments"
          :viewProgress="viewProgress"
          :currentUserId="currentUserId"
          :hasMore="hasMore"
          :isLoadingMore="isLoadingMore"
          :highlightedCommentId="highlightedCommentId"
          :isFinished="selectedBook?.user_finished_at != null"
          :class="{ 'slider-dragging-block': isSliderDragging }"
          @modalOpen="modals.comment = true"
          @modalClose="modals.comment = false"
          @writeComment="handleWriteFromModal"
          @loadMore="handleLoadMore"
          @replySubmitted="fetchComments(selectedBookId)"
        />
      </div>

      <!-- Smart Slider (읽는 중이거나 완독한 책) -->
      <SmartSlider
        v-if="selectedBook"
        v-model="viewProgress"
        :toc="toc"
        :totalPages="selectedBook.book?.total_pages"
        :bookTitle="bookTitle"
        :members="selectedBook.status === 'reading' ? sliderMembers : []"
        :is-archived="isArchived"
        :is-read-only-mode="isReadOnlyMode"
        @update:modelValue="handleSliderInput"
        @change="handleSliderChange"
        @write="handleWrite"
        @dragging="handleSliderDragging"
      />
    </template>

    <!-- Comment Input Overlay -->
    <CommentInputOverlay
      :is-open="modals.commentInput"
      :chapter-name="currentChapterName"
      :position="viewProgress"
      :initial-anchor-text="newAnchorText"
      :anchor-text-locked="anchorTextLocked"
      @close="closeCommentInput"
      @submit="handleCommentSubmit"
    />

    <!-- Side Drawer -->
    <GroupDrawer
      :is-open="modals.drawer"
      :group-name="groupName"
      :current-book="currentBook"
      :selected-book-id="selectedBookId"
      :reading-books="visibleReadingBooks"
      :history-books="visibleHistoryBooks"
      :sorted-members-with-progress="sortedMembersWithProgress"
      :is-admin="isAdmin"
      :is-archived="isArchived"
      :is-solo="false"
      :is-paused="isPausedGroup"
      :is-read-only-mode="isReadOnlyMode"
      :current-user-id="currentUserId"
      :invite-code="group?.invite_code || ''"
      :toc="toc"
      :view-progress="viewProgress"
      :user-reviewed-books="userReviewedBooks"
      @close="modals.drawer = false"
      @select-book="selectBook"
      @jump-to-chapter="jumpToChapter"
      @edit-dates="openEditDatesModal"
      @edit-toc="openEditTocModal"
      @edit-genre="openEditGenreModal"
      @mark-completed="openMarkCompletedModal"
      @mark-finished="handleMarkFinished"
      @unmark-finished="handleUnmarkFinished"
      @delete-book="openDeleteBookModal"
      @open-reviews="openReviews"
      @copy-invite-code="copyInviteCode"
      @copy-invite-link="copyInviteLink"
      @regenerate-invite-code="regenerateInviteCode"
      @save-group-name="saveGroupName"
      @open-search-modal="modals.search = true"
      @open-upgrade-modal="modals.upgradeBook = true"
      @leave-group="leaveGroup"
      @delete-group="deleteGroup"
      @change-member-role="handleChangeMemberRole"
      @kick-member="handleKickMember"
      @restart-reading="handleRestartReading"
      @edit-finished-date="handleEditFinishedDate"
      @delete-history-book="handleDeleteHistoryBook"
      @open-review="handleOpenReview"
    />

    <!-- Book Search Modal -->
    <BookSearchModal
      :isOpen="modals.search"
      @close="modals.search = false"
      @confirm="handleBookAdd"
    />

    <!-- Review Modal -->
    <ReviewModal
      :isOpen="modals.review"
      :initialRating="reviewInitialData.rating"
      :initialContent="reviewInitialData.content"
      :isEditing="isEditingReview"
      :book="reviewingBook ? {
        title: reviewingBook.book?.title,
        author: reviewingBook.book?.author,
        coverUrl: reviewingBook.book?.cover_url,
        publisher: reviewingBook.book?.publisher,
        total_pages: reviewingBook.total_pages,
        genre: reviewingBook.genre
      } : null"
      @close="closeReviewModal"
      @submit="handleReviewSubmit"
    />

    <!-- Reviews Modal (All Member Reviews) -->
    <ReviewsModal
      :isOpen="modals.reviews"
      :bookTitle="reviewsBookTitle"
      :reviews="reviews"
      @close="modals.reviews = false; reviews = []"
    />

    <!-- Group Stats Modal -->
    <GroupStatsModal
      :isOpen="modals.groupStats"
      :groupId="groupId"
      :groupName="groupName"
      @close="modals.groupStats = false"
    />

    <!-- Book Admin Modals -->
    <BookAdminModals
      :edit-dates-open="modals.editDates"
      :edit-toc-open="modals.editToc"
      :edit-genre-open="modals.editGenre"
      :mark-completed-open="modals.markCompleted"
      :delete-book-open="modals.deleteBook"
      :edit-finished-date-open="modals.editFinishedDate"
      :current-book="modals.editingBook"
      :comment-count="commentCount"
      @close-edit-dates="modals.editDates = false; modals.editingBook = null"
      @close-edit-toc="modals.editToc = false; modals.editingBook = null"
      @close-edit-genre="modals.editGenre = false; modals.editingBook = null"
      @close-mark-completed="modals.markCompleted = false; modals.editingBook = null"
      @close-delete-book="modals.deleteBook = false; modals.editingBook = null"
      @close-edit-finished-date="modals.editFinishedDate = false; modals.editingBook = null"
      @save-edited-dates="saveEditedDates"
      @save-edited-toc="saveEditedToc"
      @save-edited-genre="saveEditedGenre"
      @save-edited-finished-date="saveEditedFinishedDate"
      @mark-as-completed="markAsCompleted"
      @delete-book="deleteBook"
    />

    <!-- Admin Action Modals -->
    <ConfirmModal
      :is-open="modals.promoteMember"
      variant="warning"
      title="관리자 승격"
      :message="`${pendingMemberAction?.nickname || ''}님을 관리자로 승격하시겠습니까?`"
      confirm-text="승격"
      cancel-text="취소"
      @confirm="executePromoteMember"
      @cancel="modals.promoteMember = false; pendingMemberAction = null"
    />

    <ConfirmModal
      :is-open="modals.kickMember"
      variant="danger"
      title="멤버 강퇴"
      :message="`정말로 ${pendingMemberAction?.nickname || ''}님을 강제 퇴장시키겠습니까?`"
      description="이 작업은 되돌릴 수 없습니다."
      confirm-text="강퇴"
      cancel-text="취소"
      @confirm="executeKickMember"
      @cancel="modals.kickMember = false; pendingMemberAction = null"
    />

    <ConfirmModal
      :is-open="modals.leaveGroup"
      variant="warning"
      title="그룹 나가기"
      message="정말로 이 그룹에서 나가시겠습니까?"
      description="그룹에서 탈퇴하면 지난 그룹 목록으로 이동합니다. 독서 기록은 서재에서 계속 볼 수 있으며, 다시 참여하면 이어서 활동할 수 있습니다."
      confirm-text="나가기"
      cancel-text="취소"
      @confirm="executeLeaveGroup"
      @cancel="modals.leaveGroup = false"
    />

    <ConfirmModal
      :is-open="modals.deleteGroup"
      variant="warning"
      title="그룹 종료"
      :message="members.length > 1
        ? `이 그룹에는 ${members.length}명의 멤버가 있습니다.\n그룹을 종료하시겠습니까?`
        : '그룹을 종료하시겠습니까?'"
      description="그룹을 종료하면 모든 멤버가 더 이상 활동할 수 없습니다. 지금까지의 기록은 모두 유지됩니다."
      confirm-text="종료하기"
      cancel-text="취소"
      @confirm="confirmDeleteGroup"
      @cancel="modals.deleteGroup = false"
    />

    <TextInputModal
      :is-open="modals.deleteGroupConfirm"
      title="그룹 종료 확인"
      message="정말로 종료하려면 아래 그룹 이름을 정확히 입력하세요."
      :expected-text="group?.name || ''"
      placeholder="그룹 이름 입력"
      confirm-text="종료하기"
      cancel-text="취소"
      @confirm="executeDeleteGroup"
      @cancel="modals.deleteGroupConfirm = false"
    />

    <TextDisplayModal
      :is-open="modals.clipboardFallback"
      :title="clipboardFallbackData.title"
      :message="clipboardFallbackData.message"
      :text="clipboardFallbackData.text"
      @close="modals.clipboardFallback = false"
    />

    <ConfirmModal
      :is-open="modals.regenerateInviteCode"
      variant="warning"
      title="초대 코드 재생성"
      message="정말 초대 코드를 재생성하시겠습니까?"
      description="기존 초대 링크는 더 이상 사용할 수 없게 되며, 이 작업은 되돌릴 수 없습니다."
      confirm-text="재생성"
      cancel-text="취소"
      @confirm="executeRegenerateInviteCode"
      @cancel="cancelRegenerateInviteCode"
    />

    <ConfirmModal
      :is-open="modals.deleteHistoryBook"
      variant="danger"
      title="책 삭제"
      :message="`'${pendingBookToDelete?.title || '이 책'}'을(를) 정말 삭제하시겠습니까?`"
      description="모든 댓글과 리뷰가 함께 삭제됩니다."
      confirm-text="삭제"
      cancel-text="취소"
      @confirm="confirmDeleteHistoryBook"
      @cancel="modals.deleteHistoryBook = false; pendingBookToDelete = null"
    />

    <!-- Upgrade Prompt Modal for Book Addition -->
    <UpgradePromptModal
      :isOpen="modals.upgradeBook"
      feature="books"
      @close="modals.upgradeBook = false"
    />

    <!-- Upgrade Prompt Modal for Read-Only Mode -->
    <UpgradePromptModal
      :isOpen="modals.upgradeReadOnly"
      feature="participation"
      title="그룹에 참여하고 싶으신가요?"
      description="무료 플랜에서는 그룹 내용을 확인만 할 수 있습니다. 프리미엄으로 업그레이드하면 댓글 작성, 진도 기록, 완독 처리 등 모든 기능을 사용할 수 있어요."
      @close="modals.upgradeReadOnly = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import Timeline from '~/components/Timeline.vue'
import SmartSlider from '~/components/SmartSlider.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'
import ReviewModal from '~/components/ReviewModal.vue'
import ReviewsModal from '~/components/group/ReviewsModal.vue'
import NavigationBar from '~/components/group/NavigationBar.vue'
import BookHeroSection from '~/components/group/BookHeroSection.vue'
import CommentInputOverlay from '~/components/group/CommentInputOverlay.vue'
import BookAdminModals from '~/components/group/BookAdminModals.vue'
import GroupDrawer from '~/components/group/drawer/GroupDrawer.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import TextDisplayModal from '~/components/TextDisplayModal.vue'
import TextInputModal from '~/components/TextInputModal.vue'
import { Menu, Search, Plus, Settings, Share2, ChevronLeft, ChevronRight, ChevronDown, LogOut, MoreVertical, UserCheck, UserX, Edit2, Send, X, BarChart3, Copy, User, Archive, Pause, Lock, AlertCircle } from 'lucide-vue-next'
import GroupStatsModal from '~/components/GroupStatsModal.vue'
import UpgradePromptModal from '~/components/UpgradePromptModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { formatDateRange, getDaysRemaining, getTotalDays, getDaysSinceStart } = useDateUtils()
const {
  isPremium,
  limits,
  fetchLimits,
  isReadOnlyInGroup
} = useSubscription()

// ===== Core Data & State =====
const groupId = route.params.id as string
const viewProgress = ref(0)
const currentUserId = computed(() => userStore.profile?.id)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// ===== Composables =====
// Books management
const {
  currentBook,
  readingBooks,
  historyBooks,
  selectedBookId,
  selectedBook,
  allBooks,
  fetchBooks,
  addBook,
  updateDates,
  updateToc,
  updateGenre,
  markCompleted: markBookCompleted,
  deleteBook: deleteBookFromGroup
} = useGroupBooks(groupId)

// Reading progress
const {
  memberProgress,
  updateOptimistic,
  saveProgress,
  loadProgress,
  loadMemberProgress
} = useReadingProgress(computed(() => selectedBookId.value), currentUserId)

// Comments
const {
  comments,
  fetchComments,
  loadMoreComments,
  submitComment,
  addComment,
  hasMore,
  isLoadingMore
} = useGroupComments(currentUserId.value)

// Modal states - consolidated into single reactive object (must be before useRealtimeSubscriptions)
const modals = reactive({
  drawer: false,
  search: false,
  review: false,
  reviews: false,
  comment: false,
  groupStats: false,
  commentInput: false,
  editDates: false,
  editToc: false,
  editGenre: false,
  markCompleted: false,
  deleteBook: false,
  editFinishedDate: false,
  editingBook: null as any,  // 편집 중인 책 (selectedBookId와 독립적)
  upgradeBook: false,  // Upgrade prompt for book addition
  upgradeReadOnly: false,  // Upgrade prompt for read-only mode
  // Admin action modals
  promoteMember: false,
  kickMember: false,
  leaveGroup: false,
  deleteGroup: false,
  deleteGroupConfirm: false,
  clipboardFallback: false,
  regenerateInviteCode: false,
  deleteHistoryBook: false
})

// Admin action state
const pendingMemberAction = ref<{ id: string, nickname: string } | null>(null)
const pendingBookToDelete = ref<{ id: string, title: string } | null>(null)
const clipboardFallbackData = ref({ title: '', message: '', text: '' })

// Realtime subscriptions
const {
  setupCommentSubscription,
  setupProgressSubscription,
  cleanup: cleanupSubscriptions
} = useRealtimeSubscriptions(
  selectedBookId,
  computed(() => modals.drawer),
  currentUserId,
  (comment) => addComment(comment),
  (progress) => {
    // 현재 선택된 책의 progress만 업데이트 (다른 그룹의 같은 책 데이터 무시)
    if (progress.group_book_id !== selectedBookId.value) {
      console.log('[Realtime] Ignoring progress for different book:', progress.group_book_id)
      return
    }

    const index = memberProgress.value.findIndex(p => p.user_id === progress.user_id)
    if (index >= 0) {
      memberProgress.value[index] = progress
    } else {
      memberProgress.value.push(progress)
    }
  }
)

// ===== Additional State =====
const myMembership = computed(() => members.value.find(m => m.id === currentUserId.value))
const isArchived = computed(() => group.value?.deleted_at != null || myMembership.value?.left_at != null)
const isReadOnlyMode = computed(() => {
  // Social 그룹에서 Free 유저는 읽기 전용
  const groupType = group.value?.group_type || 'social'
  return isReadOnlyInGroup(groupType)
})
const reviewInitialData = ref({ rating: 0, content: '' })
const isEditingReview = ref(false)
const reviewingBookId = ref<string | null>(null) // Track which book is being reviewed
const reviews = ref<any[]>([])
const reviewsBookTitle = ref('')
const newAnchorText = ref('')
const anchorTextLocked = ref(false)
const activeMemberMenu = ref<string | null>(null)

// Computed for review modal
const reviewingBook = computed(() => {
  if (reviewingBookId.value) {
    return allBooks.value.find(b => b.id === reviewingBookId.value) || selectedBook.value
  }
  return selectedBook.value
})

const showMemberProgress = ref(false)
const group = ref<any>(null)
const members = ref<any[]>([])
const editingGroupName = ref('')
const isScrolled = ref(false)
const userReviewedBooks = ref<Map<string, number>>(new Map()) // Track which books current user has reviewed and their ratings

// Computed
const groupName = computed(() => group.value?.name || 'Loading...')
const bookTitle = computed(() => selectedBook.value?.book?.title || 'No Book Selected')
const bookRoundLabel = computed(() => {
  if (!selectedBook.value?.round) return ''
  return `[${selectedBook.value.round}회]`
})
const bookAuthor = computed(() => selectedBook.value?.book?.author || '')
const bookCover = computed(() => selectedBook.value?.book?.cover_url || '')
const toc = computed(() => {
  const snapshot = selectedBook.value?.toc_snapshot
  const totalPages = selectedBook.value?.book?.total_pages

  if (!snapshot || !Array.isArray(snapshot)) return []
  if (!totalPages) return []

  // DB의 데이터를 UI용 표준 포맷({title, start, end, startPage})으로 변환
  return snapshot.map((c: any, i: number) => {
    // 1. 시작 페이지 결정 (startPage -> page 순서로 시도)
    let startPage = c.startPage !== undefined ? c.startPage : (c.page !== undefined ? c.page : null)
    
    // 2. 만약 페이지 번호가 전혀 없다면 (아주 오래된 퍼센트 데이터), 퍼센트 기반으로 역계산
    if (startPage === null && c.start !== undefined) {
      startPage = Math.round((c.start / 100) * totalPages)
    }
    
    // 최종 보강 (최소 1페이지)
    startPage = startPage || 1

    // 3. 종료 페이지 결정
    const nextChapter = snapshot[i + 1]
    let nextStartPage = nextChapter?.startPage !== undefined ? nextChapter.startPage : (nextChapter?.page !== undefined ? nextChapter.page : null)
    if (nextStartPage === null && nextChapter?.start !== undefined) {
      nextStartPage = Math.round((nextChapter.start / 100) * totalPages)
    }
    
    const endPage = nextStartPage ? nextStartPage - 1 : totalPages

    return {
      title: c.title,
      start: (startPage / totalPages) * 100,
      end: (endPage / totalPages) * 100,
      startPage
    }
  })
})
const currentChapterName = computed(() => {
  const pct = viewProgress.value
  const chapters = toc.value

  if (!chapters || chapters.length === 0) return '독서 기록'

  const found = chapters.find((c: any, index: number) => {
    const isLast = index === chapters.length - 1  // Fixed: chapters is already an array
    if (isLast) {
      return pct >= c.start && pct <= c.end
    } else {
      return pct >= c.start && pct < c.end
    }
  })

  if (!found && pct < chapters[0]?.start) {
    return chapters[0]?.title || 'Start'
  }

  return found ? found.title : 'End'
})

// Reading period computed properties - using useDateUtils composable
const daysRemaining = computed(() => getDaysRemaining(selectedBook.value?.target_end_date))
const totalReadingDays = computed(() => getTotalDays(selectedBook.value?.target_start_date, selectedBook.value?.target_end_date))
const daysSinceStart = computed(() => getDaysSinceStart(selectedBook.value?.target_start_date))
const progressStatus = computed(() => {
  if (!totalReadingDays.value || !daysSinceStart.value) return 'unknown'
  const expectedProgress = (daysSinceStart.value / totalReadingDays.value) * 100
  const actualProgress = viewProgress.value
  if (actualProgress >= expectedProgress + 10) return 'ahead'
  if (actualProgress < expectedProgress - 10) return 'behind'
  return 'on-track'
})

const isAdmin = computed(() => {
  const userId = currentUserId.value
  if (!userId) return false
  const member = members.value.find(m => m.id === userId)
  return member?.role === 'admin'
})

// 공유 그룹 전용 페이지 (Solo는 /my-library 사용)
const isPausedGroup = computed(() => group.value?.status === 'paused')
const commentCount = computed(() => comments.value.length)

// Sorted members with progress
const sortedMembersWithProgress = computed(() => {
  const { formatTimeAgo, isInactive, formatShortDate } = useDateUtils()

  // 🎯 활성 멤버만 필터링 (left_at이 null인 멤버만 레이스에 참여)
  const activeMembers = members.value.filter(m => !m.left_at)

  const membersWithData = activeMembers.map(member => {
    // 현재 선택된 책의 progress만 매칭 (다른 그룹의 같은 책 데이터 제외)
    const progressData = memberProgress.value.find(
      p => p.user_id === member.id && p.group_book_id === selectedBookId.value
    )

    // 진행도
    let progress: number
    if (member.id === currentUserId.value) {
      // 현재 사용자: 완독 여부 혹은 그룹 종료 여부에 따라 처리
      const isFinished = progressData?.finished_at != null
      // 🎯 종료된 그룹이거나 완독한 경우: DB 값 고정 (움직이지 않음)
      //    그 외(진행 중): 실시간 값 (슬라이더 따라 움직임)
      progress = (isFinished || isArchived.value)
        ? (progressData?.progress_pct || 0)
        : Math.round(viewProgress.value)
    } else {
      // 다른 멤버들: 항상 DB 값
      progress = progressData?.progress_pct || 0
    }

    // 마지막 활동 시간
    const lastReadAt = progressData?.last_read_at
    const timeAgo = lastReadAt ? formatTimeAgo(lastReadAt) : null
    const inactive = lastReadAt ? isInactive(lastReadAt) : true

    // 개인 완독 정보 (그룹 완료 여부와 무관)
    // finished_at 필드로만 판단 (진행도 100% ≠ 완독)
    const finishedAt = progressData?.finished_at || null
    const finishedDate = finishedAt ? formatShortDate(new Date(finishedAt)) : null
    const isCompleted = !!finishedAt  // undefined와 null 모두 false

    return {
      ...member,
      progress,
      timeAgo,
      inactive,
      finishedAt,
      finishedDate,
      isCompleted
    }
  })

  // 정렬: Reading 책은 진행도 순, History 책은 완독 날짜 순
  if (selectedBook.value?.status === 'done') {
    // History 책: 완독 빠른 순 (완독한 사람 우선, 그 다음 날짜 빠른 순)
    return membersWithData.sort((a, b) => {
      // 1. 완독한 사람 우선
      if (a.isCompleted && !b.isCompleted) return -1
      if (!a.isCompleted && b.isCompleted) return 1

      // 2. 둘 다 완독: 빨리 완독한 순 (오름차순)
      if (a.isCompleted && b.isCompleted && a.finishedAt && b.finishedAt) {
        return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
      }

      // 3. 둘 다 미완독: 진행도 높은 순
      return b.progress - a.progress
    })
  } else {
    // Reading 책: 진행도 높은 순 (내림차순)
    return membersWithData.sort((a, b) => b.progress - a.progress)
  }
})

// Slider members (exclude me, show top performers)
const sliderMembers = computed(() => {
  // 나를 제외한 멤버들
  const othersWithProgress = sortedMembersWithProgress.value
    .filter(m => m.id !== currentUserId.value)

  if (othersWithProgress.length === 0) return []

  // 4명 이하: 모두 표시
  if (othersWithProgress.length <= 4) {
    return othersWithProgress
  }

  // 5명 이상: 상위 3명만 표시
  return othersWithProgress.slice(0, 3)
})

// ✅ 모든 유저가 모든 책을 볼 수 있음 (읽기 전용 모드로 활동만 제한)
const visibleAllBooks = computed(() => allBooks.value)
const visibleReadingBooks = computed(() => readingBooks.value)
const visibleHistoryBooks = computed(() => historyBooks.value)

// Fetch user reviews to track which books have been reviewed
const fetchUserReviews = async () => {
  if (!currentUserId.value) return

  try {
    // Get all group_book IDs for this group
    const bookIds = allBooks.value.map(b => b.id)
    if (bookIds.length === 0) return

    // Fetch reviews for current user in this group
    const { data: userReviews } = await client
      .from('reviews')
      .select('group_book_id, rating')
      .eq('user_id', currentUserId.value)
      .in('group_book_id', bookIds)

    if (userReviews) {
      // 🎯 중요: 새로운 Map 객체를 생성하여 재할당해야 Vue가 변화를 감지함
      const newMap = new Map()
      userReviews.forEach(r => {
        newMap.set(r.group_book_id, Number(r.rating))
      })
      userReviewedBooks.value = newMap
      console.log('[FetchUserReviews] Updated reviews map:', userReviewedBooks.value)
      console.log('[FetchUserReviews] Size:', userReviewedBooks.value.size)
    } else {
      console.log('[FetchUserReviews] No reviews found for current user.')
    }
  } catch (error) {
    console.error('[FetchUserReviews] Error:', error)
  }
}

// Fetch Data
// ===== Data Fetching =====
const fetchData = async () => {
  if (!userStore.user) return

  isLoading.value = true
  loadError.value = null

  try {
    // Fetch group info
    const { data: groupData, error: groupError } = await client.from('groups').select('*').eq('id', groupId).single()

    // 그룹이 존재하지 않으면 홈으로 리다이렉트
    if (groupError || !groupData) {
      console.log('[Group] Group not found:', groupId)
      toast.error('존재하지 않는 그룹입니다.')
      router.push('/')
      return
    }

    group.value = groupData
    editingGroupName.value = groupData.name

    // Fetch members
    const { data: memberData } = await client
      .from('group_members')
      .select('*, user:users(*)')
      .eq('group_id', groupId)

    if (memberData) {
      members.value = memberData.map((m: any) => ({
        id: m.user.id,
        nickname: m.user.nickname,
        avatar_url: m.user.avatar_url,
        role: m.role,
        left_at: m.left_at, // 🎯 Add left_at
        subscription_tier: m.user.subscription_tier || 'free' // 🎯 Add subscription_tier for free user badge
      }))
    }

    // 현재 사용자가 이 그룹의 멤버인지 확인
    const isMember = members.value.some(m => m.id === currentUserId.value)
    if (!isMember) {
      console.log('[Group] Access denied: User is not a member of this group')
      toast.error('이 그룹에 접근할 권한이 없습니다.')
      router.push('/')
      return
    }

    // 🔥 성능 최적화: 독립적인 작업 병렬 실행
    // 1. 책 정보 먼저 조회 (리뷰 조회를 위해 필수)
    await fetchBooks()
    
    // 2. 책 정보를 바탕으로 리뷰 조회
    await fetchUserReviews()

    // Handle bookId from query parameter (e.g., from profile navigation)
    if (route.query.bookId) {
      const bookIdFromQuery = route.query.bookId as string
      // Verify the book exists in our fetched books
      const bookExists = allBooks.value.some(b => b.id === bookIdFromQuery)
      if (bookExists) {
        selectedBookId.value = bookIdFromQuery
      }
    }

    // 2. 댓글과 진행도를 병렬로 조회
    if (selectedBookId.value) {
      if (currentUserId.value) {
        const [_, progress] = await Promise.all([
          fetchComments(selectedBookId.value),
          loadProgress(selectedBookId.value, currentUserId.value)
        ])
        viewProgress.value = progress
      } else {
        await fetchComments(selectedBookId.value)
      }
    }
  } catch (err: any) {
    console.error('[Group] fetchData error:', err)
    loadError.value = err.message || '데이터를 불러오는데 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

const handleContainerScroll = (e: Event) => {
  const target = e.target as HTMLElement
  isScrolled.value = target.scrollTop > 20
}

// ===== Lifecycle =====
onMounted(async () => {
  // 🔥 이 페이지만 body 스크롤 고정 (슬라이더 작동 보장)
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100vh'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
  }

  // 🔥 성능 최적화: 독립적인 초기화 작업 병렬 실행
  await Promise.all([
    userStore.fetchProfile(),
    fetchLimits()
  ])

  await fetchData()

  // Load member progress for initial book
  if (selectedBookId.value) {
    await loadMemberProgress(selectedBookId.value)
  }

  // Setup realtime subscriptions
  setupCommentSubscription()

  // Handle query parameters from navigation (e.g., from profile)
  if (route.query.jumpTo) {
    const jumpToPct = parseFloat(route.query.jumpTo as string)
    if (!isNaN(jumpToPct)) {
      viewProgress.value = jumpToPct
    }
  }

  if (route.query.highlightComment) {
    highlightedCommentId.value = route.query.highlightComment as string
    // Remove highlight after 2 seconds
    if (highlightTimeout) clearTimeout(highlightTimeout)
    highlightTimeout = setTimeout(() => {
      highlightedCommentId.value = null
    }, 2000)
  }

  // 현재 진행도 위치로 자동 스크롤
  if (viewProgress.value > 0) {
    nextTick(() => {
      scrollToPosition(Math.round(viewProgress.value))
    })
  }
})

// Watch drawer for member progress loading
watch(() => modals.drawer, async (isOpen) => {
  if (isOpen && selectedBookId.value) {
    await loadMemberProgress(selectedBookId.value)
  }
})

// Load member progress when book changes
watch(selectedBookId, async (newBookId) => {
  if (newBookId) {
    await loadMemberProgress(newBookId)
  }
})

onBeforeUnmount(async () => {
  // Save progress immediately if there's a pending save
  if (progressSaveTimeout) {
    clearTimeout(progressSaveTimeout)
    if (selectedBookId.value && viewProgress.value !== undefined) {
      await saveProgress(viewProgress.value)
    }
  }
})

onUnmounted(() => {
  // 🔥 body 스크롤 복구 (다른 페이지 정상 작동)
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = ''
    document.documentElement.style.height = ''
    document.body.style.overflow = ''
    document.body.style.height = ''
  }

  // Clean up subscriptions
  cleanupSubscriptions()

  // Clean up timeouts and animation frames
  if (progressSaveTimeout) clearTimeout(progressSaveTimeout)
  if (highlightTimeout) clearTimeout(highlightTimeout)
  if (scrollRAF !== null) cancelAnimationFrame(scrollRAF)
})

// ===== Event Handlers =====
let progressSaveTimeout: NodeJS.Timeout | null = null
let highlightTimeout: NodeJS.Timeout | null = null
let scrollRAF: number | null = null
let scrollThrottleTimer: NodeJS.Timeout | null = null
let lastScrollTime = 0
const isSliderDragging = ref(false)

// 슬라이더 드래그 상태 추적 (완독 여부 체크용)
const handleSliderDragging = (dragging: boolean) => {
  isSliderDragging.value = dragging
}

// 슬라이더 입력 중 실시간 타임라인 스크롤 (Throttled)
const handleSliderInput = (val: number) => {
  // 🎯 실시간 스크롤이지만 Throttle로 성능 보호
  const now = Date.now()
  const THROTTLE_MS = 150 // 150ms = 초당 최대 6-7번 스크롤

  // 너무 자주 호출되면 무시 (무한 스크롤 데이터 로드 방지)
  if (now - lastScrollTime < THROTTLE_MS) {
    return
  }
  lastScrollTime = now

  // Cancel any pending RAF to prevent queue buildup
  if (scrollRAF !== null) {
    cancelAnimationFrame(scrollRAF)
  }

  // Schedule scroll update on next animation frame
  scrollRAF = requestAnimationFrame(() => {
    scrollRAF = null
    scrollToPosition(Math.round(val))
  })
}

// 슬라이더 드래그 완료 시 진행도 저장
const handleSliderChange = async (val: number) => {
  viewProgress.value = val

  // 타임라인 스크롤 (최종 위치 확정)
  nextTick(() => {
    scrollToPosition(Math.round(val))
  })

  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    console.log('[Slider] Read-only mode - not saving progress')
    return
  }

  // 완독 여부 및 그룹 종료 여부 확인
  const currentBookData = allBooks.value.find(b => b.id === selectedBookId.value)
  const isFinished = currentBookData?.user_finished_at != null

  // 🎯 종료된 그룹이거나 완독한 책이면 DB에 저장하지 않음 (이동용으로만 사용)
  if (isArchived.value || isFinished) {
    console.log('[Slider] Navigation mode - archived or finished, not saving progress')
  } else {
    // 완독 전: 진행도 추적 모드 (진행도 저장)
    console.log('[Slider] Tracking mode - saving progress:', val)

    // Optimistic Update
    updateOptimistic(val)

    // Save progress to DB (debounced)
    if (progressSaveTimeout) clearTimeout(progressSaveTimeout)
    progressSaveTimeout = setTimeout(async () => {
      if (!selectedBookId.value) return
      await saveProgress(val)
    }, 2000)
  }
}

// Scroll helper function (only called explicitly when needed, e.g., jumpToChapter)
const scrollToPosition = (targetPct: number) => {
  // Find the closest comment group by position
  const groups = document.querySelectorAll('[data-position]')
  if (groups.length === 0) return

  let closestGroup: Element | null = null
  let closestDistance = Infinity

  groups.forEach(group => {
    const position = parseInt(group.getAttribute('data-position') || '0')
    const distance = Math.abs(position - targetPct)
    if (distance < closestDistance) {
      closestDistance = distance
      closestGroup = group
    }
  })

  if (closestGroup) {
    // Center the group in viewport for better visual alignment
    closestGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}

const handleWrite = () => {
  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  modals.commentInput = true
  anchorTextLocked.value = false
}

const handleWriteFromModal = (data: { anchorText: string, position: number }) => {
  console.log('[Group] handleWriteFromModal called with:', data)

  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  // Pre-fill anchor text and position from modal
  newAnchorText.value = data.anchorText
  viewProgress.value = data.position
  anchorTextLocked.value = true
  modals.commentInput = true
}

const closeCommentInput = () => {
  modals.commentInput = false
  anchorTextLocked.value = false
  newAnchorText.value = ''
}

const handleLoadMore = async () => {
  if (!selectedBookId.value) return
  await loadMoreComments(selectedBookId.value)
}

const { validateComment } = useValidation()

const highlightedCommentId = ref<string | null>(null)

const handleCommentSubmit = async (payload: { content: string, anchorText: string | null, position: number }) => {
  if (!selectedBook.value || !currentUserId.value) return

  // Validate comment content
  const validation = validateComment(payload.content)
  if (!validation.valid) {
    toast.error(validation.message)
    return
  }

  try {
    // Use composable's submitComment method
    const newComment = await submitComment(selectedBook.value.id, currentUserId.value, payload)

    // Close the overlay and reset state
    modals.commentInput = false
    newAnchorText.value = ''
    anchorTextLocked.value = false

    // Scroll to the new comment position and highlight it
    if (newComment?.id) {
      // Wait for DOM update
      await nextTick()

      // Scroll to position
      scrollToPosition(Math.round(payload.position))

      // Highlight the new comment briefly
      highlightedCommentId.value = newComment.id
      if (highlightTimeout) clearTimeout(highlightTimeout)
      highlightTimeout = setTimeout(() => {
        highlightedCommentId.value = null
      }, 2000) // Remove highlight after 2 seconds
    }
  } catch (error: any) {
    toast.error('댓글 작성 실패: ' + error.message)
  }
}

const closeReviewModal = () => {
  modals.review = false
  reviewingBookId.value = null // Clear the reviewing book
}

const handleReviewSubmit = async (data: any) => {
  if (!reviewingBookId.value || !userStore.user) return

  try {
    if (!currentUserId.value) return

    const book = allBooks.value.find(b => b.id === reviewingBookId.value)
    console.log('[Review] Saving review for book:', reviewingBookId.value, book?.book?.title)

    // Upsert review (insert or update)
    const { error } = await client
      .from('reviews')
      .upsert({
        user_id: currentUserId.value,
        group_book_id: reviewingBookId.value,
        rating: data.rating,
        content: data.content
      }, {
        onConflict: 'user_id,group_book_id'
      })

    if (error) {
      console.error('Review save error:', error)
      throw error
    }

    // 리뷰 개수 업데이트를 위해 책 목록 새로고침
    await fetchBooks()
    // 🎯 중요: 리뷰 작성 목록(userReviewedBooks) 즉시 최신화
    await fetchUserReviews()

    closeReviewModal()
    toast.success('리뷰가 저장되었습니다! 🎉')

  } catch (error: any) {
    console.error('Review error:', error)
    toast.error('리뷰 저장 실패: ' + (error.message || '알 수 없는 오류'))
  }
}

// ... (Keep existing helper functions: jumpToChapter, isCurrentChapter, openReviewModalForEdit, etc.) ...
// We need to keep the existing functions but ensure they use the new data refs if needed.
// Since we replaced the whole script block, I need to include them back.

const openSearchModal = () => {
  modals.drawer = false

  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  modals.search = true
}

// Admin book management handlers
const openEditDatesModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.editDates = true
}

const openEditTocModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.editToc = true
}

const openEditGenreModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.editGenre = true
}

const openMarkCompletedModal = (bookId: string) => {
  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.markCompleted = true
}

const openDeleteBookModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.deleteBook = true
}

// History book handlers
const handleRestartReading = async (bookId: string) => {
  const book = allBooks.value.find(b => b.id === bookId)
  if (!book) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 책 상태를 변경할 수 있습니다.')
    return
  }

  try {
    const { error } = await client
      .from('group_books')
      .update({
        status: 'reading',
        finished_at: null
      })
      .eq('id', bookId)

    if (error) throw error

    toast.success('다시 읽기로 변경되었습니다!')

    // 로컬 상태 새로고침 (책장 → 정보 탭으로 이동)
    await fetchBooks()

  } catch (error: any) {
    console.error('[RestartReading] Error:', error)
    toast.error('상태 변경 중 오류가 발생했습니다.')
  }
}

const handleEditFinishedDate = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.editFinishedDate = true
}

/**
 * 완독 처리 핵심 로직 (공통 함수)
 * @param bookId - 완독 처리할 책 ID
 * @param openReviewModal - 리뷰 모달 열지 여부 (기본: true)
 */
const markAsFinished = async (bookId: string, openReviewModal = true) => {
  if (!currentUserId.value) return

  try {
    const now = new Date().toISOString()

    console.log('[MarkAsFinished] Starting...', { bookId, userId: currentUserId.value })

    // 1. DB 업데이트 (upsert로 변경 - row 없어도 생성)
    const { data, error } = await client
      .from('user_reading_progress')
      .upsert({
        user_id: currentUserId.value,
        group_book_id: bookId,
        finished_at: now,
        progress_pct: 100,
        last_read_at: now
      }, {
        onConflict: 'user_id,group_book_id'
      })
      .select()

    if (error) {
      console.error('[MarkAsFinished] DB Error:', error)
      throw error
    }

    console.log('[MarkAsFinished] DB updated:', data)

    // 2. 데이터 새로고침 (DB에서 최신 데이터 가져오기)
    await loadMemberProgress(bookId)
    await fetchBooks()

    // Vue가 DOM 업데이트 완료할 때까지 대기
    await nextTick()

    console.log('[MarkAsFinished] After fetchBooks - readingBooks:',
      readingBooks.value.find(b => b.id === bookId)?.user_finished_at)

    // 3. UI 업데이트
    viewProgress.value = 100

    toast.success('완독 처리되었습니다! 🎉')

    // 4. 리뷰 모달 열기 (옵션)
    if (openReviewModal) {
      await openReviewModalForBook(bookId)
    }
  } catch (error: any) {
    console.error('[MarkAsFinished] Error:', error)
    toast.error('완독 처리 중 오류가 발생했습니다.')
  }
}

/**
 * 리뷰 모달 열기
 */
const openReviewModalForBook = async (bookId: string) => {
  reviewingBookId.value = bookId

  // Check for existing review
  const { data: existingReview } = await client
    .from('reviews')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('group_book_id', bookId)
    .maybeSingle()

  if (existingReview) {
    reviewInitialData.value = {
      rating: parseFloat(existingReview.rating),
      content: existingReview.content || ''
    }
    isEditingReview.value = true
  } else {
    reviewInitialData.value = { rating: 0, content: '' }
    isEditingReview.value = false
  }

  modals.review = true
}

// 드로어 메뉴에서 완독 처리
const handleMarkFinished = (bookId: string) => {
  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  markAsFinished(bookId, true)
}

/**
 * 완독 취소
 */
const handleUnmarkFinished = async (bookId: string) => {
  if (!currentUserId.value) return

  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  try {
    console.log('[UnmarkFinished] Starting...', { bookId, userId: currentUserId.value })

    // 1. DB 업데이트
    const { data, error } = await client
      .from('user_reading_progress')
      .update({ finished_at: null })
      .eq('group_book_id', bookId)
      .eq('user_id', currentUserId.value)
      .select()

    if (error) {
      console.error('[UnmarkFinished] DB Error:', error)
      throw error
    }

    console.log('[UnmarkFinished] DB updated:', data)

    // 2. 데이터 새로고침 (DB에서 최신 데이터 가져오기)
    await loadMemberProgress(bookId)
    await fetchBooks()

    // Vue가 DOM 업데이트 완료할 때까지 대기
    await nextTick()

    console.log('[UnmarkFinished] ✅ After refresh:')
    console.log('  - allBooks user_finished_at:', allBooks.value.find(b => b.id === bookId)?.user_finished_at)
    console.log('  - memberProgress finished_at:', memberProgress.value.find(p => p.group_book_id === bookId && p.user_id === currentUserId.value)?.finished_at)

    // 3. viewProgress를 DB의 실제 진행도로 복원 (완독 취소 시 100%로)
    const progressData = memberProgress.value.find(
      p => p.group_book_id === bookId && p.user_id === currentUserId.value
    )
    if (progressData) {
      viewProgress.value = progressData.progress_pct || 100
      console.log('  - viewProgress restored to:', viewProgress.value)
    }

    toast.success('완독이 취소되었습니다.')
  } catch (error: any) {
    console.error('[UnmarkFinished] Error:', error)
    toast.error('완독 취소 중 오류가 발생했습니다.')
  }
}

const handleDeleteHistoryBook = (bookId: string) => {
  const book = allBooks.value.find(b => b.id === bookId)
  if (!book) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 책을 삭제할 수 있습니다.')
    return
  }

  pendingBookToDelete.value = {
    id: bookId,
    title: book.book?.title || '이 책'
  }
  modals.deleteHistoryBook = true
}

const confirmDeleteHistoryBook = async () => {
  if (!pendingBookToDelete.value) return

  const bookId = pendingBookToDelete.value.id
  modals.deleteHistoryBook = false
  pendingBookToDelete.value = null

  try {
    // Soft delete - 기록 보존을 위해 deleted_at만 설정
    const { error } = await client
      .from('group_books')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', bookId)

    if (error) throw error

    // 삭제된 책은 프로필 서재에서 기본 숨김 처리
    await client
      .from('user_reading_progress')
      .update({ hidden: true })
      .eq('group_book_id', bookId)

    toast.success('책이 삭제되었습니다.')

    // 로컬 상태 새로고침 (책장에서 즉시 제거)
    await fetchBooks()

  } catch (error: any) {
    console.error('[DeleteHistoryBook] Error:', error)
    toast.error('책 삭제 중 오류가 발생했습니다.')
  }
}

const handleOpenReview = async (bookId: string) => {
  const book = allBooks.value.find(b => b.id === bookId)
  if (!book) return

  if (!userStore.user || !currentUserId.value) return

  // 읽기 전용 모드 체크
  if (isReadOnlyMode.value) {
    modals.upgradeReadOnly = true
    return
  }

  // Set the book being reviewed
  reviewingBookId.value = bookId

  // Fetch existing review for this group_book
  const { data: existingReview } = await client
    .from('reviews')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('group_book_id', book.id)
    .maybeSingle()

  reviewInitialData.value = existingReview
    ? { rating: existingReview.rating, content: existingReview.content || '' }
    : { rating: 0, content: '' }

  isEditingReview.value = !!existingReview

  modals.review = true
  modals.drawer = false
}

// Reviews modal
const fetchReviews = async (bookId: string) => {
  try {
    console.log('[Reviews] Fetching reviews for book:', bookId)

    // 1. 먼저 reviews만 가져오기
    const { data: reviewsData, error: reviewsError } = await client
      .from('reviews')
      .select('*')
      .eq('group_book_id', bookId)

    console.log('[Reviews] Reviews data:', reviewsData)

    if (reviewsError) throw reviewsError

    if (!reviewsData || reviewsData.length === 0) {
      reviews.value = []
      console.log('[Reviews] No reviews found')
      return
    }

    // 2. user_id들을 모아서 users 조회
    const userIds = [...new Set(reviewsData.map(r => r.user_id))]
    const { data: usersData, error: usersError } = await client
      .from('users')
      .select('id, nickname, avatar_url')
      .in('id', userIds)

    console.log('[Reviews] Users data:', usersData)

    if (usersError) {
      console.warn('[Reviews] Users fetch error:', usersError)
    }

    // 3. reviews와 users를 매핑
    const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
    reviews.value = reviewsData.map(r => {
      const user = usersMap.get(r.user_id)
      return {
        ...r,
        user: user ? {
          display_name: user.nickname || '익명',
          avatar_url: user.avatar_url
        } : { display_name: '익명', avatar_url: null }
      }
    })

    console.log('[Reviews] Final reviews:', reviews.value.length)
  } catch (error) {
    console.error('[Reviews] Error fetching reviews:', error)
    reviews.value = []
  }
}

const openReviews = async (bookId: string) => {
  const book = allBooks.value.find(b => b.id === bookId)
  if (!book) return

  // 이전 리뷰 데이터 초기화
  reviews.value = []
  reviewsBookTitle.value = book.book?.title || book.title || '책'

  // 모달 먼저 열기 (로딩 상태 표시)
  modals.reviews = true

  // 리뷰 데이터 로드
  await fetchReviews(bookId)
}

const saveEditedDates = async (dates: { startDate: string, endDate: string }) => {
  if (!modals.editingBook || !dates.startDate || !dates.endDate) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 독서 기간을 수정할 수 있습니다.')
    modals.editDates = false
    modals.editingBook = null
    return
  }

  try {
    // Use composable's updateDates method
    await updateDates(modals.editingBook.id, dates.startDate, dates.endDate)

    // 로컬 상태 업데이트 (새로고침 없이 반영)
    await fetchBooks()

    modals.editDates = false
    modals.editingBook = null
    toast.success('독서 기간이 수정되었습니다! 📅')
  } catch (error) {
    console.error('Edit dates error:', error)
    toast.error('독서 기간 수정에 실패했습니다.')
  }
}

const markAsCompleted = async () => {
  if (!modals.editingBook) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 완주 처리를 할 수 있습니다.')
    modals.markCompleted = false
    modals.editingBook = null
    return
  }

  try {
    // Use composable's markCompleted method
    await markBookCompleted(modals.editingBook.id)

    modals.markCompleted = false
    modals.editingBook = null
    toast.success('완주 처리되었습니다! 🎉 책장으로 이동합니다.')

    // Refresh other data
    await fetchData()
  } catch (error) {
    console.error('Mark completed error:', error)
    toast.error('완주 처리에 실패했습니다.')
  }
}

const deleteBook = async () => {
  if (!modals.editingBook) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 책을 삭제할 수 있습니다.')
    modals.deleteBook = false
    modals.editingBook = null
    return
  }

  try {
    // Use composable's deleteBook method
    await deleteBookFromGroup(modals.editingBook.id)

    modals.deleteBook = false
    modals.editingBook = null
    toast.success('책이 삭제되었습니다.')

    // Refresh other data
    await fetchData()
  } catch (error) {
    console.error('Delete book error:', error)
    toast.error('책 삭제에 실패했습니다.')
  }
}

const saveEditedToc = async (tocData: { totalPages: number, chapters: { title: string, startPage: number }[] }) => {
  if (!modals.editingBook || !tocData.totalPages || tocData.totalPages <= 0) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 목차를 수정할 수 있습니다.')
    modals.editToc = false
    modals.editingBook = null
    return
  }

  try {
    // Use composable's updateToc method
    await updateToc(modals.editingBook.id, modals.editingBook.isbn, tocData.totalPages, tocData.chapters)

    // 로컬 상태 업데이트 (새로고침 없이 반영)
    await fetchBooks()

    modals.editToc = false
    modals.editingBook = null
    toast.success('목차가 수정되었습니다! 📑')
  } catch (error: any) {
    console.error('Save TOC error:', error)
    toast.error('수정 실패: ' + error.message)
  }
}

const saveEditedGenre = async (genre: string) => {
  if (!modals.editingBook || !genre) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 장르를 수정할 수 있습니다.')
    modals.editGenre = false
    modals.editingBook = null
    return
  }

  try {
    await updateGenre(modals.editingBook.id, modals.editingBook.isbn, genre)
    
    // 로컬 상태 업데이트 (새로고침 없이 반영)
    await fetchBooks()

    modals.editGenre = false
    modals.editingBook = null
    toast.success('장르가 수정되었습니다! 🏷️')
  } catch (error: any) {
    console.error('Save Genre error:', error)
    toast.error('장르 수정 실패: ' + error.message)
  }
}

const saveEditedFinishedDate = async (finishedDate: string) => {
  if (!modals.editingBook || !finishedDate) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 완주 날짜를 수정할 수 있습니다.')
    modals.editFinishedDate = false
    modals.editingBook = null
    return
  }

  try {
    const { error } = await client
      .from('group_books')
      .update({ finished_at: finishedDate })
      .eq('id', modals.editingBook.id)

    if (error) throw error

    toast.success('완주 날짜가 수정되었습니다!')

    // 로컬 상태 업데이트
    modals.editingBook.finished_at = finishedDate
    await fetchBooks()

    modals.editFinishedDate = false
    modals.editingBook = null
  } catch (error: any) {
    console.error('[SaveFinishedDate] Error:', error)
    toast.error('완주 날짜 수정 중 오류가 발생했습니다.')
  }
}

const handleBookAdd = async (data: any) => {
  // Archived group check
  if (isArchived.value) {
    toast.error('종료된 그룹에는 책을 추가할 수 없습니다.')
    return
  }

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 책을 추가할 수 있습니다.')
    return
  }

  try {
    // ✅ Convert reactive objects to plain objects
    const plainData = {
      book: {
        isbn: data.book.isbn,
        title: data.book.title,
        author: data.book.author,
        publisher: data.book.publisher,
        cover: data.book.cover
      },
      toc: data.toc.map((c: any) => ({
        title: c.title,
        startPage: c.startPage
      })),
      totalPages: data.totalPages,
      startDate: data.startDate,
      endDate: data.endDate,
      genre: data.genre
    }

    // Use composable's addBook method
    await addBook(plainData)

    // Refresh other data
    await fetchData()

    toast.success('새 책이 추가되었습니다! 🎉')
  } catch (error: any) {
    console.error('[Group] Book add error:', error)
    toast.error(error.message || '책 추가 중 오류가 발생했습니다.')
  }
}

const saveGroupName = async (newName: string) => {
  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 그룹 이름을 변경할 수 있습니다.')
    return
  }

  const trimmedName = newName.trim()

  if (!trimmedName) {
    toast.warning('그룹 이름을 입력해주세요.')
    return
  }

  if (trimmedName.length < 2) {
    toast.warning('그룹 이름은 2글자 이상이어야 합니다.')
    return
  }

  try {
    const { error } = await client
      .from('groups')
      .update({ name: trimmedName })
      .eq('id', groupId)

    if (error) {
      console.error('Group name update error:', error)
      toast.error('그룹 이름 변경에 실패했습니다: ' + error.message)
      return
    }

    group.value.name = trimmedName
    toast.success('그룹 이름이 변경되었습니다!')
  } catch (err) {
    console.error('Unexpected error:', err)
    toast.error('예상치 못한 오류가 발생했습니다.')
  }
}

const toggleMemberMenu = (memberId: string) => {
  activeMemberMenu.value = activeMemberMenu.value === memberId ? null : memberId
}

const promoteMember = (memberId: string) => {
  const member = members.value.find(m => m.id === memberId)
  if (!member) return

  pendingMemberAction.value = { id: memberId, nickname: member.nickname }
  modals.promoteMember = true
}

const executePromoteMember = async () => {
  if (!pendingMemberAction.value) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 권한을 변경할 수 있습니다.')
    modals.promoteMember = false
    pendingMemberAction.value = null
    return
  }

  try {
    const { error } = await client
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', pendingMemberAction.value.id)

    if (error) throw error

    await fetchData()
    toast.success('관리자로 승격되었습니다.')
  } catch (error) {
    console.error('Promote member error:', error)
    toast.error('권한 변경에 실패했습니다.')
  } finally {
    modals.promoteMember = false
    pendingMemberAction.value = null
    activeMemberMenu.value = null
  }
}

const kickMember = (memberId: string) => {
  const member = members.value.find(m => m.id === memberId)
  if (!member) return

  pendingMemberAction.value = { id: memberId, nickname: member.nickname }
  modals.kickMember = true
}

const executeKickMember = async () => {
  if (!pendingMemberAction.value) return

  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 멤버를 강퇴할 수 있습니다.')
    modals.kickMember = false
    pendingMemberAction.value = null
    return
  }

  try {
    const { error } = await client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', pendingMemberAction.value.id)

    if (error) throw error

    // Update local state
    members.value = members.value.filter(m => m.id !== pendingMemberAction.value!.id)

    toast.success(`${pendingMemberAction.value.nickname}님이 그룹에서 제거되었습니다.`)
  } catch (error) {
    console.error('Kick member error:', error)
    toast.error('멤버 강퇴에 실패했습니다.')
  } finally {
    modals.kickMember = false
    pendingMemberAction.value = null
    activeMemberMenu.value = null
  }
}

const handleBecomeOwner = async () => {
  if (!isPremium.value) {
    toast.error('프리미엄 회원만 방장이 될 수 있습니다.')
    return
  }

  if (!isPausedGroup.value) {
    toast.error('일시 정지된 그룹만 방장이 될 수 있습니다.')
    return
  }

  try {
    const { data, error } = await $fetch('/api/groups/become-owner', {
      method: 'POST',
      body: {
        groupId
      }
    })

    if (error) throw error

    toast.success('방장이 되었습니다! 그룹이 다시 활성화되었습니다.', 5000)

    // Reload group data
    await fetchData()
  } catch (error: any) {
    console.error('Become owner error:', error)
    toast.error(error.message || '방장 되기에 실패했습니다.')
  }
}

const copyInviteLink = async () => {
  if (!group.value?.invite_code) {
    toast.error('초대 코드를 불러올 수 없습니다.')
    return
  }

  const inviteLink = `${window.location.origin}/join/${group.value.invite_code}`

  try {
    await navigator.clipboard.writeText(inviteLink)
    toast.success('초대 링크가 클립보드에 복사되었습니다!\n친구들에게 공유해보세요.', 5000)
  } catch (err) {
    console.error('Clipboard error:', err)
    clipboardFallbackData.value = {
      title: '초대 링크',
      message: '클립보드 복사에 실패했습니다. 아래 링크를 수동으로 복사해주세요.',
      text: inviteLink
    }
    modals.clipboardFallback = true
  }
}

const copyInviteCode = async () => {
  if (!group.value?.invite_code) {
    toast.error('초대 코드를 불러올 수 없습니다.')
    return
  }

  const inviteCode = group.value.invite_code

  try {
    await navigator.clipboard.writeText(inviteCode)
    toast.success('초대 코드가 클립보드에 복사되었습니다!', 3000)
  } catch (err) {
    console.error('Clipboard error:', err)
    clipboardFallbackData.value = {
      title: '초대 코드',
      message: '클립보드 복사에 실패했습니다. 아래 코드를 수동으로 복사해주세요.',
      text: inviteCode
    }
    modals.clipboardFallback = true
  }
}

const regenerateInviteCode = () => {
  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 초대 코드를 재생성할 수 있습니다.')
    return
  }

  // Show confirmation modal
  modals.regenerateInviteCode = true
}

const executeRegenerateInviteCode = async () => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let newCode = ''
    let attempts = 0
    const maxAttempts = 5

    // Generate unique code with retry logic
    while (attempts < maxAttempts) {
      // Generate new 8-character invite code (uppercase letters and numbers)
      newCode = ''
      for (let i = 0; i < 8; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      // Check if code already exists
      const { data: existing } = await client
        .from('groups')
        .select('id')
        .eq('invite_code', newCode)
        .maybeSingle()

      if (!existing) break // Code is unique
      attempts++
    }

    if (attempts === maxAttempts) {
      toast.error('초대 코드 생성에 실패했습니다. 다시 시도해주세요.')
      return
    }

    // Update in database
    const { error } = await client
      .from('groups')
      .update({ invite_code: newCode })
      .eq('id', groupId)

    if (error) {
      console.error('Invite code regeneration error:', error)
      toast.error('초대 코드 재생성에 실패했습니다: ' + error.message)
      return
    }

    // Update local state
    if (group.value) {
      group.value.invite_code = newCode
    }

    toast.success(`새 초대 코드가 생성되었습니다: ${newCode}`)
    modals.regenerateInviteCode = false
  } catch (err) {
    console.error('Unexpected error:', err)
    toast.error('예상치 못한 오류가 발생했습니다.')
  }
}

const cancelRegenerateInviteCode = () => {
  modals.regenerateInviteCode = false
}

const jumpToChapter = (startPct: number) => {
  console.log('[jumpToChapter] Moving to:', startPct)

  // 1. 즉시 슬라이더 이동 (v-model에 의해 SmartSlider 자동 업데이트)
  viewProgress.value = startPct

  // 2. Optimistic Update (멤버 진행도 UI 즉시 반영)
  updateOptimistic(startPct)

  // 3. Vue 렌더링 완료 후 서랍 닫기
  nextTick(() => {
    console.log('[jumpToChapter] Closing drawer and scrolling')
    scrollToPosition(Math.round(startPct))
    modals.drawer = false
  })

  // 4. DB 저장
  if (selectedBookId.value) {
    saveProgress(startPct)
  }
}

const isCurrentChapter = (chapter: any) => {
  return viewProgress.value >= chapter.start && viewProgress.value < chapter.end
}

const openReviewModalForEdit = async (book: any) => {
  if (!userStore.user) return

  if (!currentUserId.value) return

  // Set the book being reviewed
  reviewingBookId.value = book.id

  // Fetch existing review for this group_book
  const { data: existingReview } = await client
    .from('reviews')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('group_book_id', book.id)
    .maybeSingle()

  reviewInitialData.value = existingReview
    ? { rating: existingReview.rating, content: existingReview.content || '' }
    : { rating: 0, content: '' }

  isEditingReview.value = !!existingReview

  modals.review = true
  modals.drawer = false
}

const deleteGroup = () => {
  if (!isAdmin.value) {
    toast.error('관리자만 그룹을 삭제할 수 있습니다.')
    return
  }

  // Show first confirmation modal
  modals.deleteGroup = true
}

const confirmDeleteGroup = () => {
  // First confirm accepted, now ask for group name
  modals.deleteGroup = false
  modals.deleteGroupConfirm = true
}

const executeDeleteGroup = async (inputText: string) => {
  // Admin permission check
  if (!isAdmin.value) {
    toast.error('관리자만 그룹을 삭제할 수 있습니다.')
    modals.deleteGroupConfirm = false
    return
  }

  try {
    console.log('[Group] Soft deleting group:', groupId)

    // 🎯 하드 삭제 대신 deleted_at 업데이트 (Soft Delete)
    const { error } = await client
      .from('groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId)

    if (error) {
      console.error('Group delete error:', error)
      toast.error('그룹 삭제에 실패했습니다: ' + error.message)
      return
    }

    toast.success('그룹이 종료되었습니다. (아카이브 보관)')
    router.push('/')
  } catch (err) {
    console.error('Unexpected error:', err)
    toast.error('예상치 못한 오류가 발생했습니다.')
  } finally {
    modals.deleteGroupConfirm = false
  }
}

const leaveGroup = () => {
  if (!currentUserId.value) return

  // Check if user is the only admin AND there are other members
  const admins = members.value.filter(m => m.role === 'admin')
  // 멤버가 나 혼자뿐이면 그냥 나갈 수 있음 (그룹은 유령 상태로 남음)
  if (admins.length === 1 && admins[0].id === currentUserId.value && members.value.length > 1) {
    toast.error('그룹의 유일한 관리자입니다. 다른 멤버를 관리자로 지정한 후 나가주세요.')
    return
  }

  modals.leaveGroup = true
}

const executeLeaveGroup = async () => {
  if (!currentUserId.value) return

  try {
    // 🎯 Soft Leave: left_at 업데이트
    const { error } = await client
      .from('group_members')
      .update({ left_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('user_id', currentUserId.value)

    if (error) throw error

    toast.success('그룹을 보관함으로 이동했습니다. (지난 그룹에서 확인 가능)')
    router.push('/')
  } catch (error) {
    console.error('Leave group error:', error)
    toast.error('그룹 나가기에 실패했습니다.')
  } finally {
    modals.leaveGroup = false
  }
}

const handleChangeMemberRole = async (member: any) => {
  if (!isAdmin.value) {
    toast.error('관리자만 권한을 변경할 수 있습니다.')
    return
  }

  const newRole = member.role === 'admin' ? 'member' : 'admin'
  const roleText = newRole === 'admin' ? '관리자' : '멤버'

  try {
    const { error } = await client
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', member.id)

    if (error) throw error

    // Update local state
    const memberIndex = members.value.findIndex(m => m.id === member.id)
    if (memberIndex >= 0) {
      members.value[memberIndex].role = newRole
    }

    toast.success(`${member.nickname}님의 권한이 ${roleText}로 변경되었습니다.`)
  } catch (error: any) {
    console.error('Change role error:', error)
    toast.error('권한 변경 실패: ' + error.message)
  }
}

const handleKickMember = (member: any) => {
  if (!isAdmin.value) {
    toast.error('관리자만 멤버를 강퇴할 수 있습니다.')
    return
  }

  pendingMemberAction.value = { id: member.id, nickname: member.nickname }
  modals.kickMember = true
}

// Select book to view
const selectBook = async (bookId: string) => {
  selectedBookId.value = bookId
  modals.drawer = false

  // Fetch comments for selected book
  await fetchComments(bookId)

  // Load user's reading progress
  const userId = currentUserId.value
  if (userId) {
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('group_book_id', bookId)
      .maybeSingle()

    if (progressData) {
      viewProgress.value = progressData.progress_pct
    } else {
      viewProgress.value = 0
    }

    // 책을 선택했다는 것을 기록 (last_read_at 업데이트)
    // 단, 종료된 그룹이거나 이미 완독한 책(책장 탭)은 기록하지 않음 (순서 변경 방지)
    if (!isArchived.value && !progressData?.finished_at) {
      await saveProgress(viewProgress.value)
    }
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style>
/* Global smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>

<style scoped>
@keyframes slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes slide-left {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-right {
  animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-slide-left {
  animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 🎯 Disable Timeline touch during slider drag (but allow programmatic scroll) */
.slider-dragging-block {
  pointer-events: none !important;
  touch-action: none !important;
  user-select: none !important;
  /* overflow는 그대로 둠 - 프로그래밍 스크롤은 허용 */
}
</style>