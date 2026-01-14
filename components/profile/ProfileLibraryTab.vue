<template>
  <div class="space-y-6 pb-10">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="md" message="서재 불러오는 중..." />
    </div>

    <div v-else-if="library.length === 0" class="py-12 flex flex-col items-center text-center">
      <div class="text-4xl mb-2">📚</div>
      <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">서재가 비어있어요</h3>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">책을 완독하면 이곳에 쌓입니다.</p>
      <button @click="router.push('/')" class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg">책 읽으러 가기</button>
    </div>

    <div v-else class="space-y-6">
      <!-- Reading -->
      <div v-if="readingBooks.length > 0">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white">읽고 있는 책</h3>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ readingBooks.length }}권</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div v-for="book in readingBooks" :key="book.id" @click="$emit('open-book', book)" class="cursor-pointer active:opacity-70 transition-opacity opacity-60">
            <div class="aspect-[1/1.5] overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
              <img :src="book.cover_url" class="w-full h-full object-cover" />
            </div>
            <div class="mt-1 text-center">
              <div class="h-3 mb-0.5 flex items-center justify-center"><span class="text-[10px] text-zinc-400">읽는 중</span></div>
              <div class="text-[9px] text-zinc-400">{{ Math.round(book.progress_pct) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Finished -->
      <div v-for="group in libraryGroups" :key="group.label">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white">{{ formatGroupLabel(group.label) }}</h3>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ group.books.length }}권</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div v-for="book in group.books" :key="book.id" @click="$emit('open-book', book)" class="cursor-pointer active:opacity-70 transition-opacity">
            <div class="aspect-[1/1.5] overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
              <img :src="book.cover_url" class="w-full h-full object-cover" />
            </div>
            <div class="mt-1 text-center">
              <div v-if="book.myRating" class="flex items-center justify-center gap-0.5 mb-0.5"><Star :size="10" fill="#EAB308" class="text-yellow-500" /><span class="text-[10px] font-bold text-zinc-900 dark:text-white">{{ book.myRating }}</span></div>
              <div v-else class="h-3 mb-0.5 flex items-center justify-center"><span class="text-[10px] text-zinc-400">──</span></div>
              <div class="text-[9px] text-zinc-500">{{ formatMonthOnly(book.finished_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Star } from 'lucide-vue-next'
import LoadingSpinner from '~/components/LoadingSpinner.vue'

defineProps<{
  library: any[]
  readingBooks: any[]
  libraryGroups: any[]
  loading: boolean
}>()

defineEmits(['open-book'])

const router = useRouter()

const formatGroupLabel = (label: string) => {
  if (label.includes('.')) {
    const [y, m] = label.split('.')
    return `${y}년 ${parseInt(m)}월`
  }
  return `${label}년`
}

const formatMonthOnly = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>