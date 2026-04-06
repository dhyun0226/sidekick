<template>
  <!-- Desktop View -->
  <DesktopLibraryView v-if="isDesktop" />

  <div
    v-else
    class="relative h-[100dvh] bg-gray-50 dark:bg-background overflow-y-auto overflow-x-hidden"
    style="overscroll-behavior: none;"
    @scroll="handleContainerScroll"
  >
    <!-- 1. Fixed Navigation Bar (Always visible) -->
    <NavigationBar
      :title="bookTitle || group?.name || '내 서재'"
      :is-scrolled="isScrolled"
      @back="router.push('/')"
      @open-drawer="modals.drawer = true"
    />

    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="px-4 pt-4">
        <SkeletonTimeline :count="3" />
      </div>
    </template>

    <!-- Loaded Content -->
    <template v-else>
      <!-- NavBar spacer -->
      <div class="h-16"></div>

      <!-- Archived Notice Banner -->
      <div v-if="isArchived" class="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center relative z-30">
        <p class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 uppercase tracking-tighter">
          <Archive :size="12" /> 이 그룹은 종료되었습니다. (과거의 기록만 열람 가능)
        </p>
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
        :member-count="undefined"
        :is-solo="true"
      />

      <!-- Timeline Content (Flows naturally) -->
      <div class="px-safe max-w-[480px] mx-auto min-h-[50vh] pb-[200px]">
        <!-- 책이 없을 때 Empty State (개선된 온보딩) -->
        <div v-if="!selectedBook" class="flex flex-col items-center justify-center pt-32 px-4">
          <div class="w-24 h-24 bg-gradient-to-br from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <BookOpen :size="32" class="text-zinc-300 dark:text-zinc-500" />
          </div>
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            읽을 책을 추가해주세요
          </h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-xs leading-relaxed">
            어떤 책으로 시작해볼까요?<br />새로운 책을 검색해서 등록해보세요!
          </p>

          <button
            @click="openSearchModal"
            class="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple flex items-center gap-2 active:scale-95"
          >
            <Plus :size="20" stroke-width="3" />
            새 책 추가하기
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
          :is-solo="true"
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
        :totalPages="selectedBook.total_pages"
        :bookTitle="bookTitle"
        :members="selectedBook.status === 'reading' ? sliderMembers : []"
        :is-archived="isArchived"
        @update:modelValue="handleSliderInput"
        @change="handleSliderChange"
        @write="handleWrite"
        @dragging="handleSliderDragging"
      />
    </template>

    <!-- Comment Input Overlay (Mobile only) -->
    <CommentInputOverlay
      v-if="!isDesktop"
      :is-open="modals.commentInput"
      :chapter-name="currentChapterName"
      :position="viewProgress"
      :initial-anchor-text="newAnchorText"
      :anchor-text-locked="anchorTextLocked"
      @close="closeCommentInput"
      @submit="handleCommentSubmit"
    />

    <!-- Side Drawer (Mobile only) -->
    <MyLibraryDrawer
      :is-open="modals.drawer"
      :group-name="groupName"
      :current-book="currentBook"
      :selected-book-id="selectedBookId"
      :reading-books="visibleReadingBooks"
      :history-books="visibleHistoryBooks"
      :is-archived="isArchived"
      :toc="toc"
      :view-progress="viewProgress"
      :user-reviewed-books="userReviewedBooks"
      @close="modals.drawer = false"
      @select-book="selectBook"
      @jump-to-chapter="jumpToChapter"
      @edit-dates="openEditDatesModal"
      @edit-toc="openEditTocModal"
      @edit-genre="openEditGenreModal"
      @mark-finished="handleMarkFinished"
      @unmark-finished="handleUnmarkFinished"
      @delete-book="openDeleteBookModal"
      @save-group-name="saveGroupName"
      @open-search-modal="modals.search = true"
      @open-upgrade-modal="modals.upgradeBook = true"
      @delete-group="deleteGroup"
      @edit-finished-date="handleEditFinishedDate"
      @delete-history-book="handleDeleteHistoryBook"
      @open-review="handleOpenReview"
      @open-reviews="openReviews"
    />

  </div>

  <!-- Shared Modals (desktop + mobile 공용) -->
  <BookSearchModal
    :isOpen="modals.search"
    @close="modals.search = false"
    @confirm="handleBookAdd"
  />

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

  <ReviewsModal
    :isOpen="modals.reviews"
    :bookTitle="reviewsBookTitle"
    :reviews="reviews"
    @close="modals.reviews = false; reviews = []"
  />

  <GroupStatsModal
    :isOpen="modals.groupStats"
    :groupId="groupId"
    :groupName="groupName"
    @close="modals.groupStats = false"
  />

  <BookAdminModals
    :edit-dates-open="modals.editDates"
    :edit-toc-open="modals.editToc"
    :edit-genre-open="modals.editGenre"
    :mark-completed-open="modals.markCompleted"
    :delete-book-open="modals.deleteBook"
    :edit-finished-date-open="modals.editFinishedDate"
    :current-book="modals.editingBook"
    :comment-count="commentCount"
    :is-solo="true"
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

  <ConfirmModal
    :is-open="modals.promoteMember"
    variant="warning"
    title="그룹장 승격"
    :message="`${pendingMemberAction?.nickname || ''}님을 그룹장으로 승격하시겠습니까?`"
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
    description="그룹을 나가면 다시 초대를 받아야 합니다."
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
    description="종료된 그룹은 '지난 그룹' 목록으로 이동하며, 모든 독서 기록은 안전하게 보관됩니다."
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

  <UpgradePromptModal
    :isOpen="modals.upgradeBook"
    feature="books"
    @close="modals.upgradeBook = false"
  />
