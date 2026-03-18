<template>
  <div class="flex flex-col space-y-8 px-5 pt-4 mb-64">
    <div
      v-for="group in groupedComments"
      :key="group.key"
      :data-position="Math.round(group.position)"
      class="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 ml-2"
    >
      <!-- Timeline Dot -->
      <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 z-10"></div>

      <!-- Minimal Header -->
      <div class="flex items-baseline gap-2 mb-3 -mt-1.5">
        <span class="text-sm font-black text-lime-600 dark:text-lime-500">
          {{ Math.round(group.position) }}%
        </span>
        <span class="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold">
          {{ group.totalCount }}개의 기록
        </span>
      </div>

      <!-- Anchor Text (Clean & Classic) -->
      <div
        v-if="group.anchorText"
        class="mb-4 pl-4 border-l-[3px] border-lime-400 cursor-pointer hover:opacity-80 transition-opacity"
        :class="{ 'blur-sm opacity-40 select-none': isSpoiler(group.position) }"
      >
        <p class="text-[15px] text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
          {{ group.anchorText }}
        </p>
      </div>

      <!-- Comments List (Text Only) -->
      <div class="space-y-6">
        <div
          v-for="comment in group.previewComments"
          :key="comment.id"
          class="relative group"
          :class="{ 'opacity-50 hover:opacity-100 transition-opacity': highlightedCommentId === comment.id }"
        >
          <!-- User & Date (With Avatar) - Hidden in Solo mode -->
          <div v-if="!isSolo" class="flex items-center gap-2 mb-1.5">
            <Avatar
              :src="comment.user?.avatar_url"
              :fallback="comment.user?.nickname || '탈'"
              size="xs"
              :alt="comment.user?.nickname || '탈퇴한 사용자'"
              className="w-5 h-5 shadow-sm opacity-80"
            />
            <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100" :class="{ 'text-zinc-400 font-medium italic': !comment.user }">
              {{ comment.user?.nickname || '탈퇴한 사용자' }}
            </span>
            <span class="text-[10px] text-zinc-300 dark:text-zinc-600">{{ formatDate(comment.created_at) }}</span>
          </div>

          <!-- Date only in Solo mode -->
          <div v-else class="flex items-center gap-2 mb-1.5">
            <span class="text-[10px] text-zinc-300 dark:text-zinc-600">{{ formatDate(comment.created_at) }}</span>
          </div>

          <!-- Content -->
          <div 
            class="text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap"
            :class="{
              'blur-sm opacity-40 select-none pointer-events-none': isSpoiler(group.position)
            }"
          >
            <div v-if="editingCommentId !== comment.id">
              {{ comment.content }}
            </div>
            
            <!-- Edit Mode -->
            <div v-else class="mt-2">
              <textarea
                v-model="editContent"
                class="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 resize-none ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
                rows="2"
                @keydown.esc="cancelEdit"
              ></textarea>
              <div class="flex gap-2 mt-2">
                <button @click="saveEdit(comment.id)" class="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded hover:opacity-90">저장</button>
                <button @click="cancelEdit" class="px-3 py-1 text-zinc-400 text-xs hover:text-zinc-600 dark:hover:text-zinc-200">취소</button>
              </div>
            </div>
          </div>

          <!-- Actions (Hidden in Solo mode) -->
          <div v-if="!isSolo && !isSpoiler(group.position) && editingCommentId !== comment.id" class="flex items-center gap-4 mt-2.5">
            <button
              @click.stop="toggleLike(comment.id)"
              class="flex items-center gap-1 text-[10px] font-bold transition-colors"
              :class="comment.isLiked ? 'text-red-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
            >
              <Heart :size="12" :fill="comment.isLiked ? 'currentColor' : 'none'" />
              <span v-if="comment.likes">{{ comment.likes }}</span>
              <span v-else>좋아요</span>
            </button>

            <button
              @click.stop="toggleReplyForm(comment.id)"
              class="flex items-center gap-1 text-[10px] font-bold text-zinc-300 dark:text-zinc-600 hover:text-lime-500 transition-colors"
            >
              <MessageCircle :size="12" />
              답글
            </button>

            <div v-if="isOwnComment(comment)" class="flex items-center gap-3 ml-auto">
              <button @click.stop="startEdit(comment)" class="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">수정</button>
              <button @click.stop="confirmDelete(comment.id)" class="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors">삭제</button>
            </div>
          </div>

          <!-- Solo mode actions (Edit/Delete only) -->
          <div v-if="isSolo && !isSpoiler(group.position) && editingCommentId !== comment.id && isOwnComment(comment)" class="flex items-center gap-3 mt-2.5">
            <button @click.stop="startEdit(comment)" class="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">수정</button>
            <button @click.stop="confirmDelete(comment.id)" class="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors">삭제</button>
          </div>

          <!-- Reply Form (Hidden in Solo mode) -->
          <div v-if="!isSolo && activeReplyId === comment.id" class="mt-3 animate-fade-in">
            <div class="relative">
              <input
                v-model="replyContent"
                type="text"
                placeholder="답글을 남겨보세요..."
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white rounded-xl pl-3 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all border-none"
                @keyup.enter="submitReply(comment.id)"
                autoFocus
              />
              <button
                @click="submitReply(comment.id)"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-lime-600 hover:bg-lime-100 dark:hover:bg-lime-900/30 rounded-full transition-colors"
                :disabled="!replyContent"
              >
                <Send :size="14" />
              </button>
            </div>
          </div>

          <!-- Nested Replies (Limited Preview - Hidden in Solo mode) -->
          <div v-if="!isSolo && comment.replies && comment.replies.length > 0" class="mt-3 pl-3 border-l border-zinc-100 dark:border-zinc-800/50 space-y-4">
            <div v-for="reply in comment.replies.slice(0, 2)" :key="reply.id" class="relative group/reply">
              <!-- Reply User & Actions -->
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-1.5">
                  <Avatar
                    :src="reply.user?.avatar_url"
                    :fallback="reply.user?.nickname || '탈'"
                    size="xs"
                    :alt="reply.user?.nickname || '탈퇴한 사용자'"
                    className="w-4 h-4 shadow-xs opacity-80"
                  />
                  <span class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400" :class="{ 'italic font-medium opacity-70': !reply.user }">
                    {{ reply.user?.nickname || '탈퇴한 사용자' }}
                  </span>
                  <span class="text-[10px] text-zinc-300 dark:text-zinc-600">{{ formatDate(reply.created_at) }}</span>
                </div>
                
                <!-- Reply Actions (Edit/Delete) - Always visible for mobile -->
                <div v-if="isOwnReply(reply) && editingReplyId !== reply.id" class="flex items-center gap-2.5">
                  <button @click="startReplyEdit(reply)" class="text-[10px] font-bold text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">수정</button>
                  <button v-if="isOwnReply(reply)" @click="confirmDeleteReply(reply.id)" class="text-[10px] font-bold text-zinc-300 hover:text-red-400 transition-colors">삭제</button>
                </div>
              </div>

              <!-- Reply Content / Edit Mode -->
              <div class="pl-5">
                <div v-if="editingReplyId !== reply.id">
                  <p
                    class="text-[13px] text-zinc-500 dark:text-zinc-400 leading-snug break-words whitespace-pre-wrap"
                    :class="{
                      'blur-sm opacity-40 select-none pointer-events-none': isSpoiler(group.position)
                    }"
                  >{{ reply.content }}</p>

                  <!-- Reply Like Button (Added) -->
                  <div v-if="!isSpoiler(group.position)" class="flex items-center gap-3 mt-2">
                    <button
                      @click.stop="toggleLike(reply.id)"
                      class="flex items-center gap-1.5 text-[10px] font-bold transition-colors"
                      :class="reply.isLiked ? 'text-red-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
                    >
                      <Heart :size="12" :fill="reply.isLiked ? 'currentColor' : 'none'" />
                      <span v-if="reply.likes">{{ reply.likes }}</span>
                      <span v-else>좋아요</span>
                    </button>
                  </div>
                </div>

                <!-- Reply Edit Mode (Added) -->
                <div v-else class="mt-2">
                  <textarea
                    v-model="editReplyContent"
                    class="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-[13px] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 resize-none ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
                    rows="2"
                    @keydown.esc="cancelReplyEdit"
                  ></textarea>
                  <div class="flex gap-2 mt-2">
                    <button @click="saveReplyEdit(reply.id)" class="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded hover:opacity-90">저장</button>
                    <button @click="cancelReplyEdit" class="px-3 py-1 text-zinc-400 text-xs hover:text-zinc-600 dark:hover:text-zinc-200">취소</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Show More Replies Button -->
            <button
              v-if="comment.replies.length > 2"
              @click="openDetailModal(group)"
              class="text-[11px] font-bold text-lime-600 dark:text-lime-500 hover:underline pl-5 mt-1"
            >
              답글 {{ comment.replies.length - 2 }}개 더보기...
            </button>
          </div>
        </div>
      </div>

      <!-- "Show More" Button (Apple-style Subtle Button) -->
      <button
        v-if="group.hasMore"
        @click="openDetailModal(group)"
        class="mt-4 w-full py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center gap-1"
      >
        <span>{{ group.remainingCount }}개의 기록 더보기</span>
      </button>
    </div>

    <!-- Infinite Scroll Sentinel -->
    <div ref="sentinelElement" class="h-4"></div>

    <!-- Loading More Indicator -->
    <div v-if="isLoadingMore" class="flex justify-center py-8">
      <div class="flex items-center gap-2 text-zinc-500 dark:text-zinc-600 text-sm">
        <div class="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
        <span>댓글을 불러오는 중...</span>
      </div>
    </div>

    <!-- End of Comments -->
    <div v-else-if="!hasMore && comments.length > 0" class="text-center py-8 text-zinc-500 dark:text-zinc-600 text-sm">
      모든 댓글을 불러왔습니다
    </div>

    <!-- Empty State -->
    <div v-if="comments.length === 0 && !isLoadingMore" class="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div class="text-4xl mb-3">✍️</div>
      <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">아직 댓글이 없어요</h3>
      <p class="text-xs text-zinc-600 dark:text-zinc-500">첫 댓글을 남겨보세요!</p>
    </div>

    <!-- Comment Detail Modal -->
    <CommentDetailModal
      :isOpen="detailModalOpen"
      :anchorText="selectedGroup?.anchorText || ''"
      :position="selectedGroup?.position || 0"
      :comments="selectedGroup?.allComments || []"
      :currentUserId="currentUserId"
      @close="closeDetailModal"
      @writeComment="(data) => emit('writeComment', data)"
      @replySubmitted="emit('replySubmitted')"
    />

    <!-- Delete Comment Modal -->
    <ConfirmModal
      :isOpen="showDeleteCommentModal"
      title="댓글 삭제"
      message="이 댓글을 삭제하시겠습니까?"
      description="삭제한 댓글은 복구할 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      @confirm="executeDeleteComment"
      @cancel="cancelDeleteComment"
    />

    <!-- Delete Reply Modal -->
    <ConfirmModal
      :isOpen="showDeleteReplyModal"
      title="답글 삭제"
      message="이 답글을 삭제하시겠습니까?"
      description="삭제한 답글은 복구할 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      @confirm="executeDeleteReply"
      @cancel="cancelDeleteReply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Lock, Heart, MessageCircle, Send, Edit2, Trash2, ArrowUp } from 'lucide-vue-next'
