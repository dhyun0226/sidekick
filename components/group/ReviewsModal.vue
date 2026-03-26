<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-center justify-center p-4" @keydown.esc="emit('close')" tabindex="-1">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div class="min-w-0">
          <h2 class="text-lg font-black text-zinc-900 dark:text-white truncate mb-0.5">{{ bookTitle }}</h2>
          <p class="text-[11px] text-zinc-400 font-bold uppercase">리뷰 {{ reviews.length }}개</p>
        </div>
        <button @click="emit('close')" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
          <X :size="20" class="text-zinc-400" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <!-- Average Rating Hero -->
        <div v-if="reviews.length > 0" class="px-6 py-6 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-center gap-8">
            <div class="text-center">
              <div class="text-5xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">{{ averageRating.toFixed(1) }}</div>
              <div class="flex items-center justify-center gap-0.5">
                <template v-for="i in 5" :key="i">
                  <Star
                    v-if="getStarType(i, averageRating) === 'full'"
                    :size="16"
                    fill="#EAB308"
                    class="text-yellow-500"
                  />
                  <StarHalf
                    v-else-if="getStarType(i, averageRating) === 'half'"
                    :size="16"
                    fill="#EAB308"
                    class="text-yellow-500"
                  />
                  <Star
                    v-else
                    :size="16"
                    fill="none"
                    class="text-zinc-200 dark:text-zinc-700"
                  />
                </template>
              </div>
            </div>
            <div class="h-12 w-px bg-zinc-200 dark:bg-zinc-800"></div>
            <div class="flex flex-col gap-1">
              <div v-for="i in [5, 4, 3, 2, 1]" :key="i" class="flex items-center gap-2">
                <span class="text-[11px] font-bold text-zinc-400 w-2">{{ i }}</span>
                <div class="w-24 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div 
                    class="h-full bg-yellow-400 transition-all duration-500"
                    :style="{ width: `${getRatingPercentage(i)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="p-6 space-y-4">
          <div
            v-for="review in sortedReviews"
            :key="review.id"
            class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:border-lime-200 dark:hover:border-lime-900/50 transition-all"
          >
            <!-- Review Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-800 opacity-80 shadow-inner">
                  <img v-if="review.user?.avatar_url" :src="review.user.avatar_url" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-bold">
                    {{ (review.user?.display_name || '탈').charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div>
                  <p class="font-bold text-sm text-zinc-900 dark:text-white" :class="{ 'text-zinc-400 font-medium italic': !review.user }">
                    {{ review.user?.display_name || '탈퇴한 사용자' }}
                  </p>
                  <p class="text-[11px] text-zinc-400 font-medium">{{ formatDate(review.created_at) }}</p>
                </div>
              </div>
              <RatingBadge :rating="review.rating" size="sm" />
            </div>

            <!-- Review Content -->
            <div class="relative">
              <Quote :size="16" class="text-zinc-100 dark:text-zinc-800 absolute -top-2 -left-1 -z-0" />
              <p class="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed relative z-10 pl-1">
                {{ review.content }}
              </p>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="reviews.length === 0" class="text-center py-16 flex flex-col items-center">
            <div class="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
              <Star :size="28" class="text-zinc-300 dark:text-zinc-500" />
            </div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">아직 리뷰가 없어요</h3>
            <p class="text-xs text-zinc-500">이 책의 첫 번째 리뷰어가 되어보세요!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Star, StarHalf, User, Quote } from 'lucide-vue-next'
import RatingBadge from '~/components/RatingBadge.vue'

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

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const averageRating = computed(() => {
  if (props.reviews.length === 0) return 0
  const sum = props.reviews.reduce((acc, review) => acc + Number(review.rating), 0)
  return sum / props.reviews.length
})

const getRatingPercentage = (star: number) => {
  if (props.reviews.length === 0) return 0
  const count = props.reviews.filter(r => Math.floor(r.rating) === star).length
  return (count / props.reviews.length) * 100
}

const sortedReviews = computed(() => {
  return [...props.reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const year = String(date.getFullYear()).slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const getStarType = (index: number, rating: number) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = (rating % 1) >= 0.3
  if (index <= fullStars) return 'full'
  if (index === fullStars + 1 && hasHalfStar) return 'half'
  return 'empty'
}
</script>

