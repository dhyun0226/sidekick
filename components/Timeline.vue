<template>
  <div class="flex flex-col space-y-6 pb-32 px-4 pt-4">
    <div
      v-for="group in groupedComments"
      :key="group.key"
      :data-position="Math.round(group.position)"
      class="relative pl-4 border-l-2 border-zinc-300 dark:border-zinc-800"
    >
      <!-- Position Badge -->
      <div class="flex items-center gap-2 mb-2">
        <div class="flex items-center gap-1 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full border border-zinc-300 dark:border-zinc-700">
          <span class="text-[10px] text-lime-400 font-mono font-bold">{{ Math.round(group.position) }}%</span>
        </div>
        <span class="text-[10px] text-zinc-500 dark:text-zinc-600">{{ group.totalCount }}개 댓글</span>
      </div>

      <!-- Anchor Text (Quote) -->
      <div
        v-if="group.anchorText"
        class="mb-3 font-serif italic text-lime-400/90 text-sm leading-relaxed transition-all duration-300 px-3 py-2 bg-lime-100 dark:bg-zinc-800/30 rounded-lg border-l-2 border-lime-400/50"
        :class="{ 'blur-sm opacity-40 select-none': isSpoiler(group.position) }"
      >
        "{{ group.anchorText }}"
      </div>

      <!-- Preview Comments (Top 2) -->
      <div class="space-y-3">
        <div
          v-for="comment in group.previewComments"
          :key="comment.id"
          class="rounded-xl bg-white dark:bg-zinc-900 p-3 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed transition-all duration-300"
          :class="{ 'ring-2 ring-lime-400 bg-lime-50 dark:bg-lime-900/20': highlightedCommentId === comment.id }"
        >
          <!-- Spoiler Badge (Small, Top-Right) -->
          <div
            v-if="isSpoiler(group.position)"
            class="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-zinc-200 dark:bg-zinc-800/95 backdrop-blur-sm rounded-full border border-zinc-300 dark:border-zinc-700/50 z-10"
          >
            <Lock :size="10" />
            <span class="text-[10px] text-zinc-600 dark:text-zinc-500 font-medium">스포일러</span>
          </div>

          <!-- User Info -->
          <div class="flex items-center space-x-2 mb-2">
            <Avatar
              :src="comment.user?.avatar_url"
              :fallback="comment.user?.nickname || 'U'"
              size="xs"
              :alt="comment.user?.nickname"
            />
            <span class="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{{ comment.user?.nickname || 'Unknown' }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-600">{{ formatDate(comment.created_at) }}</span>
          </div>

          <!-- Content (View Mode) -->
          <div
            v-if="editingCommentId !== comment.id"
            class="transition-all duration-300 mb-2"
            :class="{
              'blur-sm opacity-40 select-none pointer-events-none': isSpoiler(group.position)
            }"
          >
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
                class="px-3 py-1 bg-lime-400 text-black text-xs font-medium rounded-lg hover:bg-lime-300"
              >
                저장
              </button>
              <button
                @click="cancelEdit"
                class="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                취소
              </button>
            </div>
          </div>

          <!-- Actions (Like & Reply & Edit & Delete) - Hidden if spoiler or editing -->
          <div v-if="!isSpoiler(group.position) && editingCommentId !== comment.id" class="flex items-center gap-4">
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

          <!-- Nested Replies Preview (if any) -->
          <div v-if="comment.replies && comment.replies.length > 0" class="mt-2 ml-2 border-l-2 border-zinc-300 dark:border-zinc-800 pl-3">
            <div class="text-sm">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-zinc-600 dark:text-zinc-400 font-bold">{{ comment.replies[0].user.nickname }}</span>
                <span class="text-[10px] text-zinc-500 dark:text-zinc-600">{{ formatDate(comment.replies[0].created_at) }}</span>
              </div>

              <!-- Reply Content (View Mode) -->
              <p v-if="editingReplyId !== comment.replies[0].id" class="text-zinc-700 dark:text-zinc-300 text-xs mb-1">
                {{ comment.replies[0].content }}
              </p>

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
                    @click="saveReplyEdit(comment.replies[0].id)"
                    class="px-2 py-1 bg-lime-400 text-black text-[10px] font-medium rounded hover:bg-lime-300"
                  >
                    저장
                  </button>
                  <button
                    @click="cancelReplyEdit"
                    class="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white text-[10px] font-medium rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    취소
                  </button>
                </div>
              </div>

              <!-- Reply Actions -->
              <div v-if="editingReplyId !== comment.replies[0].id && isOwnReply(comment.replies[0])" class="flex items-center gap-3 mt-1">
                <button
                  @click="startReplyEdit(comment.replies[0])"
                  class="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-500 hover:text-blue-400 transition-colors"
                >
                  <Edit2 :size="12" />
                  <span>수정</span>
                </button>
                <button
                  @click="confirmDeleteReply(comment.replies[0].id)"
                  class="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 :size="12" />
                  <span>삭제</span>
                </button>
              </div>

              <div v-if="comment.replies.length > 1" class="text-[10px] text-zinc-600 dark:text-zinc-500 mt-1">
                +{{ comment.replies.length - 1 }}개 답글
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- "더보기" Button -->
      <button
        v-if="group.hasMore"
        @click="openDetailModal(group)"
        class="mt-3 w-full py-2 text-xs text-zinc-600 dark:text-zinc-500 hover:text-lime-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-1"
      >
        <span>+{{ group.remainingCount }}개 더보기</span>
      </button>

      <!-- Progress Indicator Dot -->
      <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-gray-50 dark:border-[#09090b]"></div>
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
import { Lock, Heart, MessageCircle, Send, Edit2, Trash2 } from 'lucide-vue-next'
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
}>()

const activeReplyId = ref<string | null>(null)
const replyContent = ref('')
const detailModalOpen = ref(false)
const selectedGroup = ref<any>(null)

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
  // Round both values to match the displayed percentage
  return Math.round(position) > Math.round(props.viewProgress)
}

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

const emit = defineEmits(['replySubmitted', 'modalOpen', 'modalClose', 'writeComment', 'loadMore'])

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

    emit('replySubmitted')

  } catch (error) {
    console.error('Reply error:', error)
    toast.error('답글 작성에 실패했습니다.')
  }
}

const openDetailModal = (group: any) => {
  selectedGroup.value = group
  detailModalOpen.value = true
  emit('modalOpen')
}

const closeDetailModal = () => {
  detailModalOpen.value = false
  selectedGroup.value = null
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
