<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end justify-center" style="height: 100dvh;">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="emit('close')"></div>
    <div class="relative z-10 w-full max-w-[480px] bg-white dark:bg-zinc-900 p-6 pb-safe rounded-t-2xl shadow-2xl pointer-events-auto animate-slide-up border-t border-zinc-300 dark:border-zinc-800">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">댓글 작성</h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-500 mt-1">{{ chapterName }} · {{ Math.round(position) }}%</p>
        </div>
        <button @click="emit('close')" class="text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          <X :size="20" />
        </button>
      </div>

      <!-- Anchor Text -->
      <div class="mb-3">
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          인용 텍스트 {{ anchorTextLocked ? '' : '(선택사항)' }}
        </label>
        <div class="relative">
          <input
            v-model="anchorText"
            type="text"
            :readonly="anchorTextLocked"
            :placeholder="anchorTextLocked ? '' : '예: &quot;주인공은 결국 돌아왔다&quot;'"
            :class="[
              'w-full rounded-lg px-3 py-2 text-sm focus:outline-none',
              anchorTextLocked
                ? 'bg-lime-100 dark:bg-zinc-800/50 text-lime-600 dark:text-lime-400 font-serif italic cursor-not-allowed border border-lime-400/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-lime-400'
            ]"
          />
          <div v-if="anchorTextLocked" class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded">
            고정됨
          </div>
        </div>
        <p v-if="!anchorTextLocked" class="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1">인용하고 싶은 문구를 입력하세요</p>
      </div>

      <!-- Content -->
      <div class="mb-3">
        <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">댓글 내용 *</label>
        <textarea
          v-model="content"
          placeholder="이 부분에 대한 생각을 남겨보세요..."
          class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
          maxlength="500"
        ></textarea>
        <div class="flex justify-between items-center mt-1">
          <p class="text-[10px] text-zinc-500 dark:text-zinc-600">최대 500자</p>
          <p class="text-[10px]" :class="content.length > 500 ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-600'">
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
          :disabled="!isValid"
          class="flex-1 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send :size="16" />
          등록
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
  if (!isValid.value) return

  emit('submit', {
    content: content.value.trim(),
    anchorText: anchorText.value.trim() || null,
    position: Math.round(props.position)
  })
}

const isValid = computed(() => {
  return content.value.trim().length > 0 && content.value.length <= 500
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
