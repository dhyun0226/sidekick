<template>
  <DesktopModal :is-open="isOpen" :title="book?.title" size="md" @close="$emit('close')">
    <div v-if="book" class="px-8 py-6">
      <div class="flex gap-8">
        <!-- Cover -->
        <div class="w-40 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
          <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 flex flex-col">
          <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{{ book.title }}</h2>
          <p class="mt-1 text-base text-zinc-500">{{ book.author }}</p>
          <p v-if="book.publisher" class="mt-0.5 text-sm text-zinc-400">{{ book.publisher }}</p>

          <!-- Stats grid -->
          <div class="mt-auto pt-6 grid grid-cols-3 gap-4">
            <div v-if="book.avgRating" class="text-center">
              <p class="text-2xl font-semibold text-zinc-900 dark:text-white">{{ book.avgRating.toFixed(1) }}</p>
              <p class="mt-0.5 text-xs text-zinc-400 uppercase tracking-wide">평점</p>
            </div>
            <div v-if="book.count" class="text-center">
              <p class="text-2xl font-semibold text-zinc-900 dark:text-white">{{ book.count }}<span class="text-base font-normal text-zinc-400">명</span></p>
              <p class="mt-0.5 text-xs text-zinc-400 uppercase tracking-wide">독자 수</p>
            </div>
            <div v-if="book.completionRate" class="text-center">
              <p class="text-2xl font-semibold text-lime-500">{{ Math.round(book.completionRate) }}<span class="text-base font-normal">%</span></p>
              <p class="mt-0.5 text-xs text-zinc-400 uppercase tracking-wide">완독률</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 px-2">
        <button
          @click="$emit('close')"
          class="px-5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg"
        >
          닫기
        </button>
        <button
          @click="$emit('start-book', book)"
          class="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
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
