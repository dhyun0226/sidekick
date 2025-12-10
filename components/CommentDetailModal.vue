<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-[480px] h-[85vh] bg-zinc-900 border-t sm:border sm:border-zinc-800 sm:rounded-2xl flex flex-col animate-slide-up">

      <!-- Header -->
      <div class="flex-shrink-0 border-b border-zinc-800 p-4">
        <div class="flex items-center gap-3 mb-3">
          <button @click="$emit('close')" class="text-zinc-400 hover:text-white">
            <ChevronLeft :size="20" />
          </button>
          <div class="flex items-center gap-2">
            <span class="text-xs text-lime-400 font-mono font-bold">{{ Math.round(position) }}%</span>
            <span class="text-xs text-zinc-600">·</span>
            <span class="text-xs text-zinc-400">{{ comments.length }}개 댓글</span>
          </div>
        </div>

        <!-- Anchor Text (Quote) -->
        <div
          v-if="anchorText"
          class="font-serif italic text-lime-400/90 text-sm leading-relaxed px-3 py-2 bg-zinc-800/50 rounded-lg border-l-2 border-lime-400/50"
        >
          "{{ anchorText }}"
        </div>
      </div>

      <!-- Comments List (Scrollable) -->
      <div class="flex-1 overflow-y-auto px-4 py-4 pb-4 space-y-4">
        <div
          v-for="comment in sortedComments"
          :key="comment.id"
          class="pb-4 border-b border-zinc-800/50 last:border-b-0"
        >
          <!-- User Info -->
          <div class="flex items-center space-x-2 mb-2">
            <div class="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden">
              <img v-if="comment.user?.avatar_url" :src="comment.user.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">?</div>
            </div>
            <span class="text-xs text-zinc-400 font-medium">{{ comment.user?.nickname || 'Unknown' }}</span>
            <span class="text-[10px] text-zinc-600">{{ formatDate(comment.created_at) }}</span>
          </div>

          <!-- Content -->
          <div class="rounded-xl bg-zinc-900 text-zinc-200 text-sm leading-relaxed mb-2">
            {{ comment.content }}
          </div>

          <!-- Actions (Like & Reply) -->
          <div class="flex items-center gap-4">
            <button
              @click.stop="toggleLike(comment.id)"
              class="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
              :class="{ 'text-red-400': comment.isLiked }"
            >
              <Heart :size="14" :fill="comment.isLiked ? 'currentColor' : 'none'" />
              <span>{{ comment.likes || 0 }}</span>
            </button>

            <button
              @click.stop="toggleReplyForm(comment.id)"
              class="flex items-center gap-1 text-xs text-zinc-500 hover:text-lime-400 transition-colors"
            >
              <MessageCircle :size="14" />
              <span>답글</span>
            </button>
          </div>

          <!-- Reply Form -->
          <div v-if="activeReplyId === comment.id" class="mt-3 flex gap-2 animate-fade-in">
            <input
              v-model="replyContent"
              type="text"
              placeholder="답글을 입력하세요..."
              class="flex-1 bg-zinc-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-lime-400"
              @keyup.enter="submitReply(comment.id)"
            />
            <button @click="submitReply(comment.id)" class="text-lime-400 hover:text-lime-300">
              <Send :size="16" />
            </button>
          </div>

          <!-- Nested Replies -->
          <div v-if="comment.replies && comment.replies.length > 0" class="mt-3 ml-4 space-y-2 border-l-2 border-zinc-800 pl-3">
            <div v-for="reply in comment.replies" :key="reply.id" class="text-sm">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-zinc-400 font-bold">{{ reply.user.nickname }}</span>
                <span class="text-[10px] text-zinc-600">{{ formatDate(reply.created_at) }}</span>
              </div>
              <p class="text-zinc-300 text-xs">{{ reply.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Write Button (Footer) - Same style as main slider -->
      <div class="flex-shrink-0 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
        <div class="flex justify-end">
          <button
            @click="handleWriteComment"
            class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lime-400 hover:bg-zinc-700 transition-colors"
            title="이 문장에 댓글 남기기"
          >
            <PenLine :size="20" />
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, Heart, MessageCircle, Send, PenLine } from 'lucide-vue-next'

interface User {
  nickname: string
  avatar_url?: string
}

interface Reply {
  id: string
  user: User
  content: string
  created_at: string
}

interface Comment {
  id: string
  user: User
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
}>()

const emit = defineEmits(['close', 'writeComment'])

const activeReplyId = ref<string | null>(null)
const replyContent = ref('')

const client = useSupabaseClient()

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
        position_pct: parentComment.position_pct
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
      content: newReply.content,
      created_at: newReply.created_at
    })

    activeReplyId.value = null
    replyContent.value = ''

  } catch (error) {
    console.error('Reply error:', error)
    alert('답글 작성에 실패했습니다.')
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
