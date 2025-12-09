<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-scale-up">
      <div class="text-center mb-6">
        <h2 class="text-xl font-bold text-white mb-2">책을 완독하셨군요! 🎉</h2>
        <p class="text-sm text-zinc-400">이 책은 어떠셨나요?</p>
      </div>

      <!-- Star Rating (0.5 increments) -->
      <div class="mb-6">
        <div class="flex justify-center gap-2 mb-2">
          <div
            v-for="star in 5"
            :key="star"
            @click="handleStarClick(star, $event)"
            class="relative cursor-pointer transition-transform hover:scale-110"
            style="width: 32px; height: 32px;"
          >
            <!-- Background (empty star) -->
            <Star :size="32" class="absolute inset-0 text-zinc-700" />

            <!-- Foreground (filled star with clip) -->
            <div
              class="absolute inset-0 overflow-hidden"
              :style="{ width: getStarFillWidth(star) }"
            >
              <Star :size="32" class="text-lime-400 fill-lime-400" />
            </div>
          </div>
        </div>
        <!-- Rating Display -->
        <div v-if="rating > 0" class="text-center text-sm text-lime-400 font-medium">
          {{ rating.toFixed(1) }}점
        </div>
      </div>

      <!-- Review Text -->
      <textarea 
        v-model="content"
        placeholder="짧은 감상평을 남겨주세요 (선택)"
        class="w-full h-24 bg-zinc-800 text-white rounded-xl p-4 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
      ></textarea>

      <!-- Actions -->
      <div class="flex gap-3">
        <button 
          @click="$emit('close')"
          class="flex-1 py-3 text-zinc-400 font-medium hover:text-white transition-colors"
        >
          나중에
        </button>
        <button
          @click="submitReview"
          class="flex-1 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors disabled:opacity-50"
          :disabled="rating < 0.5"
        >
          기록하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Star } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  initialRating?: number
  initialContent?: string
}>()

const emit = defineEmits(['close', 'submit'])

const rating = ref(0)
const content = ref('')

// Watch for opening to set initial values
import { watch } from 'vue'
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    rating.value = props.initialRating || 0
    content.value = props.initialContent || ''
  }
})

const submitReview = () => {
  emit('submit', { rating: rating.value, content: content.value })
  rating.value = 0
  content.value = ''
}

// Handle half-star clicks
const handleStarClick = (star: number, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const starWidth = rect.width

  // Left half = 0.5, Right half = 1.0
  if (clickX < starWidth / 2) {
    rating.value = star - 0.5
  } else {
    rating.value = star
  }
}

// Calculate fill width for each star
const getStarFillWidth = (star: number): string => {
  const diff = rating.value - (star - 1)

  if (diff <= 0) return '0%'
  if (diff >= 1) return '100%'

  // Partial fill (0.5 = 50%)
  return `${diff * 100}%`
}
</script>
