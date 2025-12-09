<template>
  <div class="flex flex-col space-y-6 pb-32 px-4 pt-4">
    <div 
      v-for="comment in comments" 
      :key="comment.id" 
      class="relative pl-4 border-l-2 border-zinc-800"
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

      <!-- Anchor Text (Quote) -->
      <div v-if="comment.anchor_text" class="mb-2 font-serif italic text-lime-400/90 text-sm leading-relaxed">
        "{{ comment.anchor_text }}"
      </div>

      <!-- Content (Spoiler Protected) -->
      <div 
        class="relative rounded-xl bg-zinc-900 p-3 text-zinc-200 text-sm leading-relaxed transition-all duration-300"
        :class="{ 'cursor-pointer hover:bg-zinc-800': isSpoiler(comment) }"
        @click="toggleSpoiler(comment.id)"
      >
        <!-- Spoiler Overlay -->
        <div 
          v-if="isSpoiler(comment) && !revealed[comment.id]" 
          class="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl z-10"
        >
          <div class="flex flex-col items-center text-zinc-500">
            <Lock :size="20" />
            <span class="text-xs mt-1 font-medium">Spoiler ({{ Math.round(comment.position_pct) }}%)</span>
          </div>
        </div>

        <!-- Actual Content -->
        <div :class="{ 'opacity-20 blur-sm': isSpoiler(comment) && !revealed[comment.id] }">
          {{ comment.content }}
        </div>

        <!-- Actions (Like & Reply) -->
        <div v-if="!isSpoiler(comment) || revealed[comment.id]" class="mt-3 flex items-center gap-4">
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
      </div>
      
      <!-- Nested Replies -->
      <div v-if="comment.replies && comment.replies.length > 0" class="mt-2 ml-2 space-y-2 border-l border-zinc-800 pl-3">
        <div v-for="reply in comment.replies" :key="reply.id" class="text-sm">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-zinc-400 font-bold">{{ reply.user.nickname }}</span>
            <span class="text-[10px] text-zinc-600">{{ formatDate(reply.created_at) }}</span>
          </div>
          <p class="text-zinc-300 text-xs">{{ reply.content }}</p>
        </div>
      </div>

      <!-- Progress Indicator -->
      <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-[#09090b]"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lock, Heart, MessageCircle, Send } from 'lucide-vue-next'

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
  anchor_text?: string
  position_pct: number
  created_at: string
  likes?: number
  isLiked?: boolean
  replies?: Reply[]
}

const props = defineProps<{
  comments: Comment[]
  readProgress: number
}>()

const revealed = ref<Record<string, boolean>>({})
const activeReplyId = ref<string | null>(null)
const replyContent = ref('')

const isSpoiler = (comment: Comment) => {
  return comment.position_pct > props.readProgress
}

const toggleSpoiler = (id: string) => {
  if (revealed.value[id]) {
    revealed.value[id] = false
  } else {
    revealed.value[id] = true
  }
}

const client = useSupabaseClient()
const user = useSupabaseUser()

const toggleLike = async (commentId: string) => {
  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  try {
    const comment = props.comments.find(c => c.id === commentId)
    if (!comment) return

    // 이미 좋아요를 눌렀는지 확인
    const { data: existingReaction } = await client
      .from('reactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', currentUser.id)
      .eq('type', 'like')
      .maybeSingle()

    if (existingReaction) {
      // 좋아요 취소
      await client
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)

      comment.isLiked = false
      comment.likes = (comment.likes || 1) - 1
    } else {
      // 좋아요 추가
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

const emit = defineEmits(['replySubmitted'])

const submitReply = async (parentId: string) => {
  if (!replyContent.value.trim()) return

  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  try {
    const parentComment = props.comments.find(c => c.id === parentId)
    if (!parentComment) return

    // 대댓글 작성
    const { data: newReply, error } = await client
      .from('comments')
      .insert({
        group_book_id: parentComment.group_book_id,
        user_id: currentUser.id,
        parent_id: parentId,
        content: replyContent.value,
        position_pct: parentComment.position_pct // 부모 댓글과 같은 위치
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

    emit('replySubmitted')

  } catch (error) {
    console.error('Reply error:', error)
    alert('답글 작성에 실패했습니다.')
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}
</script>
