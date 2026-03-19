<template>
  <div class="space-y-6">
    <!-- Input Form -->
    <div v-if="!isArchived" class="apple-card overflow-hidden">
      <div class="p-5">
        <!-- Top row: position + batch -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full px-1 py-0.5">
              <input
                ref="positionInputRef"
                type="number"
                :value="commentPosition"
                @input="handlePositionInput"
                :min="0"
                :max="positionMax"
                class="w-12 px-2 py-1 bg-transparent text-desktop-callout font-semibold text-zinc-900 dark:text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-desktop-caption text-zinc-400 pr-2">{{ positionMode === 'page' ? 'p' : '%' }}</span>
            </div>
            <!-- Mode toggle -->
            <div v-if="totalPages" class="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5">
              <button
                @click="setMode('percent')"
                class="px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ease-apple"
                :class="positionMode === 'percent'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
                  : 'text-zinc-400'"
              >%</button>
              <button
                @click="setMode('page')"
                class="px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all duration-200 ease-apple"
                :class="positionMode === 'page'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
                  : 'text-zinc-400'"
              >p</button>
            </div>
            <span class="text-[10px] text-zinc-300 dark:text-zinc-600 font-medium">에서</span>
          </div>
          <button
            @click="$emit('open-batch')"
            class="px-2.5 py-1 text-zinc-400 rounded-lg text-desktop-caption font-medium hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 ease-apple flex items-center gap-1"
          >
            <Layers :size="12" />
            일괄 입력
          </button>
        </div>

        <!-- Anchor Text -->
        <div class="mb-3">
          <textarea
            ref="anchorInputRef"
            v-model="anchorText"
            placeholder="인용 구절 (선택)"
            rows="1"
            class="w-full px-4 py-2.5 bg-transparent border-l-2 border-lime-400 dark:border-lime-500 text-desktop-body italic text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none resize-none transition-all duration-200 ease-apple"
          ></textarea>
        </div>

        <!-- Content -->
        <div class="mb-4">
          <textarea
            ref="contentInputRef"
            v-model="newComment"
            placeholder="느낀 점을 적어보세요 (선택)"
            rows="2"
            class="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-zinc-50 dark:focus:bg-zinc-800/50 resize-none transition-all duration-200 ease-apple"
            @keydown.meta.enter="submitComment"
            @keydown.ctrl.enter="submitComment"
          ></textarea>
        </div>

        <!-- Submit Row -->
        <div class="flex items-center justify-between">
          <Transition
            enter-active-class="transition-all duration-300"
            leave-active-class="transition-all duration-200"
            enter-from-class="opacity-0 translate-y-1"
            leave-to-class="opacity-0"
          >
            <span v-if="showSaved" class="text-desktop-caption text-lime-600 dark:text-lime-400 flex items-center gap-1">
              <Check :size="14" />
              저장 완료
            </span>
          </Transition>
          <div class="flex items-center gap-3 ml-auto">
            <kbd class="hidden sm:inline text-[10px] text-zinc-300 dark:text-zinc-600">⌘↵</kbd>
            <button
              @click="submitComment"
              :disabled="(!newComment.trim() && !anchorText.trim()) || isSubmitting"
              class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-desktop-caption font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 ease-apple disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center min-w-[72px]"
            >
              <div v-if="isSubmitting" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span v-else>기록</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Body -->
    <div v-if="groupedComments.length > 0" class="space-y-10">
      <div v-for="posGroup in groupedComments" :key="posGroup.position">
        <!-- Position Header -->
        <div class="flex items-center gap-3 mb-4">
          <span class="text-desktop-body font-semibold text-lime-600 dark:text-lime-500 tabular-nums">{{ posGroup.position }}%</span>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
        </div>

        <!-- Anchor Groups within this position -->
        <div class="space-y-6">
          <div v-for="anchorGroup in posGroup.anchorGroups" :key="anchorGroup.key">
            <!-- Shared Anchor Text (shown once) -->
            <div v-if="anchorGroup.anchorText" class="mb-3">
              <div class="pl-4 border-l-2 border-lime-400 dark:border-lime-500">
                <p class="text-desktop-body italic text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{{ anchorGroup.anchorText }}</p>
              </div>
            </div>

            <!-- Comments under this anchor -->
            <div class="space-y-1">
              <div v-for="(comment, idx) in anchorGroup.comments" :key="comment.id">
                <div v-if="idx > 0" class="h-px bg-zinc-100 dark:bg-zinc-800/60 ml-8"></div>

                <!-- Comment Entry -->
                <div class="group/entry relative px-4 py-3 -mx-4 rounded-xl transition-colors duration-200 ease-apple hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <!-- Author Row -->
                  <div class="flex items-center gap-2 mb-1.5">
                    <Avatar
                      :src="comment.user?.avatar_url"
                      :fallback="(comment.user?.nickname || '나')[0]"
                      size="xs"
                      :alt="comment.user?.nickname || '나'"
                      className="w-6 h-6 shadow-sm"
                    />
                    <span class="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{{ comment.user?.nickname || '나' }}</span>
                    <span class="text-[11px] text-zinc-300 dark:text-zinc-600">{{ formatTimeAgo(comment.created_at) }}</span>
                  </div>

                  <!-- Content (view) -->
                  <div class="pl-8">
                    <template v-if="editingCommentId !== comment.id">
                      <p v-if="comment.content" class="text-desktop-body text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">{{ comment.content }}</p>

                      <!-- Actions -->
                      <div class="flex items-center gap-1 mt-2 opacity-0 group-hover/entry:opacity-100 transition-opacity duration-200 ease-apple">
                        <div class="relative">
                          <button
                            @click="handleLike(comment)"
                            class="flex items-center gap-1 px-2 py-1 rounded-full text-desktop-caption font-medium transition-all duration-200 ease-apple"
                            :class="comment.isLiked ? 'text-red-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
                          >
                            <Heart :size="13" :fill="comment.isLiked ? 'currentColor' : 'none'" :class="likedId === comment.id ? 'animate-like-bounce' : ''" />
                            <span v-if="comment.likes" class="tabular-nums">{{ comment.likes }}</span>
                          </button>
                          <div :ref="(el) => setParticleRef(comment.id, el)" class="pointer-events-none absolute inset-0 overflow-visible"></div>
                        </div>

                        <button
                          @click="toggleReplyForm(comment.id)"
                          class="flex items-center gap-1 px-2 py-1 rounded-full text-desktop-caption font-medium text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 ease-apple"
                        >
                          <MessageCircle :size="13" />
                          <span v-if="comment.replies?.length" class="tabular-nums">{{ comment.replies.length }}</span>
                        </button>

                        <template v-if="currentUserId && comment.user_id === currentUserId">
                          <button @click="startEdit(comment)" class="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                            <Pencil :size="13" />
                          </button>
                          <button @click="$emit('delete', comment)" class="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 :size="13" />
                          </button>
                        </template>
                      </div>

                      <!-- Replies (collapsed, expand on click) -->
                      <div v-if="comment.replies?.length && expandedReplies[comment.id]" class="mt-3 pl-2 border-l border-zinc-100 dark:border-zinc-800/60 space-y-2">
                        <div v-for="reply in comment.replies" :key="reply.id" class="group/reply py-1.5 pl-3">
                          <div class="flex items-baseline gap-1.5">
                            <span class="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 flex-shrink-0">{{ reply.user?.nickname || '탈퇴한 사용자' }}</span>
                            <p class="text-[13px] text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap break-words">{{ reply.content }}</p>
                          </div>
                          <div class="flex items-center gap-2 mt-1 opacity-0 group-hover/reply:opacity-100 transition-opacity duration-200 ease-apple">
                            <span class="text-[10px] text-zinc-300 dark:text-zinc-600">{{ formatTimeAgo(reply.created_at) }}</span>
                            <div class="relative">
                              <button
                                @click="handleLike(reply)"
                                class="flex items-center gap-1 text-[10px] font-medium transition-colors"
                                :class="reply.isLiked ? 'text-red-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-red-400'"
                              >
                                <Heart :size="10" :fill="reply.isLiked ? 'currentColor' : 'none'" :class="likedId === reply.id ? 'animate-like-bounce' : ''" />
                                <span v-if="reply.likes" class="tabular-nums">{{ reply.likes }}</span>
                              </button>
                              <div :ref="(el) => setParticleRef(reply.id, el)" class="pointer-events-none absolute inset-0 overflow-visible"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Reply Input -->
                      <div v-if="activeReplyId === comment.id" class="mt-3">
                        <div class="flex items-center gap-2">
                          <input
                            ref="replyInputRef"
                            v-model="replyContent"
                            type="text"
                            placeholder="답글을 남겨보세요..."
                            class="flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-[13px] text-zinc-800 dark:text-zinc-200 rounded-xl pl-3 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all duration-200 ease-apple"
                            @keyup.enter="submitReply(comment)"
                            @keydown.escape="cancelReply"
                          />
                          <button
                            @click="submitReply(comment)"
                            :disabled="!replyContent.trim() || isSubmittingReply"
                            class="p-2 text-lime-600 hover:bg-lime-100 dark:hover:bg-lime-900/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <div v-if="isSubmittingReply" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <Send v-else :size="16" />
                          </button>
                        </div>
                      </div>
                    </template>

                    <!-- Content (edit mode) -->
                    <template v-else>
                      <textarea
                        ref="editTextareaRef"
                        v-model="editContent"
                        rows="3"
                        class="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 resize-none transition-all duration-200 ease-apple focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 mb-3"
                        @keydown.meta.enter="saveEdit(comment)"
                        @keydown.ctrl.enter="saveEdit(comment)"
                        @keydown.escape="cancelEdit"
                      ></textarea>
                      <div class="flex items-center gap-2 mb-2">
                        <button @click="saveEdit(comment)" :disabled="!editContent.trim()" class="px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-caption font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">저장</button>
                        <button @click="cancelEdit" class="px-3.5 py-1.5 text-zinc-500 text-desktop-caption font-medium hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">취소</button>
                        <kbd class="ml-auto text-[10px] text-zinc-300 dark:text-zinc-600">⌘↵</kbd>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="text-center py-4">
      <button
        @click="$emit('load-more')"
        :disabled="isLoadingMore"
        class="px-5 py-2 text-desktop-caption text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 ease-apple"
      >
        {{ isLoadingMore ? '불러오는 중...' : '이전 기록 더 보기' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="comments.length === 0 && !isLoadingMore" class="text-center py-20">
      <Pencil :size="22" class="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
      <h3 class="text-desktop-body font-medium tracking-tight text-zinc-900 dark:text-white mb-1.5">아직 기록이 없어요</h3>
      <p class="text-[13px] text-zinc-400 font-light">책을 읽으면서 느낀 점을 기록해보세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Pencil, Layers, Check, Heart, MessageCircle, Trash2, Send } from 'lucide-vue-next'
import Avatar from '~/components/Avatar.vue'

const props = defineProps<{
  comments: any[]
  viewProgress: number
  hasMore: boolean
  isLoadingMore: boolean
  isArchived?: boolean
  currentUserId?: string
  totalPages?: number
  preferredMode?: 'percent' | 'page'
}>()

const emit = defineEmits(['submit', 'load-more', 'reply', 'reply-submit', 'like', 'open-batch', 'edit', 'delete', 'progress-change'])

const { formatTimeAgo } = useDateUtils()

// ===== Input State =====
const newComment = ref('')
const anchorText = ref('')
const showSaved = ref(false)
const isSubmitting = ref(false)
const contentInputRef = ref<HTMLTextAreaElement | null>(null)
const anchorInputRef = ref<HTMLTextAreaElement | null>(null)
const positionInputRef = ref<HTMLInputElement | null>(null)

// ===== Position State =====
const commentPosition = ref(Math.round(props.viewProgress))
const positionMode = ref<'percent' | 'page'>(props.preferredMode || 'percent')

watch(() => props.viewProgress, (newVal) => {
  const newPct = Math.round(newVal)
  if (newPct > commentPosition.value) {
    commentPosition.value = newPct
  }
})

const positionMax = ref(positionMode.value === 'page' && props.totalPages ? props.totalPages : 100)

watch(positionMode, (mode) => {
  if (mode === 'page' && props.totalPages) {
    positionMax.value = props.totalPages
    commentPosition.value = Math.max(1, Math.round((commentPosition.value / 100) * props.totalPages))
  } else {
    if (props.totalPages && positionMode.value === 'percent') {
      commentPosition.value = Math.round((commentPosition.value / props.totalPages) * 100)
    }
    positionMax.value = 100
  }
})

const setMode = (mode: 'percent' | 'page') => {
  const currentPct = getPositionAsPct()
  positionMode.value = mode
  if (mode === 'page' && props.totalPages) {
    positionMax.value = props.totalPages
    commentPosition.value = Math.max(1, Math.round((currentPct / 100) * props.totalPages))
  } else {
    positionMax.value = 100
    commentPosition.value = currentPct
  }
}

const handlePositionInput = (e: Event) => {
  const raw = Number((e.target as HTMLInputElement).value)
  if (isNaN(raw)) return
  commentPosition.value = Math.min(Math.max(0, raw), positionMax.value)

  const pct = getPositionAsPct()
  if (pct > props.viewProgress) {
    emit('progress-change', pct)
  }
}

const getPositionAsPct = (): number => {
  if (positionMode.value === 'page' && props.totalPages) {
    return Math.round((commentPosition.value / props.totalPages) * 100)
  }
  return commentPosition.value
}

// ===== Submit =====
const submitComment = async () => {
  const hasContent = newComment.value.trim()
  const hasAnchor = anchorText.value.trim()
  if ((!hasContent && !hasAnchor) || isSubmitting.value) return

  isSubmitting.value = true
  const pct = getPositionAsPct()

  try {
    emit('submit', {
      content: hasContent || '',
      anchorText: hasAnchor || '',
      positionPct: pct
    })

    if (pct > props.viewProgress) {
      emit('progress-change', pct)
    }

    newComment.value = ''
    anchorText.value = ''

    const currentPct = Math.round(props.viewProgress)
    if (positionMode.value === 'page' && props.totalPages) {
      commentPosition.value = Math.max(1, Math.round((Math.max(pct, currentPct) / 100) * props.totalPages))
    } else {
      commentPosition.value = Math.max(pct, currentPct)
    }

    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 2000)
    nextTick(() => contentInputRef.value?.focus())
  } finally {
    isSubmitting.value = false
  }
}

