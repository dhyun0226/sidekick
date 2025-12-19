<template>
  <div v-if="isOpen" class="fixed inset-0 z-[50] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[85vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div class="flex items-center justify-between px-4 pt-4 pb-3">
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-zinc-900 dark:text-white truncate mb-1">{{ bookTitle }}</h2>
            <p class="text-xs text-zinc-500">{{ reviews.length }}개의 리뷰</p>
          </div>
          <button @click="emit('close')" class="ml-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X :size="20" class="text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <!-- Average Rating -->
        <div v-if="reviews.length > 0" class="px-4 pb-4">
          <div class="bg-gradient-to-br from-lime-50 to-lime-100/50 dark:from-lime-900/20 dark:to-lime-800/10 rounded-xl p-4 border border-lime-200/50 dark:border-lime-800/30">
            <div class="flex items-center justify-center gap-4">
              <div class="text-center">
                <div class="text-4xl font-bold text-lime-600 dark:text-lime-400 mb-2">{{ averageRating.toFixed(1) }}</div>
                <div class="flex items-center justify-center gap-0.5 mb-2">
                  <template v-for="i in 5" :key="i">
                    <Star
                      v-if="getStarType(i, averageRating) === 'full'"
                      :size="18"
                      fill="#84cc16"
                      class="text-lime-500"
                    />
                    <StarHalf
                      v-else-if="getStarType(i, averageRating) === 'half'"
                      :size="18"
                      fill="#84cc16"
                      class="text-lime-500"
                    />
                    <Star
                      v-else
                      :size="18"
                      fill="none"
                      class="text-zinc-300 dark:text-zinc-600"
                    />
                  </template>
                </div>
                <p class="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{{ reviews.length }}명의 평가</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div
          v-for="review in sortedReviews"
          :key="review.id"
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-lime-300 dark:hover:border-lime-700 hover:shadow-md transition-all duration-200"
        >
          <!-- Review Header -->
          <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 overflow-hidden flex-shrink-0 border-2 border-white dark:border-zinc-800 shadow-sm">
              <img v-if="review.user?.avatar_url" :src="review.user.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                <User :size="16" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <p class="font-bold text-sm text-zinc-900 dark:text-white truncate">{{ review.user?.display_name || '익명' }}</p>
                <div class="flex items-center gap-1 bg-lime-50 dark:bg-lime-900/20 px-2 py-1 rounded-lg">
                  <Star :size="12" fill="#84cc16" class="text-lime-500" />
                  <span class="text-xs font-bold text-lime-700 dark:text-lime-400">{{ review.rating.toFixed(1) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-0.5">
                  <template v-for="i in 5" :key="i">
                    <Star
                      v-if="getStarType(i, review.rating) === 'full'"
                      :size="12"
                      fill="#84cc16"
                      class="text-lime-500"
                    />
                    <StarHalf
                      v-else-if="getStarType(i, review.rating) === 'half'"
                      :size="12"
                      fill="#84cc16"
                      class="text-lime-500"
                    />
                    <Star
                      v-else
                      :size="12"
                      fill="none"
                      class="text-zinc-300 dark:text-zinc-600"
                    />
                  </template>
                </div>
                <span class="text-[10px] text-zinc-400">·</span>
                <p class="text-[10px] text-zinc-400">{{ formatDate(review.created_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Review Content -->
          <p class="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed pl-0.5">{{ review.content }}</p>
        </div>

        <!-- Empty State -->
        <div v-if="reviews.length === 0" class="text-center py-16">
          <div class="w-20 h-20 bg-gradient-to-br from-lime-100 to-lime-50 dark:from-lime-900/20 dark:to-lime-800/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            ⭐
          </div>
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">아직 작성된 리뷰가 없습니다</h3>
          <p class="text-xs text-zinc-500">첫 리뷰를 남겨보세요!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Star, StarHalf, User } from 'lucide-vue-next'

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

// 별점 타입 판단
const getStarType = (index: number, rating: number) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = (rating % 1) >= 0.3 // 0.3 이상이면 반별

  if (index <= fullStars) return 'full'
  if (index === fullStars + 1 && hasHalfStar) return 'half'
  return 'empty'
}
</script>