import CommentDetailModal from './CommentDetailModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import Avatar from './Avatar.vue'
import { useToastStore } from '~/stores/toast'

interface User {
  nickname: string
  avatar_url?: string
}

interface Reply {
  id: string
  user: User
  user_id: string
  content: string
  created_at: string
  likes?: number
  isLiked?: boolean
}

interface Comment {
  id: string
  user: User
  user_id: string
  content: string
  anchor_text?: string
  position_pct: number
  created_at: string
  likes?: number
  isLiked?: boolean
  replies?: Reply[]
  parent_id?: string
  group_book_id?: string
}

const props = defineProps<{
  comments: Comment[]
  viewProgress: number
  currentUserId: string | null
  hasMore?: boolean
  isLoadingMore?: boolean
  highlightedCommentId?: string | null
  isFinished?: boolean
  isSolo?: boolean
}>()

const activeReplyId = ref<string | null>(null)
const replyContent = ref('')
const selectedGroupKey = ref<string | null>(null)
const detailModalOpen = computed(() => !!selectedGroupKey.value)

const selectedGroup = computed(() => {
  if (!selectedGroupKey.value) return null
  return groupedComments.value.find(g => g.key === selectedGroupKey.value) || null
})

// Edit state
const editingCommentId = ref<string | null>(null)
const editingReplyId = ref<string | null>(null)
const editContent = ref('')
const editReplyContent = ref('')

