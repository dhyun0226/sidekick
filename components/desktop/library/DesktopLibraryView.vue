<template>
  <div class="flex h-[100dvh]">
    <!-- Left: Book List Sidebar -->
    <div class="w-56 border-r border-zinc-100 dark:border-zinc-800/60 flex-shrink-0">
      <DesktopBookListSidebar
        :reading-books="readingBooks"
        :history-books="historyBooks"
        :selected-book-id="selectedBookId"
        :is-archived="isArchived"
        @select="selectBook"
        @select-history="selectBook"
        @add-book="openSearchModal"
        @restart-reading="handleRestartReading"
        @delete-history="handleDeleteHistoryBook"
      />
    </div>

    <!-- Center: Timeline + Inline Input -->
    <div class="flex-1 overflow-y-auto">
      <!-- Hero -->
      <div v-if="selectedBook" class="px-8 pt-10 pb-6">
        <div class="flex items-start gap-6">
          <div class="w-24 h-[136px] rounded-xl overflow-hidden shadow-apple flex-shrink-0">
            <img v-if="bookCover" :src="bookCover" class="w-full h-full object-cover" />
          </div>
          <div class="pt-1">
            <h1 class="text-desktop-headline font-semibold tracking-tight text-zinc-900 dark:text-white mb-1.5 leading-tight">{{ bookTitle }}</h1>
            <p class="text-desktop-callout text-zinc-500 mb-3 font-light">{{ bookAuthor }}</p>
            <div class="flex items-center gap-3 text-desktop-caption text-zinc-400">
              <span v-if="daysRemaining !== null">
                {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}` }}
              </span>
              <span v-if="selectedBook.total_pages">{{ selectedBook.total_pages }}p</span>
              <span v-if="selectedBook.genre">{{ selectedBook.genre }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="flex flex-col items-center justify-center h-full">
        <div class="text-center">
          <h2 class="text-desktop-headline font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">읽을 책을 추가해주세요</h2>
          <p class="text-desktop-callout text-zinc-500 mb-6 font-light">독서 여정을 시작하세요</p>
          <button
            @click="openSearchModal"
            class="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200 ease-apple text-desktop-callout"
          >
            새 책 추가하기
          </button>
        </div>
      </div>

      <!-- Timeline -->
      <div v-if="selectedBook" class="px-8 pb-8">
        <DesktopTimelineView
          :comments="comments"
          :view-progress="viewProgress"
          :has-more="hasMore"
          :is-loading-more="isLoadingMore"
          :is-archived="isArchived"
          :current-user-id="ctx.currentUserId.value"
          :total-pages="selectedBook?.total_pages"
          :preferred-mode="preferredInputMode"
          @submit="handleInlineSubmit"
          @load-more="handleLoadMore"
          @reply="handleReply"
          @like="handleLike"
          @open-batch="batchModalOpen = true"
          @edit="handleEditComment"
          @delete="handleDeleteComment"
          @progress-change="handleProgressChange"
        />
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="px-8 pt-6">
        <SkeletonTimeline :count="3" />
      </div>
    </div>

    <!-- Right: Book Info Panel -->
    <DesktopRightPanel v-if="selectedBook">
      <DesktopBookInfoPanel
        :book="selectedBook"
        :view-progress="viewProgress"
        :toc="toc"
        :is-archived="isArchived"
        :preferred-mode="preferredInputMode"
        @progress-change="handleProgressChange"
        @mode-change="handleModeChange"
        @jump-to-chapter="jumpToChapter"
        @edit-dates="selectedBookId && openEditDatesModal(selectedBookId)"
        @edit-toc="selectedBookId && openEditTocModal(selectedBookId)"
        @mark-finished="selectedBookId && handleMarkFinished(selectedBookId)"
        @delete-book="handleDeleteBook"
        @edit-genre="selectedBookId && openEditGenreModal(selectedBookId)"
        @unmark-finished="selectedBookId && handleUnmarkFinished(selectedBookId)"
        @open-review="selectedBookId && handleOpenReview(selectedBookId)"
        @open-reviews="selectedBookId && openReviews(selectedBookId)"
      />
    </DesktopRightPanel>

    <!-- Batch Notes Modal -->
    <DesktopBatchNotesModal
      ref="batchModalRef"
      :is-open="batchModalOpen"
      :total-pages="selectedBook?.total_pages"
      :preferred-mode="preferredInputMode"
      @close="batchModalOpen = false"
      @save="handleBatchSave"
    />

    <!-- Reply Modal (reuse mobile CommentDetailModal) -->
    <CommentDetailModal
      :isOpen="!!replyTargetComment"
      :anchorText="replyTargetComment?.anchor_text || ''"
      :position="replyTargetComment?.position_pct || 0"
      :comments="replyTargetComment ? [replyTargetComment] : []"
      :currentUserId="ctx.currentUserId.value"
      @close="replyTargetComment = null"
      @writeComment="(data: any) => handleInlineSubmit(data)"
      @replySubmitted="replyTargetComment = null; if (selectedBookId) fetchComments(selectedBookId)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { GroupPageKey } from '~/types'
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import DesktopRightPanel from '~/components/desktop/core/DesktopRightPanel.vue'
import DesktopBookListSidebar from './DesktopBookListSidebar.vue'
import DesktopBookInfoPanel from './DesktopBookInfoPanel.vue'
import DesktopTimelineView from './DesktopTimelineView.vue'
import DesktopBatchNotesModal from './DesktopBatchNotesModal.vue'
import CommentDetailModal from '~/components/CommentDetailModal.vue'

const ctx = inject(GroupPageKey)!
const toast = useToastStore()
const userStore = useUserStore()
const client = useSupabaseClient()

// Destructure from context
const {
  isLoading,
  selectedBook,
  selectedBookId,
  viewProgress,
  comments,
  hasMore,
  isLoadingMore,
  isArchived,
  bookTitle,
  bookAuthor,
  bookCover,
  toc,
  daysRemaining,
  visibleReadingBooks: readingBooks,
  visibleHistoryBooks: historyBooks,
  selectBook,
  openSearchModal,
  handleLoadMore,
  handleCommentSubmit,
  handleSliderChange,
  jumpToChapter,
  openEditDatesModal,
  openEditTocModal,
  handleMarkFinished,
  fetchComments,
  openReviews,
  handleOpenReview,
  deleteBook,
  openEditGenreModal,
  handleUnmarkFinished,
  handleDeleteHistoryBook,
  handleRestartReading,
  modals
} = ctx

const batchModalOpen = ref(false)
const batchModalRef = ref<InstanceType<typeof DesktopBatchNotesModal> | null>(null)

// Preferred input mode from app_settings
const preferredInputMode = ref<'percent' | 'page'>(
  (userStore.profile?.app_settings as any)?.preferred_input_mode || 'percent'
)

const handleModeChange = async (mode: 'percent' | 'page') => {
  preferredInputMode.value = mode
  // Save to app_settings
  const userId = userStore.profile?.id
  if (!userId) return
  try {
    const currentSettings = userStore.profile?.app_settings || {}
    await client.from('users').update({
      app_settings: { ...currentSettings, preferred_input_mode: mode }
    }).eq('id', userId)
  } catch (e) {
    console.error('Failed to save input mode:', e)
  }
}

const handleProgressChange = (pct: number) => {
  viewProgress.value = pct
  handleSliderChange(pct)
  toast.success(`진행률 ${Math.round(pct)}% 저장`)
}

const handleInlineSubmit = (data: { content: string; anchorText: string; positionPct: number }) => {
  handleCommentSubmit({
    content: data.content,
    anchorText: data.anchorText,
    position: data.positionPct
  })
}

const replyTargetComment = ref<any>(null)

const handleReply = (comment: any) => {
  replyTargetComment.value = comment
}

const handleLike = async (comment: any) => {
  const userId = userStore.profile?.id
  if (!userId) return

  // Optimistic update
  const wasLiked = comment.isLiked
  const prevLikes = comment.likes || 0
  comment.isLiked = !wasLiked
  comment.likes = wasLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1

  try {
    if (wasLiked) {
      await client.from('reactions').delete().eq('comment_id', comment.id).eq('user_id', userId).eq('type', 'like')
    } else {
      await client.from('reactions').insert({ comment_id: comment.id, user_id: userId, type: 'like' })
    }
  } catch (e) {
    // Rollback on error
    comment.isLiked = wasLiked
    comment.likes = prevLikes
    console.error('Like toggle failed:', e)
  }
}

const handleDeleteBook = () => {
  if (selectedBook.value) {
    modals.editingBook = selectedBook.value
    modals.deleteBook = true
  }
}

const handleEditComment = async (comment: any) => {
  try {
    await client.from('comments').update({ content: comment.content }).eq('id', comment.id)
    if (selectedBookId.value) fetchComments(selectedBookId.value)
    toast.success('수정되었습니다')
  } catch (e) { toast.error('수정에 실패했습니다') }
}

const handleDeleteComment = async (comment: any) => {
  try {
    // 답글 백업 (undo용)
    const savedReplies = comment.replies ? [...comment.replies] : []
    const savedContent = comment.content
    const savedAnchor = comment.anchor_text

    // 답글 먼저 삭제, 그 다음 부모 삭제
    if (savedReplies.length > 0) {
      const replyIds = savedReplies.map((r: any) => r.id)
      await client.from('comments').delete().in('id', replyIds)
    }
    await client.from('comments').delete().eq('id', comment.id)

    if (selectedBookId.value) fetchComments(selectedBookId.value)
    toast.success('삭제되었습니다', async () => {
      // Undo: 부모 먼저 복원, 그 다음 답글 복원
      try {
        const { data: restored } = await client.from('comments').insert({
          content: savedContent,
          anchor_text: savedAnchor,
          position_pct: comment.position_pct,
          user_id: comment.user_id,
          group_book_id: comment.group_book_id
        }).select('id').single()

        if (restored && savedReplies.length > 0) {
          await client.from('comments').insert(
            savedReplies.map((r: any) => ({
              content: r.content,
              position_pct: r.position_pct,
              user_id: r.user_id,
              group_book_id: r.group_book_id,
              parent_id: restored.id
            }))
          )
        }
        if (selectedBookId.value) fetchComments(selectedBookId.value)
        toast.success('복원되었습니다')
      } catch { toast.error('복원에 실패했습니다') }
    })
  } catch (e) { toast.error('삭제에 실패했습니다') }
}

const handleBatchSave = async (notes: Array<{ positionPct: number; anchorText: string; content: string }>) => {
  try {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]
      await handleCommentSubmit({
        content: note.content || '(메모)',
        anchorText: note.anchorText,
        position: note.positionPct
      })
      batchModalRef.value?.incrementSaved()
    }
    batchModalRef.value?.finishSave()
    toast.success(`${notes.length}개 노트가 저장되었습니다!`)
    batchModalOpen.value = false
  } catch (e) {
    batchModalRef.value?.finishSave()
    toast.error('일부 노트 저장에 실패했습니다.')
  }
}
</script>
