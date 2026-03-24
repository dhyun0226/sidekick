<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="px-5 pt-5 pb-2">
      <h3 class="text-desktop-caption font-medium text-zinc-400 dark:text-zinc-500">책 목록</h3>
    </div>

    <!-- Reading Books -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="readingBooks.length > 0" class="px-3 pt-2 pb-1">
        <p class="text-desktop-micro font-medium text-zinc-400 dark:text-zinc-500 px-2 mb-1.5 uppercase tracking-widest">읽는 중</p>
        <button
          v-for="book in readingBooks"
          :key="book.id"
          @click="$emit('select', book.id)"
          class="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 ease-apple text-left"
          :class="selectedBookId === book.id
            ? 'bg-lime-50 dark:bg-lime-900/10 ring-1 ring-lime-200 dark:ring-lime-800/30'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'"
        >
          <div class="w-8 h-11 rounded overflow-hidden flex-shrink-0">
            <img v-if="book.book?.cover_url" :src="book.book.cover_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-desktop-caption font-semibold text-zinc-900 dark:text-white truncate">{{ book.book?.title }}</p>
            <p class="text-desktop-caption-regular text-zinc-400 truncate">{{ book.book?.author }}</p>
          </div>
        </button>
      </div>

      <!-- History Books -->
      <div v-if="historyBooks.length > 0" class="px-3 pt-4 pb-1">
        <p class="text-desktop-micro font-medium text-zinc-400 dark:text-zinc-500 px-2 mb-1.5 uppercase tracking-widest">완독</p>
        <div
          v-for="book in historyBooks"
          :key="book.id"
          class="group relative flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 ease-apple cursor-pointer"
          :class="selectedBookId === book.id
            ? 'bg-lime-50 dark:bg-lime-900/10 ring-1 ring-lime-200 dark:ring-lime-800/30'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'"
          @click="$emit('select-history', book.id)"
        >
          <div class="relative w-8 h-11 rounded overflow-hidden flex-shrink-0 opacity-70">
            <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-desktop-caption font-semibold text-zinc-600 dark:text-zinc-400 truncate">{{ book.title }}</p>
            <p class="text-desktop-caption-regular text-zinc-400 truncate">{{ book.author }}</p>
          </div>
          <!-- History menu button -->
          <button
            @click.stop="activeHistoryMenu = activeHistoryMenu === book.id ? null : book.id"
            class="flex-shrink-0 p-1 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 ease-apple"
          >
            <MoreHorizontal :size="14" />
          </button>
          <!-- Dropdown menu -->
          <div
            v-if="activeHistoryMenu === book.id"
            class="absolute right-2 top-full mt-1 w-32 bg-white dark:bg-zinc-900 rounded-xl shadow-apple py-1 z-10"
          >
            <button
              @click.stop="$emit('restart-reading', book.id); activeHistoryMenu = null"
              class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              다시 읽기
            </button>
            <button
              @click.stop="$emit('delete-history', book.id); activeHistoryMenu = null"
              class="w-full px-3 py-2 text-left text-desktop-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="readingBooks.length === 0 && historyBooks.length === 0" class="text-center py-8">
        <BookOpen :size="20" class="text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
        <p class="text-desktop-caption text-zinc-400">책이 없어요</p>
      </div>
    </div>

    <!-- Add Book Button -->
    <div v-if="!isArchived" class="px-4 pt-3 pb-1">
      <button
        @click="$emit('add-book')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 text-zinc-400 dark:text-zinc-500 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 ease-apple text-desktop-caption"
      >
        <Plus :size="15" />
        새 책 추가
      </button>
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div class="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/50">
      <p class="text-desktop-micro text-zinc-300 dark:text-zinc-600 leading-relaxed">
        <kbd class="font-mono">↑↓</kbd> 이동 · <kbd class="font-mono">/</kbd> 입력 · <kbd class="font-mono">⌘/</kbd> 일괄입력
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus, MoreHorizontal, BookOpen } from 'lucide-vue-next'

defineProps<{
  readingBooks: any[]
  historyBooks: any[]
  selectedBookId?: string
  isArchived?: boolean
}>()

const emit = defineEmits(['select', 'select-history', 'add-book', 'restart-reading', 'delete-history'])

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

const activeHistoryMenu = ref<string | null>(null)

const closeMenu = () => {
  activeHistoryMenu.value = null
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>