// ===== Edit State =====
const editingCommentId = ref<string | null>(null)
const editContent = ref('')
const editTextareaRef = ref<HTMLTextAreaElement | null>(null)

const startEdit = (comment: any) => {
  editContent.value = comment.content
  editingCommentId.value = comment.id
  nextTick(() => {
    const el = editTextareaRef.value
    if (Array.isArray(el)) {
      el[0]?.focus()
    } else {
      el?.focus()
    }
  })
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

const saveEdit = (comment: any) => {
  if (!editContent.value.trim()) return
  emit('edit', { ...comment, content: editContent.value.trim() })
  editingCommentId.value = null
  editContent.value = ''
}

// ===== Reply State =====
const activeReplyId = ref<string | null>(null)
const replyContent = ref('')
const isSubmittingReply = ref(false)
const replyInputRef = ref<HTMLInputElement | null>(null)

const cancelReply = () => {
  activeReplyId.value = null
  replyContent.value = ''
}

const submitReply = (comment: any) => {
  if (!replyContent.value.trim() || isSubmittingReply.value) return
  emit('reply-submit', {
    parentId: comment.id,
    content: replyContent.value.trim(),
    groupBookId: comment.group_book_id,
    positionPct: comment.position_pct
  })
  activeReplyId.value = null
  replyContent.value = ''
}

// ===== Like + Heart Particles =====
const likedId = ref<string | null>(null)
const particleRefs = new Map<string, HTMLElement>()

const setParticleRef = (id: string, el: any) => {
  if (el) particleRefs.set(id, el as HTMLElement)
}

const spawnHeartParticles = (container: HTMLElement) => {
  const count = 4 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span')
    particle.textContent = '\u2665'
    const angle = -30 - Math.random() * 120
    const distance = 18 + Math.random() * 22
    const size = 7 + Math.random() * 5
    const delay = Math.random() * 100
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * distance
    const ty = Math.sin(rad) * distance
    particle.style.cssText = `position:absolute;left:50%;top:50%;font-size:${size}px;color:#ef4444;pointer-events:none;opacity:1;transform:translate(-50%,-50%) scale(0);animation:heart-float 0.6s ${delay}ms cubic-bezier(0.16,1,0.3,1) forwards;--tx:${tx}px;--ty:${ty}px;`
    container.appendChild(particle)
    setTimeout(() => particle.remove(), 800 + delay)
  }
}