// Delete modal state
const showDeleteCommentModal = ref(false)
const showDeleteReplyModal = ref(false)
const deletingCommentId = ref<string | null>(null)
const deletingReplyId = ref<string | null>(null)

const client = useSupabaseClient()
const toast = useToastStore()

// Group comments by position and anchor_text
const groupedComments = computed(() => {
  const groups = new Map()

  // Only process top-level comments (no parent_id)
  const topLevelComments = props.comments.filter(c => !c.parent_id)

  topLevelComments.forEach(comment => {
    const positionKey = Math.round(comment.position_pct)
    const anchorKey = comment.anchor_text || 'no-anchor'
    const key = `${positionKey}_${anchorKey}`

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        position: comment.position_pct,
        anchorText: comment.anchor_text,
        comments: []
      })
    }

    groups.get(key).comments.push(comment)
  })

  // Convert to array and sort by position
  const groupArray = Array.from(groups.values()).map(group => {
    // Sort comments within group by likes (desc), then date (asc)
    const sortedComments = [...group.comments].sort((a, b) => {
      const likesA = a.likes || 0
      const likesB = b.likes || 0
      if (likesA !== likesB) {
        return likesB - likesA
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return {
      ...group,
      allComments: sortedComments,
      previewComments: sortedComments.slice(0, 2),
      totalCount: sortedComments.length,
      hasMore: sortedComments.length > 2,
      remainingCount: Math.max(0, sortedComments.length - 2)
    }
  })

  return groupArray.sort((a, b) => a.position - b.position)
})

const isSpoiler = (position: number) => {
  // Solo 모드는 스포일러 없음 (본인 기록만 있음)
  if (props.isSolo) return false

  // 완독한 경우 스포일러 잠금 해제
  if (props.isFinished) return false

  // Round both values to match the displayed percentage
  return Math.round(position) > Math.round(props.viewProgress)
}

const toggleLike = async (commentId: string) => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  try {
    let target = props.comments.find(c => c.id === commentId)

    if (!target) {
      for (const comment of props.comments) {
        if (comment.replies) {
          target = comment.replies.find(r => r.id === commentId)
          if (target) break
        }
      }
    }

    if (!target) return

    const { data: existingReaction } = await client
      .from('reactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .maybeSingle()

    if (existingReaction) {
      await client
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)

      target.isLiked = false
      target.likes = (target.likes || 1) - 1
    } else {
      await client
        .from('reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          type: 'like'
        })

      target.isLiked = true
      target.likes = (target.likes || 0) + 1
    }
  } catch (error) {
    console.error('Like toggle error:', error)
  }
}

