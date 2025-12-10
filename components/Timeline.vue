<template>
  <div class="flex flex-col space-y-6 pb-32 px-4 pt-4">
    <div
      v-for="group in groupedComments"
      :key="group.key"
      :data-position="Math.round(group.position)"
      class="relative pl-4 border-l-2 border-zinc-800"
    >
      <!-- Position Badge -->
      <div class="flex items-center gap-2 mb-2">
        <div class="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded-full border border-zinc-700">
          <span class="text-[10px] text-lime-400 font-mono font-bold">{{ Math.round(group.position) }}%</span>
        </div>
        <span class="text-[10px] text-zinc-600">{{ group.totalCount }}개 댓글</span>
      </div>

      <!-- Anchor Text (Quote) -->
      <div
        v-if="group.anchorText"
        class="mb-3 font-serif italic text-lime-400/90 text-sm leading-relaxed transition-all duration-300 px-3 py-2 bg-zinc-800/30 rounded-lg border-l-2 border-lime-400/50"
        :class="{ 'blur-sm opacity-40 select-none': isSpoiler(group.position) }"
      >
        "{{ group.anchorText }}"
      </div>

      <!-- Preview Comments (Top 2) -->
      <div class="space-y-3">
        <div
          v-for="comment in group.previewComments"
          :key="comment.id"
          class="rounded-xl bg-zinc-900 p-3 text-zinc-200 text-sm leading-relaxed transition-all duration-300"
        >
          <!-- Spoiler Badge (Small, Top-Right) -->
          <div
            v-if="isSpoiler(group.position)"
            class="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-zinc-800/95 backdrop-blur-sm rounded-full border border-zinc-700/50 z-10"
          >
            <Lock :size="10" />
            <span class="text-[10px] text-zinc-500 font-medium">스포일러</span>
          </div>

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
          <div
            class="transition-all duration-300 mb-2"
            :class="{
              'blur-sm opacity-40 select-none pointer-events-none': isSpoiler(group.position)
            }"
          >
            {{ comment.content }}
          </div>

          <!-- Actions (Like & Reply) - Hidden if spoiler -->
          <div v-if="!isSpoiler(group.position)" class="flex items-center gap-4">
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

          <!-- Nested Replies Preview (if any) -->
          <div v-if="comment.replies && comment.replies.length > 0" class="mt-2 ml-2 border-l-2 border-zinc-800 pl-3">
            <div class="text-sm">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-zinc-400 font-bold">{{ comment.replies[0].user.nickname }}</span>
                <span class="text-[10px] text-zinc-600">{{ formatDate(comment.replies[0].created_at) }}</span>
              </div>
              <p class="text-zinc-300 text-xs">{{ comment.replies[0].content }}</p>
              <div v-if="comment.replies.length > 1" class="text-[10px] text-zinc-500 mt-1">
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
        class="mt-3 w-full py-2 text-xs text-zinc-500 hover:text-lime-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex items-center justify-center gap-1"
      >
        <span>+{{ group.remainingCount }}개 더보기</span>
      </button>

      <!-- Progress Indicator Dot -->
      <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-[#09090b]"></div>
    </div>

    <!-- Comment Detail Modal -->
    <CommentDetailModal
      :isOpen="detailModalOpen"
      :anchorText="selectedGroup?.anchorText || ''"
      :position="selectedGroup?.position || 0"
      :comments="selectedGroup?.allComments || []"
      @close="closeDetailModal"
      @writeComment="(data) => emit('writeComment', data)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Lock, Heart, MessageCircle, Send } from 'lucide-vue-next'
import CommentDetailModal from './CommentDetailModal.vue'

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
  parent_id?: string
  group_book_id?: string
}

const props = defineProps<{
  comments: Comment[]
  readProgress: number
  viewProgress: number
}>()

const activeReplyId = ref<string | null>(null)
const replyContent = ref('')
const detailModalOpen = ref(false)
const selectedGroup = ref<any>(null)

const client = useSupabaseClient()

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
  return position > props.viewProgress
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

const emit = defineEmits(['replySubmitted', 'modalOpen', 'modalClose', 'writeComment'])

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
</script>
