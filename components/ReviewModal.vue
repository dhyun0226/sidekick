<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4" @keydown.esc="$emit('close')" tabindex="-1">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-2xl p-6 shadow-apple-lg animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Close Button -->
      <div class="absolute top-4 right-4 z-20">
        <button @click="$emit('close')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="text-center mb-6 pt-4">
        <h2 class="text-xl font-semibold text-zinc-900 dark:text-white mb-1.5">
          {{ isEditing ? '리뷰 수정하기' : '완독을 축하합니다' }}
        </h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          이 책에 대한 소중한 감상을 남겨주세요
        </p>
      </div>

      <!-- Book Preview (Unified Style) -->
      <div v-if="book" class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6">
        <img
          :src="book.coverUrl"
          class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
        />
        <div class="flex-1 min-w-0 flex flex-col justify-center text-left">
          <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ book.title }}</h3>
          <div class="flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 font-medium leading-none">
            <span class="truncate max-w-[80px]">{{ book.author }}</span>
            <template v-if="book.publisher || book.total_pages">
              <span class="text-zinc-300 dark:text-zinc-700">·</span>
              <span v-if="book.publisher" class="truncate max-w-[60px]">{{ book.publisher }}</span>
              <span v-if="book.publisher && book.total_pages">·</span>
              <span v-if="book.total_pages">{{ book.total_pages }}p</span>
            </template>
            <template v-if="book.genre">
              <span class="text-zinc-300 dark:text-zinc-700">·</span>
              <GenreBadge :genre="book.genre" size="sm" />
            </template>
          </div>
        </div>
      </div>

      <!-- Star Rating (0.5 increments) -->
      <div class="mb-8">
        <div class="flex justify-center gap-2 mb-3">
          <div
            v-for="star in 5"
            :key="star"
            @click="handleStarClick(star, $event)"
            class="relative cursor-pointer transition-transform hover:scale-110 active:scale-95"
            style="width: 36px; height: 36px;"
          >
            <!-- Background (empty star) -->
            <Star :size="36" class="absolute inset-0 text-zinc-200 dark:text-zinc-700" />

            <!-- Foreground (filled star with clip) -->
            <div
              class="absolute inset-0 overflow-hidden transition-all duration-300"
              :style="{ width: getStarFillWidth(star) }"
            >
              <Star :size="36" fill="#f59e0b" class="text-amber-400" />
            </div>
          </div>
        </div>
        <!-- Rating Display -->
        <div class="flex items-center justify-center gap-1.5">
          <span v-if="rating > 0" class="text-xl font-black text-amber-500 animate-in fade-in zoom-in-95 duration-300">
            {{ rating.toFixed(1) }}
          </span>
          <span v-else class="text-sm font-bold text-zinc-400">별점을 선택해주세요</span>
        </div>
      </div>

      <!-- Review Text -->
      <div class="mb-8">
        <label class="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 ml-1">상세 리뷰 (선택)</label>
        <textarea
          v-model="content"
          placeholder="책을 읽으며 느낀 점을 자유롭게 기록해보세요."
          maxlength="500"
          class="w-full h-32 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-sm border-none transition-all"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          @click="skip"
          class="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
        >
          {{ isEditing ? '취소' : '건너뛰기' }}
        </button>
        <button
          @click="submitReview"
          class="flex-[2] py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          :disabled="rating === 0 || isSubmitting"
        >
          <div v-if="isSubmitting" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span v-else>{{ isEditing ? '리뷰 수정하기' : '리뷰 등록하기' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Star, X, Sparkles } from 'lucide-vue-next'
import GenreBadge from '~/components/GenreBadge.vue'

interface BookInfo {
  title: string
  author: string
  coverUrl: string
  publisher?: string
  total_pages?: number
  genre?: string
}

const props = defineProps<{
  isOpen: boolean
  initialRating?: number
  initialContent?: string
  isEditing?: boolean
  book?: BookInfo | null
}>()

const emit = defineEmits(['close', 'submit'])

const rating = ref(0)
const content = ref('')
const isSubmitting = ref(false)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    rating.value = props.initialRating || 0
    content.value = props.initialContent || ''
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
  } else {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup: restore body scroll when component unmounts
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const submitReview = () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    emit('submit', { rating: rating.value, content: content.value })
    rating.value = 0
    content.value = ''
  } finally {
    isSubmitting.value = false
  }
}

const skip = () => {
  rating.value = 0
  content.value = ''
  emit('close')
}

// Handle half-star clicks
const handleStarClick = (star: number, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const starWidth = rect.width

  if (clickX < starWidth / 2) {
    rating.value = star - 0.5
  } else {
    rating.value = star
  }
}

const getStarFillWidth = (star: number): string => {
  const diff = rating.value - (star - 1)
  if (diff <= 0) return '0%'
  if (diff >= 1) return '100%'
  return `${diff * 100}%`
}
</script>