const toggleReplyForm = (id: string) => {
  if (activeReplyId.value === id) {
    activeReplyId.value = null
    replyContent.value = ''
  } else {
    activeReplyId.value = id
  }
}

const emit = defineEmits(['replySubmitted', 'modalOpen', 'modalClose', 'writeComment', 'loadMore'])

const submitReply = async (parentId: string) => {
  if (!replyContent.value.trim()) return

  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  try {
    const parentComment = props.comments.find(c => c.id === parentId)
    if (!parentComment) return

    const { data: newReply, error } = await client
      .from('comments')
      .insert({
        group_book_id: parentComment.group_book_id,
        user_id: user.id,
        parent_id: parentId,
        content: replyContent.value,
        position_pct: Math.round(parentComment.position_pct)
      })
      .select('*, user:users(*)')
      .single()

    if (error) {
      console.error('Reply submit error:', error)
      throw error
    }

    if (!parentComment.replies) parentComment.replies = []
    parentComment.replies.push({
      id: newReply.id,
      user: newReply.user,
      user_id: user.id,
      content: newReply.content,
      created_at: newReply.created_at
    })

    activeReplyId.value = null
    replyContent.value = ''

    emit('replySubmitted')

  } catch (error) {
    console.error('Reply error:', error)
    toast.error('답글 작성에 실패했습니다.')
  }
}

const openDetailModal = (group: any) => {
  selectedGroupKey.value = group.key
  emit('modalOpen')
}

