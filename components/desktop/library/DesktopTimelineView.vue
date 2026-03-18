<template>
  <div class="space-y-5">
    <!-- Inline Comment Input -->
    <div v-if="!isArchived" class="apple-card overflow-hidden">
      <div class="p-5">
        <!-- Top row: position input + batch button -->
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
            <!-- Mode toggle (if totalPages available) -->
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
            <span class="text-[10px] text-zinc-300 dark:text-zinc-600 font-medium">에서 기록</span>
          </div>
          <button
            @click="$emit('open-batch')"
            class="px-2.5 py-1 text-zinc-400 rounded-lg text-desktop-caption font-medium hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 ease-apple flex items-center gap-1"
          >
            <Layers :size="12" />
            일괄 입력
          </button>
        </div>

        <!-- Anchor Text (Quote) -->
        <div class="mb-3">
          <textarea
            ref="anchorInputRef"
            v-model="anchorText"
            placeholder="인용 구절 (선택)"
            rows="2"
            class="w-full px-4 py-3 bg-transparent border-l-2 border-lime-400 dark:border-lime-500 text-desktop-body italic text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none resize-none transition-all duration-200 ease-apple"
          ></textarea>
        </div>

        <!-- Comment Content -->
        <div class="mb-4">
          <textarea
            ref="contentInputRef"
            v-model="newComment"
            placeholder="이 부분에서 느낀 점을 자유롭게 적어보세요..."
            rows="3"
            class="w-full px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-zinc-50 dark:focus:bg-zinc-800/50 resize-none transition-all duration-200 ease-apple"
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
              :disabled="!newComment.trim()"
              class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-desktop-caption font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 ease-apple disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              기록하기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <DesktopCommentInline
      v-for="comment in comments"
      :key="comment.id"
      :comment="comment"
      :current-user-id="currentUserId"
      @reply="$emit('reply', $event)"
      @like="$emit('like', $event)"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
    />

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
    <div v-if="comments.length === 0" class="text-center py-20">
      <Pencil :size="22" class="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
      <h3 class="text-[15px] font-medium tracking-tight text-zinc-900 dark:text-white mb-1.5">아직 기록이 없어요</h3>
      <p class="text-[13px] text-zinc-400 font-light">책을 읽으면서 느낀 점을 기록해보세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Pencil, Quote, MessageSquare, Layers, Check } from 'lucide-vue-next'
import DesktopCommentInline from './DesktopCommentInline.vue'

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

const emit = defineEmits(['submit', 'load-more', 'reply', 'like', 'open-batch', 'edit', 'delete', 'progress-change'])

const newComment = ref('')
const anchorText = ref('')
const showSaved = ref(false)
const contentInputRef = ref<HTMLTextAreaElement | null>(null)
const anchorInputRef = ref<HTMLTextAreaElement | null>(null)
const positionInputRef = ref<HTMLInputElement | null>(null)

// Comment position (independent from viewProgress)
const commentPosition = ref(Math.round(props.viewProgress))
const positionMode = ref<'percent' | 'page'>(props.preferredMode || 'percent')

// Sync commentPosition when viewProgress changes from outside (e.g. right panel update)
watch(() => props.viewProgress, (newVal) => {
  // Only sync forward — if viewProgress moves ahead, update commentPosition
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
    // Convert back to percent
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

  // If the new position is ahead of current progress, update progress
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

const submitComment = () => {
  if (!newComment.value.trim()) return

  const pct = getPositionAsPct()

  emit('submit', {
    content: newComment.value.trim(),
    anchorText: anchorText.value.trim(),
    positionPct: pct
  })

  // If comment position is ahead, update progress
  if (pct > props.viewProgress) {
    emit('progress-change', pct)
  }

  newComment.value = ''
  anchorText.value = ''

  // 제출 후 현재 진행률로 위치 리셋
  const currentPct = Math.round(props.viewProgress)
  if (positionMode.value === 'page' && props.totalPages) {
    commentPosition.value = Math.max(1, Math.round((Math.max(pct, currentPct) / 100) * props.totalPages))
  } else {
    commentPosition.value = Math.max(pct, currentPct)
  }

  // 저장 피드백
  showSaved.value = true
  setTimeout(() => { showSaved.value = false }, 2000)

  // 다음 입력을 위해 내용 입력으로 포커스
  nextTick(() => contentInputRef.value?.focus())
}

defineExpose({ anchorText })
</script>