const handleLike = (comment: any) => {
  if (!comment.isLiked) {
    likedId.value = comment.id
    const container = particleRefs.get(comment.id)
    if (container) spawnHeartParticles(container)
    setTimeout(() => { likedId.value = null }, 400)
  }
  emit('like', comment)
}

// ===== Reply Expand State =====
const expandedReplies = ref<Record<string, boolean>>({})

const toggleReplyForm = (commentId: string) => {
  // Also expand replies when opening reply form
  expandedReplies.value[commentId] = true

  if (activeReplyId.value === commentId) {
    activeReplyId.value = null
    replyContent.value = ''
  } else {
    activeReplyId.value = commentId
    replyContent.value = ''
    nextTick(() => {
      const el = replyInputRef.value
      if (Array.isArray(el)) el[0]?.focus()
      else el?.focus()
    })
  }
}

// ===== Grouped Comments (position + anchor_text) =====
const groupedComments = computed(() => {
  const posGroups = new Map<number, Map<string, any[]>>()

  props.comments.forEach(comment => {
    const pos = Math.round(comment.position_pct)
    const anchor = comment.anchor_text || ''

    if (!posGroups.has(pos)) {
      posGroups.set(pos, new Map())
    }
    const anchorMap = posGroups.get(pos)!
    if (!anchorMap.has(anchor)) {
      anchorMap.set(anchor, [])
    }
    anchorMap.get(anchor)!.push(comment)
  })

  return Array.from(posGroups.entries())
    .map(([position, anchorMap]) => ({
      position,
      anchorGroups: Array.from(anchorMap.entries()).map(([anchorText, comments]) => ({
        key: `${position}_${anchorText}`,
        anchorText: anchorText || null,
        comments
      }))
    }))
    .sort((a, b) => a.position - b.position)
})

defineExpose({ anchorText })
</script>

<style scoped>
@keyframes like-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.4); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.animate-like-bounce {
  animation: like-bounce 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>

<style>
@keyframes heart-float {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  50% { opacity: 1; transform: translate(calc(-50% + var(--tx) * 0.7), calc(-50% + var(--ty) * 0.7)) scale(1); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.6); }
}
</style>