const closeDetailModal = () => {
  selectedGroupKey.value = null
  emit('modalClose')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

// Permission checks
const isOwnComment = (comment: Comment) => {
  return props.currentUserId && props.currentUserId === comment.user_id
}

const isOwnReply = (reply: Reply) => {
  return props.currentUserId && props.currentUserId === reply.user_id
}

// Comment edit functions
const startEdit = (comment: Comment) => {
  editingCommentId.value = comment.id
  editContent.value = comment.content
}

const saveEdit = async (commentId: string) => {
  if (!editContent.value.trim()) return

  try {
    const { error } = await client
      .from('comments')
      .update({ content: editContent.value })
      .eq('id', commentId)

    if (error) {
      console.error('Comment update error:', error)
      throw error
    }

    // Update local state
    const comment = props.comments.find(c => c.id === commentId)
    if (comment) {
      comment.content = editContent.value
    }

    // Exit edit mode
    editingCommentId.value = null
    editContent.value = ''
  } catch (error) {
    console.error('Save edit error:', error)
    toast.error('댓글 수정에 실패했습니다.')
  }
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

// Reply edit functions
const startReplyEdit = (reply: Reply) => {
  editingReplyId.value = reply.id
  editReplyContent.value = reply.content
}

const saveReplyEdit = async (replyId: string) => {
  if (!editReplyContent.value.trim()) return

  try {
    const { error } = await client
      .from('comments')
      .update({ content: editReplyContent.value })
      .eq('id', replyId)

    if (error) {
      console.error('Reply update error:', error)
      throw error
    }

    // Update local state
    for (const comment of props.comments) {
      if (comment.replies) {
        const reply = comment.replies.find(r => r.id === replyId)
        if (reply) {
          reply.content = editReplyContent.value
          break
        }
      }
    }

    // Exit edit mode
    editingReplyId.value = null
    editReplyContent.value = ''
  } catch (error) {
    console.error('Save reply edit error:', error)
    toast.error('답글 수정에 실패했습니다.')
  }
}

const cancelReplyEdit = () => {
  editingReplyId.value = null
  editReplyContent.value = ''
}

// Delete functions
const confirmDelete = (commentId: string) => {
  deletingCommentId.value = commentId
  showDeleteCommentModal.value = true
}

const executeDeleteComment = async () => {
  if (!deletingCommentId.value) return

  try {
    const { error } = await client
      .from('comments')
      .delete()
      .eq('id', deletingCommentId.value)

    if (error) {
      console.error('Comment delete error:', error)
      throw error
    }

    // Remove from local state
    const index = props.comments.findIndex(c => c.id === deletingCommentId.value)
    if (index !== -1) {
      props.comments.splice(index, 1)
    }

    toast.success('댓글이 삭제되었습니다.')
  } catch (error) {
    console.error('Delete error:', error)
    toast.error('댓글 삭제에 실패했습니다.')
  } finally {
    showDeleteCommentModal.value = false
    deletingCommentId.value = null
  }
}

const cancelDeleteComment = () => {
  showDeleteCommentModal.value = false
  deletingCommentId.value = null
}

const confirmDeleteReply = (replyId: string) => {
  deletingReplyId.value = replyId
  showDeleteReplyModal.value = true
}

const executeDeleteReply = async () => {
  if (!deletingReplyId.value) return

  try {
    const { error } = await client
      .from('comments')
      .delete()
      .eq('id', deletingReplyId.value)

    if (error) {
      console.error('Reply delete error:', error)
      throw error
    }

    // Remove from local state
    for (const comment of props.comments) {
      if (comment.replies) {
        const index = comment.replies.findIndex(r => r.id === deletingReplyId.value)
        if (index !== -1) {
          comment.replies.splice(index, 1)
          break
        }
      }
    }

    toast.success('답글이 삭제되었습니다.')
  } catch (error) {
    console.error('Delete reply error:', error)
    toast.error('답글 삭제에 실패했습니다.')
  } finally {
    showDeleteReplyModal.value = false
    deletingReplyId.value = null
  }
}

const cancelDeleteReply = () => {
  showDeleteReplyModal.value = false
  deletingReplyId.value = null
}

// Infinite scroll logic
const sentinelElement = ref<HTMLElement | null>(null)
const observer = ref<IntersectionObserver | null>(null)

onMounted(() => {
  if (!sentinelElement.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && props.hasMore && !props.isLoadingMore) {
        emit('loadMore')
      }
    },
    {
      root: null,
      rootMargin: '200px', // Start loading 200px before reaching the bottom
      threshold: 0
    }
  )

  observer.value.observe(sentinelElement.value)
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
})
</script>