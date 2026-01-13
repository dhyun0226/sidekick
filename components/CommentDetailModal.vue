<template>
  <div v-if="isOpen" class="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-[480px] h-[85vh] bg-white dark:bg-zinc-900 border-t sm:border border-zinc-300 dark:border-zinc-800 sm:rounded-3xl flex flex-col animate-slide-up shadow-2xl overflow-hidden">

      <!-- Header -->
      <div class="flex-shrink-0 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <button @click="$emit('close')" class="p-1 -ml-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ChevronLeft :size="24" />
            </button>
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-black text-lime-600 dark:text-lime-500">{{ Math.round(position) }}%</span>
              <span class="text-xs text-zinc-400 font-bold uppercase tracking-wider">{{ comments.length }}개의 기록</span>
            </div>
          </div>
        </div>

        <!-- Anchor Text (Quote Style) -->
        <div v-if="anchorText" class="pl-4 border-l-[3px] border-lime-400">
          <p class="font-serif text-[15px] text-zinc-600 dark:text-zinc-400 italic leading-relaxed line-clamp-2">
            {{ anchorText }}
          </p>
        </div>
      </div>

      <!-- Comments List (Scrollable) -->
      <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
        <div
          v-for="comment in sortedComments"
          :key="comment.id"
          class="relative group"
        >
          <!-- User & Date -->
          <div class="flex items-center gap-2 mb-2">
            <Avatar
              :src="comment.user?.avatar_url"
              :fallback="comment.user?.nickname || 'U'"
              size="xs"
              :alt="comment.user?.nickname"
              className="w-6 h-6 shadow-sm"
            />
            <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100">{{ comment.user?.nickname }}</span>
            <span class="text-[10px] text-zinc-400 dark:text-zinc-600">{{ formatDate(comment.created_at) }}</span>
          </div>

          <!-- Content -->
          <div class="text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
            <div v-if="editingCommentId !== comment.id">
              {{ comment.content }}
            </div>
            
            <!-- Edit Mode -->
            <div v-else class="mt-2">
              <textarea
                v-model="editContent"
                class="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none border border-zinc-200 dark:border-zinc-700"
                rows="3"
                @keydown.esc="cancelEdit"
              ></textarea>
              <div class="flex gap-2 mt-2 justify-end">
                <button @click="cancelEdit" class="px-3 py-1.5 text-zinc-400 text-xs font-bold hover:text-zinc-600">취소</button>
                <button @click="saveEdit(comment.id)" class="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-full">저장</button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="editingCommentId !== comment.id" class="flex items-center gap-4 mt-3">
            <button
              @click.stop="toggleLike(comment.id)"
              class="flex items-center gap-1.5 text-[11px] font-bold transition-colors"
              :class="comment.isLiked ? 'text-red-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
            >
              <Heart :size="14" :fill="comment.isLiked ? 'currentColor' : 'none'" />
              <span v-if="comment.likes">{{ comment.likes }}</span>
              <span v-else>좋아요</span>
            </button>

            <button
              @click.stop="toggleReplyForm(comment.id)"
              class="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300 dark:text-zinc-600 hover:text-lime-500 transition-colors"
            >
              <MessageCircle :size="14" />
              답글
            </button>

            <div v-if="isOwnComment(comment)" class="flex items-center gap-3 ml-auto">
              <button @click.stop="startEdit(comment)" class="text-[11px] font-bold text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-200">수정</button>
              <button @click.stop="confirmDelete(comment.id)" class="text-[11px] font-bold text-zinc-300 hover:text-red-500">삭제</button>
            </div>
          </div>

          <!-- Reply Form -->
          <div v-if="activeReplyId === comment.id" class="mt-4 animate-fade-in">
            <div class="relative">
              <input
                v-model="replyContent"
                type="text"
                placeholder="답글 남기기..."
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-lime-400/50 border-none transition-all"
                @keyup.enter="submitReply(comment.id)"
                autoFocus
              />
              <button 
                @click="submitReply(comment.id)" 
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-lime-400 text-black rounded-full shadow-sm"
                :disabled="!replyContent"
              >
                <ArrowUp :size="14" />
              </button>
            </div>
          </div>

          <!-- Nested Replies (Ensured visibility) -->
          <div v-if="comment.replies && comment.replies.length > 0" class="mt-6 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-6">
            <div v-for="reply in comment.replies" :key="reply.id" class="relative group/reply">
              <!-- Reply User & Date -->
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Avatar
                    :src="reply.user?.avatar_url"
                    :fallback="reply.user?.nickname || 'U'"
                    size="xs"
                    className="w-5 h-5"
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-zinc-600 dark:text-zinc-400">{{ reply.user?.nickname || '알 수 없는 사용자' }}</span>
                    <span class="text-[10px] text-zinc-400">{{ formatDate(reply.created_at) }}</span>
                  </div>
                </div>
                
                <!-- Reply Actions (Edit/Delete) - Always visible for mobile -->
                <div v-if="(reply.user_id === currentUserId) && editingReplyId !== reply.id" class="flex items-center gap-2.5">
                  <button @click="startReplyEdit(reply)" class="text-[10px] font-bold text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">수정</button>
                  <button @click="confirmDeleteReply(reply.id)" class="text-[10px] font-bold text-zinc-300 hover:text-red-500 transition-colors">삭제</button>
                </div>
              </div>

              <!-- Reply Content / Edit Mode -->
              <div class="pl-7">
                <div v-if="editingReplyId !== reply.id">
                  <p class="text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{{ reply.content }}</p>
                  
                  <!-- Reply Like Button (Ensured visibility) -->
                  <div class="flex items-center gap-3 mt-2">
                    <button
                      @click.stop="toggleLike(reply.id)"
                      class="flex items-center gap-1.5 text-[10px] font-bold transition-colors"
                      :class="reply.isLiked ? 'text-red-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
                    >
                      <Heart :size="12" :fill="reply.isLiked ? 'currentColor' : 'none'" />
                      <span>{{ reply.likes || '좋아요' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Reply Edit Mode -->
                <div v-else class="mt-2">
                  <textarea
                    v-model="editReplyContent"
                    class="w-full bg-zinc-50 dark:bg-zinc-800 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none border border-zinc-200 dark:border-zinc-700"
                    rows="2"
                  ></textarea>
                  <div class="flex gap-2 mt-2 justify-end">
                    <button @click="cancelReplyEdit" class="px-2 py-1 text-zinc-400 text-[10px] font-bold">취소</button>
                    <button @click="saveReplyEdit(reply.id)" class="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold rounded-full">저장</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer: Write Button (Apple Style) -->
      <div class="flex-shrink-0 px-6 py-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800">
        <button
          @click="handleWriteComment"
          class="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-zinc-500/20"
        >
          <PenLine :size="18" />
          <span>기록 남기기</span>
        </button>
      </div>

    </div>

    <!-- Modals -->
    <ConfirmModal
      :isOpen="showDeleteCommentModal"
      title="기록 삭제"
      message="이 기록을 정말 삭제하시겠습니까?"
      description="삭제 후에는 복구할 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      @confirm="executeDeleteComment"
      @cancel="cancelDeleteComment"
    />

    <ConfirmModal
      :isOpen="showDeleteReplyModal"
      title="답글 삭제"
      message="이 답글을 정말 삭제하시겠습니까?"
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      @confirm="executeDeleteReply"
      @cancel="cancelDeleteReply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, Heart, MessageCircle, Send, PenLine, Edit2, Trash2, ArrowUp } from 'lucide-vue-next'
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

// Prevent body scroll when modal is open
watch(() => props.isOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

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
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  try {
    // 1. Find the target (could be a comment or a reply)
    let target: Comment | Reply | undefined = props.comments.find(c => c.id === commentId)
    
    // 2. If not found in comments, search in replies
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

    // UI 업데이트
    if (!parentComment.replies) parentComment.replies = []
    parentComment.replies.push({
      id: newReply.id,
      user: newReply.user,
      user_id: user.id,
      content: newReply.content,
      created_at: newReply.created_at,
      likes: 0,
      isLiked: false
    })

    activeReplyId.value = null
    replyContent.value = ''

    // 🎯 Notify parent that a reply was submitted to refresh data
    emit('replySubmitted')
    toast.success('답글이 등록되었습니다! 🎉')

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

.animate-in {
  animation: fade-in 0.3s ease-out;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3f3f46;
}
</style>