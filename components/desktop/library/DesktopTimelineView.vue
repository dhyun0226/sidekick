<template>
  <div class="space-y-6">
    <!-- Input Form -->
    <div v-if="!isArchived && !isReadOnlyMode" class="apple-card overflow-hidden">
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
                @keydown.tab.prevent="anchorInputRef?.focus()"
                :min="0"
                :max="positionMax"
                :placeholder="currentPositionPlaceholder"
                class="w-20 px-2 py-1 bg-transparent text-desktop-callout font-semibold text-zinc-900 dark:text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 placeholder:font-normal placeholder:text-desktop-caption"
              />
            </div>
            <!-- Mode toggle -->
            <div v-if="totalPages" class="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5">
              <button
                tabindex="-1"
                @click="setMode('percent')"
                class="px-2.5 py-0.5 text-desktop-micro font-semibold rounded-full transition-all duration-200 ease-apple"
                :class="positionMode === 'percent'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
                  : 'text-zinc-400 dark:text-zinc-300'"
              >{{ positionMode === 'percent' ? '퍼센트' : '%' }}</button>
              <button
                tabindex="-1"
                @click="setMode('page')"
                class="px-2.5 py-0.5 text-desktop-micro font-semibold rounded-full transition-all duration-200 ease-apple"
                :class="positionMode === 'page'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
                  : 'text-zinc-400 dark:text-zinc-300'"
              >{{ positionMode === 'page' ? '페이지' : 'p' }}</button>
            </div>
            <span class="text-desktop-micro text-zinc-400 dark:text-zinc-300 font-medium">에서</span>
          </div>
          <button
            tabindex="-1"
            @click="$emit('open-batch')"
            class="px-2.5 py-1 text-zinc-400 dark:text-zinc-300 rounded-lg text-desktop-caption font-medium hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 ease-apple flex items-center gap-1"
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
            maxlength="500"
            class="w-full px-4 py-2.5 bg-transparent border-l-2 border-lime-400 dark:border-lime-500 text-desktop-callout-regular text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-500 focus:outline-none resize-none transition-all duration-200 ease-apple"
          ></textarea>
        </div>

        <!-- Content -->
        <div class="mb-4">
          <textarea
            ref="contentInputRef"
            v-model="newComment"
            placeholder="느낀 점을 적어보세요 (선택)"
            rows="2"
            maxlength="2000"
            class="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl text-desktop-callout-regular text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-zinc-50 dark:focus:bg-zinc-800/50 resize-none transition-all duration-200 ease-apple"
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
            <kbd class="hidden sm:inline text-desktop-micro text-zinc-400 dark:text-zinc-300">{{ isMac ? '⌘' : 'Ctrl' }}↵</kbd>
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
          <span class="text-desktop-callout font-semibold text-lime-600 dark:text-lime-500 tabular-nums">{{ posGroup.position }}%</span>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
        </div>

        <!-- Anchor Groups -->
        <div class="space-y-8">
          <div v-for="anchorGroup in posGroup.anchorGroups" :key="anchorGroup.key">
            <!-- Shared Anchor Text - Hide when editing a comment in this group -->
            <div v-if="anchorGroup.anchorText && !anchorGroup.comments.some(c => c.id === editingCommentId)" class="mb-4">
              <div class="pl-4 py-2.5 border-l-2 border-lime-400 dark:border-lime-500 bg-lime-50/60 dark:bg-lime-900/30 rounded-r-xl">
                <p class="text-desktop-callout-regular text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{{ anchorGroup.anchorText }}</p>
              </div>
            </div>

            <!-- Comments -->
            <div class="space-y-5">
              <div v-for="comment in anchorGroup.comments" :key="comment.id">
                <!-- Comment -->
                <div class="flex gap-3">
                  <Avatar
                    :src="comment.user?.avatar_url"
                    :fallback="(comment.user?.nickname || '나')[0]"
                    size="xs"
                    :alt="comment.user?.nickname || '나'"
                    className="w-7 h-7 shadow-sm flex-shrink-0 mt-0.5"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2">
                      <span class="text-desktop-caption font-semibold text-zinc-900 dark:text-zinc-100">{{ comment.user?.nickname || '나' }}</span>
                      <span class="text-desktop-footnote text-zinc-400 dark:text-zinc-300">{{ formatTimeAgo(comment.created_at) }}</span>
                    </div>

                    <template v-if="editingCommentId !== comment.id">
                      <p v-if="comment.content" class="text-desktop-callout-regular text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words mt-1">{{ comment.content }}</p>

                      <!-- Actions (always visible, very muted) -->
                      <div class="flex items-center gap-3 mt-1.5">
                        <div class="relative">
                          <button
                            @click="handleLike(comment)"
                            class="flex items-center gap-1 text-desktop-footnote font-medium transition-colors"
                            :class="comment.isLiked ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-300 hover:text-red-400'"
                          >
                            <Heart :size="12" :fill="comment.isLiked ? 'currentColor' : 'none'" :class="likedId === comment.id ? 'animate-like-bounce' : ''" />
                            <span v-if="comment.likes" class="tabular-nums">{{ comment.likes }}</span>
                          </button>
                          <div :ref="(el) => setParticleRef(comment.id, el)" class="pointer-events-none absolute inset-0 overflow-visible"></div>
                        </div>

                        <button
                          v-if="!isReadOnlyMode"
                          @click="toggleReplyForm(comment.id)"
                          class="flex items-center gap-1 text-desktop-footnote font-medium text-zinc-400 dark:text-zinc-300 hover:text-zinc-500 transition-colors"
                        >
                          <MessageCircle :size="12" />
                          <span v-if="comment.replies?.length" class="tabular-nums">{{ comment.replies.length }}</span>
                        </button>

                        <template v-if="!isReadOnlyMode && currentUserId && comment.user_id === currentUserId">
                          <button @click="startEdit(comment)" class="text-zinc-400 dark:text-zinc-300 hover:text-zinc-500 transition-colors">
                            <Pencil :size="13" />
                          </button>
                          <button @click="$emit('delete', comment)" class="text-zinc-400 dark:text-zinc-300 hover:text-red-400 transition-colors">
                            <Trash2 :size="13" />
                          </button>
                        </template>
                      </div>
                    </template>

                    <!-- Edit Mode -->
                    <template v-else>
                      <div class="mt-1 space-y-2">
                        <textarea
                          v-model="editAnchor"
                          placeholder="인용 구절 (선택)"
                          rows="2"
                          maxlength="500"
                          class="w-full px-3 py-2.5 bg-lime-50/60 dark:bg-lime-900/30 border-l-2 border-lime-400 rounded-r-xl text-desktop-callout-regular text-zinc-600 dark:text-zinc-300 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400/20"
                          @keydown.escape="cancelEdit"
                        ></textarea>
                        <textarea
                          ref="editTextareaRef"
                          v-model="editContent"
                          placeholder="코멘트 (선택)"
                          rows="3"
                          maxlength="2000"
                          class="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-desktop-callout-regular text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                          @keydown.meta.enter="saveEdit(comment)"
                          @keydown.ctrl.enter="saveEdit(comment)"
                          @keydown.escape="cancelEdit"
                        ></textarea>
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <button @click="saveEdit(comment)" :disabled="!editContent.trim() && !editAnchor.trim()" class="px-3.5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-caption font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">저장</button>
                        <button @click="cancelEdit" class="px-3.5 py-1.5 text-zinc-500 text-desktop-caption font-medium hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">취소</button>
                        <kbd class="ml-auto text-desktop-micro text-zinc-400 dark:text-zinc-300">{{ isMac ? '⌘' : 'Ctrl' }}↵</kbd>
                      </div>
                    </template>

                    <!-- Replies (always visible) -->
                    <div v-if="comment.replies?.length" class="mt-3 space-y-2.5">
                      <div v-for="reply in comment.replies" :key="reply.id" class="flex gap-2.5">
                        <Avatar
                          :src="reply.user?.avatar_url"
                          :fallback="(reply.user?.nickname || '탈')[0]"
                          size="xs"
                          :alt="reply.user?.nickname || '탈퇴한 사용자'"
                          className="w-5 h-5 shadow-sm flex-shrink-0 mt-0.5"
                        />
                        <div class="flex-1 min-w-0">
                          <div class="flex items-baseline gap-1.5">
                            <span class="text-desktop-caption font-semibold text-zinc-700 dark:text-zinc-300">{{ reply.user?.nickname || '탈퇴한 사용자' }}</span>
                            <span class="text-desktop-footnote text-zinc-400 dark:text-zinc-300">{{ formatTimeAgo(reply.created_at) }}</span>
                          </div>
                          <p class="text-desktop-caption text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words mt-0.5">{{ reply.content }}</p>
                          <div class="flex items-center gap-3 mt-1">
                            <div class="relative">
                              <button
                                @click="handleLike(reply)"
                                class="flex items-center gap-1 text-desktop-footnote font-medium transition-colors"
                                :class="reply.isLiked ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-300 hover:text-red-400'"
                              >
                                <Heart :size="12" :fill="reply.isLiked ? 'currentColor' : 'none'" :class="likedId === reply.id ? 'animate-like-bounce' : ''" />
                                <span v-if="reply.likes" class="tabular-nums">{{ reply.likes }}</span>
                              </button>
                              <div :ref="(el) => setParticleRef(reply.id, el)" class="pointer-events-none absolute inset-0 overflow-visible"></div>
                            </div>
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
                          class="flex-1 bg-zinc-50 dark:bg-zinc-800/50 text-desktop-caption text-zinc-800 dark:text-zinc-200 rounded-xl pl-3 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 transition-all duration-200 ease-apple"
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
        class="px-5 py-2 text-desktop-caption text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 ease-apple"
      >
        {{ isLoadingMore ? '불러오는 중...' : '이전 기록 더 보기' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="comments.length === 0 && !isLoadingMore" class="text-center py-20">
      <Pencil :size="22" class="mx-auto text-zinc-400 dark:text-zinc-300 mb-4" />
      <h3 class="text-desktop-callout-regular font-medium tracking-tight text-zinc-900 dark:text-white mb-1.5">아직 기록이 없어요</h3>
      <p class="text-desktop-caption text-zinc-400 dark:text-zinc-300 font-light">책을 읽으면서 느낀 점을 기록해보세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Pencil, Layers, Check, Heart, MessageCircle, Trash2, Send } from 'lucide-vue-next'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
import Avatar from '~/components/Avatar.vue'

const props = defineProps<{
  comments: any[]
  viewProgress: number
  hasMore: boolean
  isLoadingMore: boolean
  isArchived?: boolean
  isReadOnlyMode?: boolean
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
const commentPosition = ref<number | null>(null)
const positionMode = ref<'percent' | 'page'>(props.preferredMode || 'percent')

const currentPositionPlaceholder = computed(() => {
  const pct = Math.round(props.viewProgress)
  if (positionMode.value === 'page' && props.totalPages) {
    return `현재 ${Math.max(1, Math.round((pct / 100) * props.totalPages))}p`
  }
  return `현재 ${pct}%`
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
  positionMode.value = mode
  if (mode === 'page' && props.totalPages) {
    positionMax.value = props.totalPages
  } else {
    positionMax.value = 100
  }
  // 값이 입력된 상태면 변환, 비어있으면 그대로 null
  if (commentPosition.value !== null) {
    const currentPct = getPositionAsPct()
    if (mode === 'page' && props.totalPages) {
      commentPosition.value = Math.max(1, Math.round((currentPct / 100) * props.totalPages))
    } else {
      commentPosition.value = currentPct
    }
  }
}

const handlePositionInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (val === '') {
    commentPosition.value = null
    return
  }
  const raw = Number(val)
  if (isNaN(raw)) return
  commentPosition.value = Math.min(Math.max(0, raw), positionMax.value)
}

const getPositionAsPct = (): number => {
  if (commentPosition.value === null) {
    return Math.round(props.viewProgress)
  }
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
    commentPosition.value = null

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

const editAnchor = ref('')

const startEdit = (comment: any) => {
  editContent.value = comment.content || ''
  editAnchor.value = comment.anchor_text || ''
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
  editAnchor.value = ''
}

const saveEdit = (comment: any) => {
  const hasContent = editContent.value.trim()
  const hasAnchor = editAnchor.value.trim()
  if (!hasContent && !hasAnchor) return
  emit('edit', { ...comment, content: hasContent, anchor_text: hasAnchor || null })
  editingCommentId.value = null
  editContent.value = ''
  editAnchor.value = ''
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

const toggleReplyForm = (commentId: string) => {
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

defineExpose({ anchorText, contentInputRef, positionInputRef })
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
