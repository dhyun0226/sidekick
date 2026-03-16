<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <h3 class="text-desktop-callout text-zinc-900 dark:text-white">책 목록</h3>
    </div>

    <!-- Reading Books -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="readingBooks.length > 0" class="p-3">
        <p class="text-desktop-caption text-zinc-400 uppercase tracking-wider px-2 mb-2">읽는 중</p>
        <button
          v-for="book in readingBooks"
          :key="book.id"
          @click="$emit('select', book.id)"
          class="w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all text-left"
          :class="selectedBookId === book.id
            ? 'bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'"
        >
          <div class="w-8 h-11 rounded overflow-hidden flex-shrink-0 shadow-sm">
            <img v-if="book.book?.cover_url" :src="book.book.cover_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-desktop-caption font-semibold text-zinc-900 dark:text-white truncate">{{ book.book?.title }}</p>
            <p class="text-[11px] text-zinc-400 truncate">{{ book.book?.author }}</p>
          </div>
        </button>
      </div>

      <!-- History Books -->
      <div v-if="historyBooks.length > 0" class="p-3 border-t border-zinc-100 dark:border-zinc-800">
        <p class="text-desktop-caption text-zinc-400 uppercase tracking-wider px-2 mb-2">완독</p>
        <div
          v-for="book in historyBooks"
          :key="book.id"
          class="group relative flex items-center gap-3 px-2 py-2 rounded-xl transition-all cursor-pointer"
          :class="selectedBookId === book.id
            ? 'bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800'
            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'"
          @click="$emit('select-history', book.id)"
        >
          <div class="w-8 h-11 rounded overflow-hidden flex-shrink-0 shadow-sm opacity-70">
            <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-desktop-caption font-semibold text-zinc-700 dark:text-zinc-300 truncate">{{ book.title }}</p>
            <p class="text-[11px] text-zinc-400 truncate">{{ book.author }}</p>
          </div>
          <!-- History menu button -->
          <button
            @click.stop="activeHistoryMenu = activeHistoryMenu === book.id ? null : book.id"
            class="flex-shrink-0 p-1 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <MoreHorizontal :size="14" />
          </button>
          <!-- Dropdown menu -->
          <div
            v-if="activeHistoryMenu === book.id"
            class="absolute right-2 top-full mt-1 w-32 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-10"
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
      <div v-if="readingBooks.length === 0 && historyBooks.length === 0" class="p-6 text-center">
        <p class="text-desktop-caption text-zinc-400">책이 없어요</p>
      </div>
    </div>

    <!-- Add Book Button -->
    <div v-if="!isArchived" class="p-3 border-t border-zinc-200 dark:border-zinc-800">
      <button
        @click="$emit('add-book')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-desktop-callout"
      >
        <Plus :size="16" />
        새 책 추가
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus, MoreHorizontal } from 'lucide-vue-next'

defineProps<{
  readingBooks: any[]
  historyBooks: any[]
  selectedBookId?: string
  isArchived?: boolean
}>()

defineEmits(['select', 'select-history', 'add-book', 'restart-reading', 'delete-history'])

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
