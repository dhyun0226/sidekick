<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-[480px] h-[85vh] bg-white dark:bg-zinc-900 border-t sm:border border-zinc-300 dark:border-zinc-800 sm:rounded-2xl flex flex-col animate-slide-up">

      <!-- Header -->
      <div class="flex-shrink-0 border-b border-zinc-300 dark:border-zinc-800 p-4">
        <div class="flex items-center gap-3 mb-3">
          <button @click="$emit('close')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <ChevronLeft :size="20" />
          </button>
          <div class="flex items-center gap-2">
            <span class="text-xs text-lime-400 font-mono font-bold">{{ Math.round(position) }}%</span>
            <span class="text-xs text-zinc-500 dark:text-zinc-600">·</span>
            <span class="text-xs text-zinc-600 dark:text-zinc-400">{{ comments.length }}개 댓글</span>
          </div>
        </div>

        <!-- Anchor Text (Quote) -->
        <div
          v-if="anchorText"
          class="font-serif italic text-lime-400/90 text-sm leading-relaxed px-3 py-2 bg-lime-100 dark:bg-zinc-800/50 rounded-lg border-l-2 border-lime-400/50"
        >
          {{ anchorText }}
        </div>
      </div>

      <!-- Comments List (Scrollable) -->
      <div class="flex-1 overflow-y-auto px-4 py-4 pb-4 space-y-4">
        <div
          v-for="comment in sortedComments"
          :key="comment.id"
          class="pb-4 border-b border-zinc-300 dark:border-zinc-800/50 last:border-b-0"
        >
          <!-- User Info -->
          <div class="flex items-center space-x-2 mb-2">
            <div class="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <img v-if="comment.user?.avatar_url" :src="comment.user.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 dark:text-zinc-400">?</div>
            </div>
            <span class="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{{ comment.user?.nickname || 'Unknown' }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-600">{{ formatDate(comment.created_at) }}</span>
          </div>

          <!-- Content (View Mode) -->
          <div v-if="editingCommentId !== comment.id" class="rounded-xl bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed mb-2">
            {{ comment.content }}
          </div>

          <!-- Content (Edit Mode) -->
          <div v-else class="mb-2">
            <textarea
              v-model="editContent"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
              rows="3"
              @keydown.esc="cancelEdit"
            ></textarea>
            <div class="flex gap-2 mt-2">
              <button
                @click="saveEdit(comment.id)"
                class="px-3 py-1.5 bg-lime-400 text-black text-xs font-medium rounded-lg hover:bg-lime-300"
              >
                저장
              </button>
              <button
                @click="cancelEdit"
                class="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                취소
              </button>
            </div>
          </div>

          <!-- Actions (Like & Reply & Edit & Delete) -->
          <div v-if="editingCommentId !== comment.id" class="flex items-center gap-4">
            <button
              @click.stop="toggleLike(comment.id)"
              class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-500 hover:text-red-400 transition-colors"
              :class="{ 'text-red-400': comment.isLiked }"
            >
              <Heart :size="14" :fill="comment.isLiked ? 'currentColor' : 'none'" />
              <span>{{ comment.likes || 0 }}</span>
            </button>

            <button
              @click.stop="toggleReplyForm(comment.id)"
              class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-500 hover:text-lime-400 transition-colors"
            >
              <MessageCircle :size="14" />
              <span>답글</span>
            </button>

            <button
              v-if="isOwnComment(comment)"
              @click.stop="startEdit(comment)"
              class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-500 hover:text-blue-400 transition-colors"
            >
              <Edit2 :size="14" />
              <span>수정</span>
            </button>

            <button
              v-if="isOwnComment(comment)"
              @click.stop="confirmDelete(comment.id)"
              class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 :size="14" />
              <span>삭제</span>
            </button>
          </div>

          <!-- Reply Form -->
          <div v-if="activeReplyId === comment.id" class="mt-3 flex gap-2 animate-fade-in">
            <input
              v-model="replyContent"
              type="text"
              placeholder="답글을 입력하세요..."
              class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-lime-400"
              @keyup.enter="submitReply(comment.id)"
            />
            <button @click="submitReply(comment.id)" class="text-lime-400 hover:text-lime-300">
              <Send :size="16" />
            </button>
          </div>

          <!-- Nested Replies -->
          <div v-if="comment.replies && comment.replies.length > 0" class="mt-3 ml-4 space-y-3 border-l-2 border-zinc-300 dark:border-zinc-800 pl-3">
            <div v-for="reply in comment.replies" :key="reply.id" class="text-sm">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-zinc-600 dark:text-zinc-400 font-bold">{{ reply.user.nickname }}</span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-600">{{ formatDate(reply.created_at) }}</span>
              </div>

              <!-- Reply Content (View Mode) -->
              <p v-if="editingReplyId !== reply.id" class="text-zinc-700 dark:text-zinc-300 text-xs mb-1">{{ reply.content }}</p>

              <!-- Reply Content (Edit Mode) -->
              <div v-else class="mb-2">
                <textarea
                  v-model="editReplyContent"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
                  rows="2"
                  @keydown.esc="cancelReplyEdit"
                ></textarea>
                <div class="flex gap-2 mt-2">
                  <button
                    @click="saveReplyEdit(reply.id)"
                    class="px-2 py-1 bg-lime-400 text-black text-xs font-medium rounded hover:bg-lime-300"
                  >
                    저장
                  </button>
                  <button
                    @click="cancelReplyEdit"
                    class="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-medium rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    취소
                  </button>
                </div>
              </div>

              <!-- Reply Actions -->
              <div v-if="editingReplyId !== reply.id && isOwnReply(reply)" class="flex items-center gap-3 mt-1">
                <button
                  @click="startReplyEdit(reply)"
                  class="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-500 hover:text-blue-400 transition-colors"
                >
                  <Edit2 :size="12" />
                  <span>수정</span>
                </button>
                <button
                  @click="confirmDeleteReply(reply.id)"
                  class="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 :size="12" />
                  <span>삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Write Button (Footer) - Same style as main slider -->
      <div class="flex-shrink-0 border-t border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
        <div class="flex justify-end">
          <button
            @click="handleWriteComment"
            class="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-lime-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            title="이 문장에 댓글 남기기"
          >
            <PenLine :size="20" />
          </button>
        </div>
      </div>

    </div>

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
import { ref, computed } from 'vue'
import { ChevronLeft, Heart, MessageCircle, Send, PenLine, Edit2, Trash2 } from 'lucide-vue-next'
import ConfirmModal from './ConfirmModal.vue'
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
}

