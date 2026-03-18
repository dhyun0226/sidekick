<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-sm bg-white dark:bg-zinc-900 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-2xl p-6 shadow-apple-lg animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Close Button -->
      <div class="absolute top-4 right-4 z-20">
        <button @click="$emit('close')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>

      <div class="text-center mb-6">
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-1.5">
          장르 수정
        </h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          이 책의 가장 적절한 장르를 선택해주세요.
        </p>
      </div>

      <!-- Genre Selection (Reusing BookSearchModal Style) -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-2 justify-center">
          <button
            v-for="genre in genres"
            :key="genre"
            @click="selectedGenre = genre"
            type="button"
            class="transition-all duration-200 transform active:scale-90"
          >
            <GenreBadge v-if="selectedGenre === genre" :genre="genre" />
            <div v-else class="inline-flex items-center px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent">
              {{ genre }}
            </div>
          </button>
        </div>
      </div>

      <!-- Save Button -->
      <button
        @click="save"
        class="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple-sm active:scale-95 disabled:opacity-50"
        :disabled="!selectedGenre || selectedGenre === currentGenre"
      >
        변경사항 저장
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import GenreBadge from '~/components/GenreBadge.vue'
import { useGenres } from '~/composables/useGenres'

const props = defineProps<{
  isOpen: boolean
  currentGenre?: string
}>()

const emit = defineEmits(['close', 'save'])

const { genres } = useGenres()
const selectedGenre = ref('')

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedGenre.value = props.currentGenre || ''
  }
})

const save = () => {
  if (!selectedGenre.value) return
  emit('save', selectedGenre.value)
}
</script>