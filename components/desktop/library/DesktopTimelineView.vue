<template>
  <div class="space-y-4">
    <!-- Inline Comment Input -->
    <div v-if="!isArchived" class="apple-card overflow-hidden">
      <!-- Input Header -->
      <div class="px-5 py-3 bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
            <Pencil :size="12" class="text-lime-600 dark:text-lime-400" />
          </div>
          <span class="text-desktop-callout text-zinc-700 dark:text-zinc-300">
            {{ Math.round(viewProgress) }}% 에서 기록하기
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="$emit('open-batch')"
            class="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg text-desktop-caption font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
          >
            <Layers :size="12" />
            일괄 입력
          </button>
        </div>
      </div>

      <div class="p-5">
        <!-- Anchor Text (Quote) -->
        <div class="mb-3">
          <div class="flex items-center gap-1.5 mb-1.5">
            <Quote :size="12" class="text-lime-500" />
            <span class="text-desktop-caption text-zinc-400">인용 구절</span>
            <span class="text-desktop-caption text-zinc-300 dark:text-zinc-600">(선택)</span>
          </div>
          <textarea
            ref="anchorInputRef"
            v-model="anchorText"
            placeholder="인상 깊은 구절을 옮겨 적어보세요..."
            rows="2"
            class="w-full px-3 py-2.5 bg-lime-50/50 dark:bg-lime-900/10 border border-lime-200/50 dark:border-lime-800/30 rounded-xl text-desktop-body italic text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400/60 focus:border-lime-400 focus:ring-1 focus:ring-lime-400/30 resize-none transition-all"
          ></textarea>
        </div>

        <!-- Comment Content -->
        <div class="mb-3">
          <div class="flex items-center gap-1.5 mb-1.5">
            <MessageSquare :size="12" class="text-zinc-400" />
            <span class="text-desktop-caption text-zinc-400">내 생각</span>
          </div>
          <textarea
            ref="contentInputRef"
            v-model="newComment"
            placeholder="이 부분에서 느낀 점을 자유롭게 적어보세요..."
            rows="3"
            class="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400/60 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 resize-none transition-all"
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
              저장 완료!
            </span>
          </Transition>
          <div class="flex items-center gap-2 ml-auto">
            <kbd class="hidden sm:inline text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">⌘↵</kbd>
            <button
              @click="submitComment"
              :disabled="!newComment.trim()"
              class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-desktop-callout font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
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
        class="px-5 py-2 text-desktop-callout text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {{ isLoadingMore ? '불러오는 중...' : '이전 기록 더 보기' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="comments.length === 0" class="text-center py-16">
      <div class="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-2xl">✍️</div>
      <h3 class="text-desktop-callout text-zinc-900 dark:text-white mb-1">아직 기록이 없어요</h3>
      <p class="text-desktop-caption text-zinc-400">책을 읽으면서 느낀 점을 기록해보세요.<br/>인상 깊은 구절과 함께 남기면 나중에 더 좋아요!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Pencil, Quote, MessageSquare, Layers, Check } from 'lucide-vue-next'
import DesktopCommentInline from './DesktopCommentInline.vue'

const props = defineProps<{
  comments: any[]
  viewProgress: number
  hasMore: boolean
  isLoadingMore: boolean
  isArchived?: boolean
  currentUserId?: string
}>()

const emit = defineEmits(['submit', 'load-more', 'reply', 'like', 'open-batch', 'edit', 'delete'])

const newComment = ref('')
const anchorText = ref('')
const showSaved = ref(false)
const contentInputRef = ref<HTMLTextAreaElement | null>(null)
const anchorInputRef = ref<HTMLTextAreaElement | null>(null)

const submitComment = () => {
  if (!newComment.value.trim()) return
  emit('submit', {
    content: newComment.value.trim(),
    anchorText: anchorText.value.trim(),
    positionPct: props.viewProgress
  })
  newComment.value = ''
  anchorText.value = ''

  // 저장 피드백
  showSaved.value = true
  setTimeout(() => { showSaved.value = false }, 2000)

  // 다음 입력을 위해 포커스
  nextTick(() => anchorInputRef.value?.focus())
}

defineExpose({ anchorText })
</script>