interface Comment {
  id: string
  user: User
  user_id: string
  content: string
  position_pct: number
  created_at: string
  likes?: number
  isLiked?: boolean
  replies?: Reply[]
  group_book_id?: string
}

const props = defineProps<{
  isOpen: boolean
  anchorText: string
  position: number
  comments: Comment[]
  currentUserId: string | null
}>()

const emit = defineEmits(['close', 'writeComment'])

const activeReplyId = ref<string | null>(null)
const replyContent = ref('')

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

// Sort comments by likes, then by date
const sortedComments = computed(() => {
  return [...props.comments].sort((a, b) => {
    const likesA = a.likes || 0
    const likesB = b.likes || 0
    if (likesA !== likesB) {
      return likesB - likesA // Descending by likes
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime() // Ascending by date
  })
})

const toggleLike = async (commentId: string) => {
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  try {
    const comment = props.comments.find(c => c.id === commentId)
    if (!comment) return

    const { data: existingReaction } = await client
      .from('reactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', currentUser.id)
      .eq('type', 'like')
      .maybeSingle()

    if (existingReaction) {
      await client
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)

      comment.isLiked = false
      comment.likes = (comment.likes || 1) - 1
    } else {
      await client
        .from('reactions')
        .insert({
          comment_id: commentId,
          user_id: currentUser.id,
          type: 'like'
        })

      comment.isLiked = true
      comment.likes = (comment.likes || 0) + 1
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

const submitReply = async (parentId: string) => {
  if (!replyContent.value.trim()) return

  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  try {
    const parentComment = props.comments.find(c => c.id === parentId)
    if (!parentComment) return

    const { data: newReply, error } = await client
      .from('comments')
      .insert({
        group_book_id: parentComment.group_book_id,
        user_id: currentUser.id,
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

    // UI 업데이트
    if (!parentComment.replies) parentComment.replies = []
    parentComment.replies.push({
      id: newReply.id,
      user: newReply.user,
      user_id: currentUser.id,
      content: newReply.content,
      created_at: newReply.created_at
    })

    activeReplyId.value = null
    replyContent.value = ''

  } catch (error) {
    console.error('Reply error:', error)
    toast.error('답글 작성에 실패했습니다.')
  }
}

const handleWriteComment = () => {
  // Emit event to parent with anchor_text and position
  emit('writeComment', {
    anchorText: props.anchorText,
    position: props.position
  })
  // Keep modal open - user stays in context
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
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
