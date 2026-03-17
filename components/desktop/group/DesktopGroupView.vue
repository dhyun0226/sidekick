<template>
  <div class="flex h-[100dvh]">
    <!-- Left: Book List -->
    <div class="w-56 border-r border-zinc-100 dark:border-zinc-800/60 flex-shrink-0">
      <DesktopBookListSidebar
        :reading-books="visibleReadingBooks"
        :history-books="visibleHistoryBooks"
        :selected-book-id="selectedBookId"
        :is-archived="isArchived"
        @select="selectBook"
        @select-history="selectBook"
        @add-book="isAdmin ? openSearchModal() : toast.info('관리자만 책을 추가할 수 있어요')"
        @restart-reading="handleRestartReading"
        @delete-history="handleDeleteHistoryBook"
      />
    </div>

    <!-- Center: Timeline -->
    <div class="flex-1 overflow-y-auto">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" message="불러오는 중..." />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="flex flex-col items-center justify-center h-full px-8">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle :size="32" class="text-red-500" />
        </div>
        <h2 class="text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">문제가 발생했습니다</h2>
        <p class="text-[14px] text-zinc-500 mb-4 font-light">{{ loadError }}</p>
        <button @click="fetchData" class="px-4 py-2 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 text-desktop-callout">
          다시 시도
        </button>
      </div>

      <template v-else>
        <!-- Banners -->
        <div v-if="isReadOnlyMode" class="px-8 pt-4">
          <div class="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 flex items-center gap-3 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <Lock :size="18" class="text-zinc-400 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-desktop-callout text-zinc-700 dark:text-zinc-300 font-medium">읽기 전용 모드</p>
              <p class="text-desktop-caption text-zinc-500">프리미엄으로 업그레이드하면 참여할 수 있어요.</p>
            </div>
            <button
              @click="modals.upgradeReadOnly = true"
              class="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-full transition-colors duration-200 ease-apple text-desktop-caption flex-shrink-0"
            >
              프리미엄으로 참여하기
            </button>
          </div>
        </div>

        <div v-if="isPausedGroup && !isArchived" class="px-8 pt-4">
          <div class="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-4 flex items-center gap-3 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <Lock :size="18" class="text-zinc-400 flex-shrink-0" />
            <div class="flex-1">
              <p class="text-desktop-callout text-zinc-700 dark:text-zinc-300 font-medium">일시정지된 그룹</p>
              <p class="text-desktop-caption text-zinc-500">구독이 만료되어 그룹이 일시정지 상태입니다.</p>
            </div>
            <button
              v-if="isPremium"
              @click="handleBecomeOwner"
              class="px-4 py-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-full transition-colors duration-200 ease-apple text-desktop-caption flex-shrink-0"
            >
              방장 되기
            </button>
          </div>
        </div>

        <!-- Hero -->
        <div v-if="selectedBook" class="px-8 pt-10 pb-6">
          <div class="flex items-start gap-6">
            <div class="w-24 h-34 rounded-xl overflow-hidden shadow-apple flex-shrink-0">
              <img v-if="bookCover" :src="bookCover" class="w-full h-full object-cover" />
            </div>
            <div class="pt-1">
              <p class="text-desktop-caption text-zinc-400 mb-1">{{ groupName }}</p>
              <h1 class="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-1.5 leading-tight">{{ bookTitle }}</h1>
              <p class="text-[14px] text-zinc-500 mb-3 font-light">{{ bookAuthor }}</p>
              <div class="flex items-center gap-3 text-desktop-caption text-zinc-400">
                <span v-if="daysRemaining !== null">
                  {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}` }}
                </span>
                <span>{{ members.length }}명 참여</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!isLoading" class="flex flex-col items-center justify-center h-full">
          <div class="text-center">
            <h2 class="text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
              {{ isAdmin ? '함께 읽을 책을 정해주세요' : '읽을 책을 기다리고 있어요' }}
            </h2>
            <button
              v-if="isAdmin"
              @click="openSearchModal"
              class="mt-4 px-5 py-2.5 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 transition-colors duration-200 ease-apple text-desktop-callout"
            >
              새 책 시작하기
            </button>
          </div>
        </div>

        <!-- Timeline -->
        <div v-if="selectedBook" class="px-8 pb-8">
          <DesktopGroupTimeline
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
      </template>
    </div>

    <!-- Right: Members + Book Info -->
    <DesktopRightPanel v-if="!isLoading && !loadError">
      <!-- Tab Switcher -->
      <div class="flex bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full p-0.5 mb-5">
        <button
          v-for="tab in rightTabs"
          :key="tab.key"
          @click="activeRightTab = tab.key"
          class="flex-1 py-1.5 text-desktop-caption font-semibold rounded-full transition-all duration-200 ease-apple text-center"
          :class="activeRightTab === tab.key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm' : 'text-zinc-500 hover:text-zinc-700'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Members Tab -->
      <DesktopMemberPanel
        v-if="activeRightTab === 'members'"
        :members="sortedMembersWithProgress"
        :is-admin="isAdmin"
        :current-user-id="ctx.currentUserId.value"
        @change-role="handleChangeMemberRole"
        @kick="(m: any) => kickMember(m.id)"
      />

      <!-- Book Info Tab -->
      <DesktopBookInfoPanel
        v-if="activeRightTab === 'book' && selectedBook"
        :book="selectedBook"
        :view-progress="viewProgress"
        :toc="toc"
        :is-archived="isArchived"
        :preferred-mode="preferredInputMode"
        :show-mark-completed="isAdmin"
        @progress-change="handleProgressChange"
        @mode-change="handleModeChange"
        @jump-to-chapter="jumpToChapter"
        @edit-dates="selectedBookId && openEditDatesModal(selectedBookId)"
        @edit-toc="selectedBookId && openEditTocModal(selectedBookId)"
        @mark-finished="selectedBookId && handleMarkFinished(selectedBookId)"
        @mark-completed="selectedBookId && openMarkCompletedModal(selectedBookId)"
        @delete-book="handleDeleteBook"
        @edit-genre="selectedBookId && openEditGenreModal(selectedBookId)"
        @unmark-finished="selectedBookId && handleUnmarkFinished(selectedBookId)"
        @open-review="selectedBookId && handleOpenReview(selectedBookId)"
        @open-reviews="selectedBookId && openReviews(selectedBookId)"
      />

      <!-- Settings Tab -->
      <DesktopGroupSettings
        v-if="activeRightTab === 'settings'"
        :group-name="groupName"
        :invite-code="group?.invite_code"
        :is-admin="isAdmin"
        @copy-code="copyInviteCode"
        @copy-link="copyInviteLink"
        @regenerate-code="regenerateInviteCode"
        @delete-group="deleteGroup"
        @leave-group="leaveGroup"
        @save-group-name="saveGroupName"
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

    <!-- Reply Modal -->
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
import { ref, inject } from 'vue'
import { AlertCircle, Lock } from 'lucide-vue-next'
import { GroupPageKey } from '~/types'
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import DesktopRightPanel from '~/components/desktop/core/DesktopRightPanel.vue'
import DesktopBookListSidebar from '~/components/desktop/library/DesktopBookListSidebar.vue'
import DesktopBookInfoPanel from '~/components/desktop/library/DesktopBookInfoPanel.vue'
import DesktopGroupTimeline from './DesktopGroupTimeline.vue'
import DesktopMemberPanel from './DesktopMemberPanel.vue'
import DesktopGroupSettings from './DesktopGroupSettings.vue'
import DesktopBatchNotesModal from '~/components/desktop/library/DesktopBatchNotesModal.vue'
import CommentDetailModal from '~/components/CommentDetailModal.vue'

const ctx = inject(GroupPageKey)!
const toast = useToastStore()
const userStore = useUserStore()
const client = useSupabaseClient()

const {
  isLoading, loadError, selectedBook, selectedBookId, viewProgress,
  comments, hasMore, isLoadingMore, isArchived, isReadOnlyMode, isAdmin,
  bookTitle, bookAuthor, bookCover, groupName, toc, daysRemaining,
  members, sortedMembersWithProgress, group,
  visibleReadingBooks, visibleHistoryBooks,
  selectBook, openSearchModal, handleLoadMore, handleCommentSubmit,
  handleSliderChange, jumpToChapter, openEditDatesModal, openEditTocModal,
  openMarkCompletedModal, handleMarkFinished, fetchData, fetchComments,
  copyInviteCode, copyInviteLink, deleteGroup, leaveGroup, saveGroupName,
  openReviews, handleOpenReview, handleReviewSubmit,
  handleDeleteHistoryBook, handleRestartReading,
  handleChangeMemberRole, kickMember, executeKickMember,
  executePromoteMember, promoteMember,
  regenerateInviteCode, executeRegenerateInviteCode,
  deleteBook, openEditGenreModal,
  handleUnmarkFinished,
  isPausedGroup,
  isPremium,
  handleBecomeOwner,
  modals
} = ctx

const batchModalOpen = ref(false)
const batchModalRef = ref<InstanceType<typeof DesktopBatchNotesModal> | null>(null)
const activeRightTab = ref<'members' | 'book' | 'settings'>('members')

const rightTabs = [
  { key: 'members' as const, label: '멤버' },
  { key: 'book' as const, label: '책 정보' },
  { key: 'settings' as const, label: '설정' }
]

const preferredInputMode = ref<'percent' | 'page'>(
  (userStore.profile?.app_settings as any)?.preferred_input_mode || 'percent'
)

const handleModeChange = async (mode: 'percent' | 'page') => {
  preferredInputMode.value = mode
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
  try {
    if (comment.isLiked) {
      await client.from('reactions').delete().eq('comment_id', comment.id).eq('user_id', userId).eq('type', 'like')
    } else {
      await client.from('reactions').insert({ comment_id: comment.id, user_id: userId, type: 'like' })
    }
    if (selectedBookId.value) fetchComments(selectedBookId.value)
  } catch (e) { console.error('Like toggle failed:', e) }
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
    await client.from('comments').delete().eq('id', comment.id)
    if (selectedBookId.value) fetchComments(selectedBookId.value)
    toast.success('삭제되었습니다')
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
