<template>
  <DesktopModal :is-open="isOpen" :title="book?.title" size="md" @close="$emit('close')">
    <div v-if="book" class="px-6 py-4">
      <div class="flex gap-6">
        <!-- Cover -->
        <div class="w-32 aspect-[2/3] rounded-lg overflow-hidden shadow-apple flex-shrink-0">
          <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h2 class="text-desktop-headline text-zinc-900 dark:text-white mb-1">{{ book.title }}</h2>
          <p class="text-desktop-body text-zinc-500 mb-1">{{ book.author }}</p>
          <p v-if="book.publisher" class="text-desktop-caption text-zinc-400 mb-4">{{ book.publisher }}</p>

          <div class="space-y-2">
            <div v-if="book.avgRating" class="flex items-center gap-2">
              <span class="text-desktop-caption text-zinc-500 dark:text-zinc-400">평점</span>
              <span class="text-desktop-callout text-amber-500">{{ book.avgRating.toFixed(1) }}</span>
            </div>
            <div v-if="book.count" class="flex items-center gap-2">
              <span class="text-desktop-caption text-zinc-500 dark:text-zinc-400">독자 수</span>
              <span class="text-desktop-callout text-zinc-900 dark:text-white">{{ book.count }}명</span>
            </div>
            <div v-if="book.completionRate" class="flex items-center gap-2">
              <span class="text-desktop-caption text-zinc-500 dark:text-zinc-400">완독률</span>
              <span class="text-desktop-callout text-lime-600 dark:text-lime-400">{{ Math.round(book.completionRate) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-desktop-callout text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          닫기
        </button>
        <button
          @click="$emit('start-book', book)"
          class="px-5 py-2 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 transition-colors text-desktop-callout"
        >
          읽기 시작
        </button>
      </div>
    </template>
  </DesktopModal>
</template>

<script setup lang="ts">
import DesktopModal from '~/components/desktop/shared/DesktopModal.vue'

defineProps<{
  isOpen: boolean
  book: any
}>()

defineEmits(['close', 'start-book'])
</script>
