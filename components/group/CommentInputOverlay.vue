<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100000] flex items-end justify-center pointer-events-none" style="height: 100dvh;" @keydown.esc="emit('close')" tabindex="-1">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="emit('close')"></div>
    <div class="relative z-10 w-full max-w-[480px] bg-white dark:bg-zinc-900 p-6 pb-safe rounded-t-2xl shadow-apple-lg pointer-events-auto animate-slide-up ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">댓글 작성</h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{{ chapterName }} · {{ Math.round(position) }}%</p>
        </div>
        <button @click="emit('close')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          <X :size="20" />
        </button>
      </div>

      <!-- Anchor Text -->
      <div class="mb-3">
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          인용 텍스트 {{ anchorTextLocked ? '' : '(선택사항)' }}
        </label>
        <div class="relative">
          <textarea
            v-model="anchorText"
            rows="3"
            :readonly="anchorTextLocked"
            :placeholder="anchorTextLocked ? '' : '예: &quot;주인공은 결국 돌아왔다&quot;'"
            :class="[
              'w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-y',
              anchorTextLocked
                ? 'bg-lime-100 dark:bg-zinc-800/50 text-lime-600 dark:text-lime-400 cursor-not-allowed ring-1 ring-lime-400/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10'
            ]"
          ></textarea>
          <div v-if="anchorTextLocked" class="absolute right-2 top-2 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded">
            고정됨
          </div>
        </div>
        <p v-if="!anchorTextLocked" class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">인용하고 싶은 문구를 입력하세요</p>
      </div>

      <!-- Content -->
      <div class="mb-3">
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">댓글 내용 *</label>
        <textarea
          v-model="content"
          placeholder="이 부분에 대한 생각을 남겨보세요..."
          class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl p-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-sm"
          maxlength="500"
        ></textarea>
        <div class="flex justify-between items-center mt-1">
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">최대 500자</p>
          <p class="text-[11px]" :class="content.length > 500 ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-400'">
            {{ content.length }} / 500
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="emit('close')"
          class="flex-1 py-3 text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          취소
        </button>
        <button
          @click="handleSubmit"
          :disabled="!isValid || isSubmitting"
          class="flex-1 py-3 bg-lime-400 text-black rounded-2xl font-semibold hover:bg-lime-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <div v-if="isSubmitting" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <template v-else>
            <Send :size="16" />
            등록
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Send } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  chapterName: string
  position: number
  initialAnchorText?: string
  anchorTextLocked?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', payload: {
    content: string
    anchorText: string | null
    position: number
  }): void
}

const props = withDefaults(defineProps<Props>(), {
  initialAnchorText: '',
  anchorTextLocked: false
})

const emit = defineEmits<Emits>()

const content = ref('')
const anchorText = ref(props.initialAnchorText)
const isSubmitting = ref(false)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    anchorText.value = props.initialAnchorText
  } else {
    content.value = ''
    anchorText.value = ''
  }
})

watch(() => props.initialAnchorText, (newValue) => {
  if (props.isOpen) {
    anchorText.value = newValue
  }
})

const handleSubmit = () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    emit('submit', {
      content: content.value.trim(),
      anchorText: anchorText.value.trim() || null,
      position: Math.round(props.position)
    })
  } finally {
    isSubmitting.value = false
  }
}

const isValid = computed(() => {
  const hasContent = content.value.trim().length > 0
  const hasAnchor = anchorText.value.trim().length > 0
  const withinLimit = content.value.length <= 500
  return (hasContent || hasAnchor) && withinLimit
})
</script>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
