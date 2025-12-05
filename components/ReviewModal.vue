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

      <!-- Star Rating -->
      <div class="flex justify-center gap-2 mb-6">
        <button 
          v-for="star in 5" 
          :key="star"
          @click="rating = star"
          class="transition-transform hover:scale-110"
        >
          <Star 
            :size="32" 
            :class="star <= rating ? 'text-lime-400 fill-lime-400' : 'text-zinc-700'" 
          />
        </button>
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
          :disabled="rating === 0"
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
</script>
