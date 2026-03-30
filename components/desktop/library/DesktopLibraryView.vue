<template>
  <div class="flex h-[100dvh]">
    <!-- Left: Book List Sidebar -->
    <div class="w-64 border-r border-zinc-100 dark:border-zinc-800/60 flex-shrink-0">
      <DesktopBookListSidebar
        ref="sidebarRef"
        :reading-books="readingBooks"
        :history-books="historyBooks"
        :selected-book-id="selectedBookId"
        :is-archived="isArchived"
        @select="selectBook"
        @select-history="selectBook"
        @add-book="openSearchModal"
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
            <div class="flex flex-wrap items-center gap-1.5 mb-3 text-[16px] text-zinc-500 dark:text-zinc-300">
              <span>{{ bookAuthor }}</span>
              <template v-if="selectedBook.book?.publisher || selectedBook.total_pages">
                <span class="text-zinc-300 dark:text-zinc-500">·</span>
                <span v-if="selectedBook.book?.publisher">{{ selectedBook.book.publisher }}</span>
                <span v-if="selectedBook.book?.publisher && selectedBook.total_pages" class="text-zinc-300 dark:text-zinc-500">·</span>
                <span v-if="selectedBook.total_pages">{{ selectedBook.total_pages }}p</span>
              </template>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <GenreBadge v-if="selectedBook.genre" :genre="selectedBook.genre" />
              <Badge v-if="daysRemaining !== null">
                {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}` }}
              </Badge>
              <Badge v-if="selectedBook.round && selectedBook.round > 1">{{ selectedBook.round }}회차</Badge>
              <Badge v-if="selectedBook.target_start_date && selectedBook.target_end_date">
                {{ formatShortDate(selectedBook.target_start_date) }} - {{ formatShortDate(selectedBook.target_end_date) }}
              </Badge>
              <Badge v-if="selectedBook.user_finished_at">
                {{ formatShortDate(selectedBook.user_finished_at) }} 완독
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="flex flex-col items-center justify-center h-full">
        <div class="text-center">
          <h2 class="text-desktop-headline font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">읽을 책을 추가해주세요</h2>
          <p class="text-desktop-callout text-zinc-500 dark:text-zinc-400 mb-6 font-light">독서 여정을 시작하세요</p>
          <button
            @click="openSearchModal"
            class="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200 ease-apple text-desktop-callout"
          >
            새 책 추가하기
          </button>
        </div>
      </div>

      <!-- Timeline -->
      <div v-if="selectedBook && !isSelectingBook" class="px-8 pb-8">
        <DesktopTimelineView
          ref="timelineRef"
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
          @reply-submit="handleReplySubmit"
          @like="handleLike"
          @open-batch="batchModalOpen = true"
          @edit="handleEditComment"
          @delete="handleDeleteComment"
          @progress-change="handleProgressChange"
        />
      </div>

      <!-- Loading (initial or switching books) -->
      <div v-if="isLoading || isSelectingBook" class="px-8 pt-6">
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
        :is-admin="true"
        :is-solo="true"
        :preferred-mode="preferredInputMode"
        :user-rating="selectedBookId ? userReviewedBooks.get(selectedBookId) : null"
        @progress-change="handleProgressChange"
        @mode-change="handleModeChange"
        @jump-to-chapter="jumpToChapter"
        @edit-dates="selectedBookId && openEditDatesModal(selectedBookId)"
        @edit-toc="selectedBookId && openEditTocModal(selectedBookId)"
        @mark-finished="selectedBookId && handleMarkFinished(selectedBookId)"
        @delete-book="handleDeleteBook"
        @edit-genre="selectedBookId && openEditGenreModal(selectedBookId)"
        @unmark-finished="selectedBookId && handleUnmarkFinished(selectedBookId)"
        @mark-completed="selectedBookId && openMarkCompletedModal(selectedBookId)"
        @open-review="selectedBookId && handleOpenReview(selectedBookId)"
        @open-reviews="selectedBookId && openReviews(selectedBookId)"
        @restart-reading="selectedBookId && handleRestartReading(selectedBookId)"
        @edit-finished-date="selectedBookId && handleEditFinishedDate(selectedBookId)"
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
import Badge from '~/components/Badge.vue'
import GenreBadge from '~/components/GenreBadge.vue'

const ctx = inject(GroupPageKey)!
const toast = useToastStore()
const userStore = useUserStore()
const client = useSupabaseClient()

// Destructure from context
const {
  isLoading,
  isSelectingBook,
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
  openMarkCompletedModal,
  handleDeleteHistoryBook,
  handleRestartReading,
  handleEditFinishedDate,
  userReviewedBooks,
  modals
} = ctx

const formatShortDate = (d: string) => {
  const date = new Date(d)
  const y = date.getFullYear() % 100
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

const batchModalOpen = ref(false)
const batchModalRef = ref<InstanceType<typeof DesktopBatchNotesModal> | null>(null)
const timelineRef = ref<any>(null)
const sidebarRef = ref<any>(null)

// Keyboard shortcuts
const isInputFocused = () => {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable
}

const handleKeydown = (e: KeyboardEvent) => {
  // Skip when modal is open
  if (batchModalOpen.value) return

  // Ctrl/Cmd + / → batch input
  if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    if (selectedBook.value && !isArchived.value) {
      batchModalOpen.value = true
    }
    return
  }

  // Skip remaining shortcuts when input focused
  if (isInputFocused()) return

  // / → focus position input
  if (e.key === '/') {
    e.preventDefault()
    const input = timelineRef.value?.positionInputRef
    if (input) {
      input.focus()
      input.select()
    }
    return
  }

  // ↑↓ → navigate books
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    sidebarRef.value?.selectAdjacentBook('up')
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    sidebarRef.value?.selectAdjacentBook('down')
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

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

const handleReplySubmit = async (data: { parentId: string; content: string; groupBookId: string; positionPct: number }) => {
  const userId = userStore.profile?.id
  if (!userId) return

  try {
    const { data: newReply, error } = await client
      .from('comments')
      .insert({
        group_book_id: data.groupBookId,
        user_id: userId,
        parent_id: data.parentId,
        content: data.content,
        position_pct: data.positionPct
      })
      .select('*, user:users(*)')
      .single()

    if (error) throw error

    // Add reply to parent's replies array
    const parent = comments.value.find((c: any) => c.id === data.parentId)
    if (parent) {
      if (!parent.replies) parent.replies = []
      parent.replies.push({ ...newReply, likes: 0, isLiked: false })
    }
  } catch (e) {
    toast.error('답글 작성에 실패했습니다')
  }
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
    await client.from('comments').update({
      content: comment.content,
      anchor_text: comment.anchor_text || null
    }).eq('id', comment.id)
    toast.success('수정되었습니다')
  } catch (e) { toast.error('수정에 실패했습니다') }
}

const handleDeleteComment = async (comment: any) => {
  // 답글 삭제 (parent_id가 있으면 답글)
  if (comment.parent_id) {
    try {
      await client.from('comments').delete().eq('id', comment.id)
      if (selectedBookId.value) fetchComments(selectedBookId.value)
      toast.success('답글이 삭제되었습니다')
    } catch (e) { toast.error('삭제에 실패했습니다') }
    return
  }

  // 코멘트 삭제 (undo 지원)
  try {
    const savedReplies = comment.replies ? [...comment.replies] : []
    const savedContent = comment.content
    const savedAnchor = comment.anchor_text
    const savedCreatedAt = comment.created_at

    if (savedReplies.length > 0) {
      const replyIds = savedReplies.map((r: any) => r.id)
      await client.from('comments').delete().in('id', replyIds)
    }
    await client.from('comments').delete().eq('id', comment.id)

    if (selectedBookId.value) fetchComments(selectedBookId.value)
    toast.success('삭제되었습니다', async () => {
      try {
        const { data: restored } = await client.from('comments').insert({
          content: savedContent,
          anchor_text: savedAnchor,
          position_pct: comment.position_pct,
          user_id: comment.user_id,
          group_book_id: comment.group_book_id,
          created_at: savedCreatedAt
        }).select('id').single()

        if (restored && savedReplies.length > 0) {
          await client.from('comments').insert(
            savedReplies.map((r: any) => ({
              content: r.content,
              position_pct: r.position_pct,
              user_id: r.user_id,
              group_book_id: r.group_book_id,
              parent_id: restored.id,
              created_at: r.created_at
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
        content: note.content,
        anchorText: note.anchorText,
        position: note.positionPct
      })
      batchModalRef.value?.incrementSaved()
    }
    batchModalRef.value?.finishSave()
    toast.success(`${notes.length}개 노트가 저장되었습니다`)
    batchModalOpen.value = false
  } catch (e) {
    batchModalRef.value?.finishSave()
    toast.error('일부 노트 저장에 실패했습니다')
  }
}
</script>
