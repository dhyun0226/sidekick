<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-h-[85vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-white truncate">{{ bookTitle }}</h2>
          <p class="text-xs text-zinc-500">리뷰 {{ reviews.length }}개</p>
        </div>
        <button @click="emit('close')" class="ml-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="24" />
        </button>
      </div>

      <!-- Average Rating -->
      <div v-if="reviews.length > 0" class="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center justify-center gap-3">
          <div class="text-center">
            <div class="text-3xl font-bold text-lime-500">{{ averageRating.toFixed(1) }}</div>
            <div class="flex items-center justify-center gap-0.5 mt-1">
              <Star
                v-for="i in 5"
                :key="i"
                :size="16"
                :fill="i <= Math.round(averageRating) ? '#84cc16' : 'none'"
                :class="i <= Math.round(averageRating) ? 'text-lime-500' : 'text-zinc-300 dark:text-zinc-600'"
              />
            </div>
            <p class="text-xs text-zinc-500 mt-1">{{ reviews.length }}명의 평가</p>
          </div>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="review in sortedReviews"
          :key="review.id"
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
        >
          <!-- Review Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-600">
                <img v-if="review.user?.avatar_url" :src="review.user.avatar_url" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                  <User :size="14" />
                </div>
              </div>
              <div>
                <p class="font-medium text-sm text-zinc-900 dark:text-white">{{ review.user?.display_name || '익명' }}</p>
                <p class="text-xs text-zinc-400">{{ formatDate(review.created_at) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-0.5">
              <Star
                v-for="i in 5"
                :key="i"
                :size="14"
                :fill="i <= review.rating ? '#84cc16' : 'none'"
                :class="i <= review.rating ? 'text-lime-500' : 'text-zinc-300 dark:text-zinc-600'"
              />
            </div>
          </div>

          <!-- Review Content -->
          <p class="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{{ review.content }}</p>
        </div>

        <!-- Empty State -->
        <div v-if="reviews.length === 0" class="text-center py-12">
          <div class="text-5xl mb-3">⭐</div>
          <p class="text-sm text-zinc-500">아직 작성된 리뷰가 없습니다</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Star, User } from 'lucide-vue-next'

interface Review {
  id: string
  user_id: string
  rating: number
  content: string
  created_at: string
  user?: {
    display_name: string
    avatar_url?: string | null
  }
}

interface Props {
  isOpen: boolean
  bookTitle: string
  reviews: Review[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 평균 별점 계산
const averageRating = computed(() => {
  if (props.reviews.length === 0) return 0
  const sum = props.reviews.reduce((acc, review) => acc + review.rating, 0)
  return sum / props.reviews.length
})

// 리뷰 정렬 (최신순)
const sortedReviews = computed(() => {
  return [...props.reviews].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear() % 100
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}.${month}.${day}`
}
</script>
