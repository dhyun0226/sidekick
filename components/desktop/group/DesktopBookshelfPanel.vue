<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h4 class="text-desktop-micro text-zinc-400 dark:text-zinc-300 uppercase tracking-widest font-medium">책장 {{ books.length }}</h4>
      <div v-if="books.length > 1" class="relative">
        <button
          @click.stop="showSortMenu = !showSortMenu"
          class="flex items-center gap-1 text-desktop-footnote text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowUpDown :size="12" />
          <span>{{ sortLabel }}</span>
        </button>
        <div
          v-if="showSortMenu"
          class="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 rounded-lg shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] py-1 z-10"
        >
          <button
            v-for="option in sortOptions"
            :key="option.value"
            @click="selectSort(option.value)"
            class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
          >
            <span>{{ option.label }}</span>
            <Check v-if="sortBy === option.value" :size="13" class="text-lime-500" />
          </button>
        </div>
      </div>
    </div>

    <!-- Book list -->
    <div v-if="sortedBooks.length > 0" class="space-y-0.5">
      <div
        v-for="book in sortedBooks"
        :key="book.id"
        @click="emit('select-book', book.id)"
        class="group relative flex items-start gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer"
      >
        <!-- Cover -->
        <div class="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
          <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <BookOpen :size="16" class="text-zinc-400 dark:text-zinc-300" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 py-0.5">
          <p class="text-desktop-caption font-medium text-zinc-900 dark:text-white truncate">{{ book.title }}</p>
          <p class="text-desktop-footnote text-zinc-400 dark:text-zinc-300 truncate mt-0.5">{{ book.author }}</p>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <!-- Genre -->
            <span v-if="book.genre" class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="genreDotColor(book.genre)"></span>
              <span class="text-desktop-footnote text-zinc-400 dark:text-zinc-300">{{ book.genre }}</span>
            </span>
            <!-- Rating -->
            <span v-if="book.averageRating" class="flex items-center gap-0.5 text-desktop-footnote text-zinc-400 dark:text-zinc-300">
              <Star :size="10" fill="currentColor" class="text-amber-400" />
              {{ Number(book.averageRating).toFixed(1).replace('.0', '') }}
            </span>
            <!-- Review count -->
            <span v-if="book.reviewCount > 0" class="text-desktop-footnote text-zinc-400 dark:text-zinc-300">
              리뷰 {{ book.reviewCount }}개
            </span>
          </div>
          <!-- Completed date -->
          <p class="text-desktop-footnote text-zinc-400 dark:text-zinc-300 mt-1">
            {{ formatDate(book.date || book.user_finished_at) }} 종료
          </p>
        </div>

        <!-- Action menu trigger -->
        <div v-if="isAdmin && !isArchived" class="relative flex-shrink-0 pt-1">
          <button
            @click.stop="toggleMenu(book.id)"
            class="p-1 rounded-lg text-zinc-400 dark:text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-all"
          >
            <MoreHorizontal :size="14" />
          </button>
          <div
            v-if="openMenuId === book.id"
            class="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 rounded-lg shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] py-1 z-10"
          >
            <button
              @click.stop="handleAction('select-book', book)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Calendar :size="13" />
              타임라인 보기
            </button>
            <button
              @click.stop="handleAction('open-reviews', book)"
              :disabled="book.reviewCount === 0"
              class="w-full px-3 py-2 text-left text-desktop-caption hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              :class="book.reviewCount === 0 ? 'text-zinc-300 dark:text-zinc-300 cursor-not-allowed' : 'text-zinc-600 dark:text-zinc-400'"
            >
              <MessageCircle :size="13" />
              리뷰 보기
            </button>
            <div class="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>
            <button
              @click.stop="handleAction('restart-reading', book)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <RotateCcw :size="13" />
              종료 취소
            </button>
            <button
              @click.stop="handleAction('edit-finished-date', book)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Calendar :size="13" />
              종료 날짜 수정
            </button>
            <button
              @click.stop="handleAction('delete-history', book)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Trash2 :size="13" />
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="py-10 flex flex-col items-center gap-3">
      <BookOpen :size="28" class="text-zinc-300 dark:text-zinc-300" />
      <p class="text-desktop-caption text-zinc-400 dark:text-zinc-300">아직 종료한 책이 없어요</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowUpDown, BookOpen, MoreHorizontal, Star, Check, MessageCircle, Calendar, RotateCcw, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  books: any[]
  isAdmin?: boolean
  isArchived?: boolean
}>()

const emit = defineEmits(['select-book', 'open-reviews', 'restart-reading', 'edit-finished-date', 'delete-history'])

type SortKey = 'newest' | 'oldest' | 'title' | 'author'

const sortBy = ref<SortKey>('newest')
const showSortMenu = ref(false)
const openMenuId = ref<string | null>(null)

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'title', label: '제목순' },
  { value: 'author', label: '저자순' },
]

const sortLabel = computed(() => sortOptions.find(o => o.value === sortBy.value)?.label || '최신순')

const sortedBooks = computed(() => {
  const list = [...props.books]
  switch (sortBy.value) {
    case 'newest':
      return list.sort((a, b) => new Date(b.date || b.user_finished_at || 0).getTime() - new Date(a.date || a.user_finished_at || 0).getTime())
    case 'oldest':
      return list.sort((a, b) => new Date(a.date || a.user_finished_at || 0).getTime() - new Date(b.date || b.user_finished_at || 0).getTime())
    case 'title':
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'))
    case 'author':
      return list.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'ko'))
    default:
      return list
  }
})

const selectSort = (key: SortKey) => {
  sortBy.value = key
  showSortMenu.value = false
}

const genreDotColor = (genre: string) => {
  const dotMap: Record<string, string> = {
    '소설': 'bg-purple-500', '시/시집': 'bg-fuchsia-500', '에세이': 'bg-blue-500',
    '자기계발': 'bg-orange-500', '경영/경제': 'bg-emerald-500', '인문/철학': 'bg-indigo-500',
    '사회/정치': 'bg-red-500', '과학/기술': 'bg-cyan-500', '역사': 'bg-amber-500',
    '예술': 'bg-rose-500', '종교': 'bg-violet-500', '기타': 'bg-teal-500'
  }
  return dotMap[genre] || 'bg-zinc-400'
}

const formatDate = (d: string | undefined | null) => {
  if (!d) return ''
  const date = new Date(d)
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

const toggleMenu = (bookId: string) => {
  openMenuId.value = openMenuId.value === bookId ? null : bookId
}

const handleAction = (action: string, book: any) => {
  openMenuId.value = null
  if (action === 'select-book') {
    emit('select-book', book.id)
  } else if (action === 'open-reviews') {
    if (book.reviewCount > 0) emit('open-reviews', book.id)
  } else if (action === 'restart-reading') {
    emit('restart-reading', book.id)
  } else if (action === 'edit-finished-date') {
    emit('edit-finished-date', book.id)
  } else if (action === 'delete-history') {
    emit('delete-history', book.id)
  }
}

const closeMenus = () => {
  openMenuId.value = null
  showSortMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', closeMenus)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})
</script>
