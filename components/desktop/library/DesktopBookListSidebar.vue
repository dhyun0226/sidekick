<template>
  <div class="h-full flex flex-col">
    <div class="px-5 pt-5 pb-2 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">책 목록</h3>
        <p class="text-desktop-footnote text-zinc-400 dark:text-zinc-300 mt-0.5">읽는 중 {{ readingBooks.length }} · 완료 {{ historyBooks.length }}</p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="readingBooks.length > 0" class="px-3 pt-2 pb-1">
        <p class="text-xs font-medium text-zinc-400 dark:text-zinc-300 px-2 mb-1.5">읽는 중</p>
        <button
          v-for="book in readingBooks"
          :key="book.id"
          @click="$emit('select', book.id)"
          class="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 ease-apple text-left"
          :class="selectedBookId === book.id
            ? 'bg-lime-50 dark:bg-lime-900/30 ring-1 ring-lime-200 dark:ring-lime-700/50'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'"
        >
          <div class="w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
            <img v-if="book.book?.cover_url" :src="book.book.cover_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <BookOpen :size="14" class="text-zinc-400 dark:text-zinc-300" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-desktop-caption font-semibold text-zinc-900 dark:text-white truncate">{{ book.book?.title }}</p>
            <p class="text-desktop-caption-regular text-zinc-400 dark:text-zinc-300 truncate">{{ book.book?.author }}</p>
          </div>
        </button>
      </div>

      <div v-if="historyBooks.length > 0" class="px-3 pt-4 pb-1">
        <p class="text-xs font-medium text-zinc-400 dark:text-zinc-300 px-2 mb-1.5">완료한 책</p>
        <div
          v-for="book in historyBooks"
          :key="book.id"
          class="group relative flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 ease-apple cursor-pointer"
          :class="selectedBookId === book.id
            ? 'bg-lime-50 dark:bg-lime-900/30 ring-1 ring-lime-200 dark:ring-lime-700/50'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'"
          @click="$emit('select-history', book.id)"
        >
          <div class="relative w-8 h-11 rounded overflow-hidden flex-shrink-0 opacity-75 bg-zinc-100 dark:bg-zinc-800">
            <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <BookOpen :size="14" class="text-zinc-400 dark:text-zinc-300" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-desktop-caption font-semibold text-zinc-600 dark:text-zinc-300 truncate">{{ book.title }}</p>
            <p class="text-desktop-caption-regular text-zinc-400 dark:text-zinc-300 truncate">{{ book.author }}</p>
          </div>
        </div>
      </div>

      <div v-if="readingBooks.length === 0 && historyBooks.length === 0" class="text-center py-10 px-5">
        <BookOpen :size="22" class="text-zinc-400 dark:text-zinc-300 mx-auto mb-2" />
        <p class="text-desktop-caption font-medium text-zinc-500 dark:text-zinc-300">아직 책이 없어요</p>
        <p class="text-desktop-footnote text-zinc-400 dark:text-zinc-400 mt-1">첫 책을 추가하면 기록을 시작할 수 있어요.</p>
      </div>
    </div>

    <div v-if="!isArchived" class="px-4 pt-3 pb-3 border-t border-zinc-100 dark:border-zinc-800/50">
      <button
        @click="$emit('add-book')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-zinc-700 dark:text-zinc-200 bg-zinc-100/70 dark:bg-zinc-800/70 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-all duration-200 ease-apple text-desktop-caption font-semibold"
      >
        <Plus :size="15" />
        책 추가
      </button>
      <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-zinc-400 dark:text-zinc-300">
        <span><kbd class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-mono">↑↓</kbd> 이동</span>
        <span><kbd class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-mono">/</kbd> 입력</span>
        <span><kbd class="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-mono">{{ isMac ? '⌘' : 'Ctrl' }} /</kbd> 일괄 입력</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, BookOpen } from 'lucide-vue-next'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

const props = defineProps<{
  readingBooks: any[]
  historyBooks: any[]
  selectedBookId?: string
  isArchived?: boolean
}>()

const emit = defineEmits(['select', 'select-history', 'add-book'])

const selectAdjacentBook = (direction: 'up' | 'down') => {
  const allBooks = [
    ...props.readingBooks.map(b => ({ id: b.id, type: 'reading' })),
    ...props.historyBooks.map(b => ({ id: b.id, type: 'history' }))
  ]
  if (allBooks.length === 0) return

  const currentIdx = allBooks.findIndex(b => b.id === props.selectedBookId)
  let nextIdx: number
  if (currentIdx === -1) {
    nextIdx = 0
  } else if (direction === 'down') {
    nextIdx = Math.min(currentIdx + 1, allBooks.length - 1)
  } else {
    nextIdx = Math.max(currentIdx - 1, 0)
  }

  const next = allBooks[nextIdx]
  if (next.type === 'reading') {
    emit('select', next.id)
  } else {
    emit('select-history', next.id)
  }
}

defineExpose({ selectAdjacentBook })
</script>
