<template>
  <div class="space-y-5">
    <!-- Inline Comment Input -->
    <div v-if="!isArchived" class="apple-card overflow-hidden">
      <div class="p-5">
        <!-- Subtle top row: progress + batch button -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-desktop-caption text-zinc-400 dark:text-zinc-500">
            {{ Math.round(viewProgress) }}%
          </span>
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
            class="w-full px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl text-desktop-body text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 resize-none transition-all duration-200 ease-apple"
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
              class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-desktop-caption font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 ease-apple disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
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
      <Pencil :size="24" class="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
      <h3 class="text-desktop-callout text-zinc-900 dark:text-white mb-1">아직 기록이 없어요</h3>
      <p class="text-desktop-caption text-zinc-400">책을 읽으면서 느낀 점을 기록해보세요.</p>
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