</template>

<script setup lang="ts">
import { ref, provide, defineAsyncComponent } from 'vue'
import NavigationBar from '~/components/group/NavigationBar.vue'
import BookHeroSection from '~/components/group/BookHeroSection.vue'
import Timeline from '~/components/Timeline.vue'
import SmartSlider from '~/components/SmartSlider.vue'
import CommentInputOverlay from '~/components/group/CommentInputOverlay.vue'
import MyLibraryDrawer from '~/components/my-library/MyLibraryDrawer.vue'
import BookAdminModals from '~/components/group/BookAdminModals.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import TextDisplayModal from '~/components/TextDisplayModal.vue'
import TextInputModal from '~/components/TextInputModal.vue'
import { Archive, Plus, BookOpen } from 'lucide-vue-next'
import { GroupPageKey } from '~/types'

const DesktopLibraryView = defineAsyncComponent(() => import('~/components/desktop/library/DesktopLibraryView.vue'))
const { isDesktop } = useDevice()

// Phase 4: Lazy-loaded modals
const BookSearchModal = defineAsyncComponent(() => import('~/components/BookSearchModal.vue'))
const ReviewModal = defineAsyncComponent(() => import('~/components/ReviewModal.vue'))
const ReviewsModal = defineAsyncComponent(() => import('~/components/group/ReviewsModal.vue'))
const GroupStatsModal = defineAsyncComponent(() => import('~/components/GroupStatsModal.vue'))
const UpgradePromptModal = defineAsyncComponent(() => import('~/components/UpgradePromptModal.vue'))

definePageMeta({
  middleware: ['auth']
})

useHead({ title: '내 서재' })

const groupIdRef = ref('')

const groupPageCtx = useGroupPage({ mode: 'solo', groupIdRef })
const {
  router,
  viewProgress,
  currentUserId,
  isLoading,
  groupId,
  currentBook,
  selectedBookId,
  selectedBook,
  allBooks,
  comments,
  hasMore,
  isLoadingMore,
  modals,
  pendingMemberAction,
  pendingBookToDelete,
  clipboardFallbackData,
  group,
  members,
  isScrolled,
  reviewInitialData,
  isEditingReview,
  reviews,
  reviewsBookTitle,
  newAnchorText,
  anchorTextLocked,
  userReviewedBooks,
  highlightedCommentId,
  isSliderDragging,
  isArchived,
  reviewingBook,
  groupName,
  bookTitle,
  bookAuthor,
  bookCover,
  toc,
  currentChapterName,
  daysRemaining,
  commentCount,
  sliderMembers,
  visibleReadingBooks,
  visibleHistoryBooks,
  fetchData,
  handleContainerScroll,
  handleSliderDragging,
  handleSliderInput,
  handleSliderChange,
  handleWrite,
  handleWriteFromModal,
  closeCommentInput,
  handleLoadMore,
  handleCommentSubmit,
  closeReviewModal,
  handleReviewSubmit,
  handleOpenReview,
  openReviews,
  openSearchModal,
  handleBookAdd,
  openEditDatesModal,
  openEditTocModal,
  openEditGenreModal,
  openDeleteBookModal,
  handleEditFinishedDate,
  saveEditedDates,
  saveEditedToc,
  saveEditedGenre,
  saveEditedFinishedDate,
  markAsCompleted,
  deleteBook,
  handleMarkFinished,
  handleUnmarkFinished,
  handleDeleteHistoryBook,
  confirmDeleteHistoryBook,
  saveGroupName,
  deleteGroup,
  confirmDeleteGroup,
  executeDeleteGroup,
  executePromoteMember,
  executeKickMember,
  executeLeaveGroup,
  executeRegenerateInviteCode,
  cancelRegenerateInviteCode,
  jumpToChapter,
  selectBook,
  fetchComments
} = groupPageCtx

// Provide context for desktop components
provide(GroupPageKey, groupPageCtx)
</script>

<style>
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

.slider-dragging-block {
  pointer-events: none !important;
  touch-action: none !important;
  user-select: none !important;
}
</style>
