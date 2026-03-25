<template>
  <div class="space-y-6 pb-10">
    <div v-if="loading" class="py-4">
      <SkeletonBookCard :count="8" :columns="4" />
    </div>

    <div v-else-if="library.length === 0" class="py-16 flex flex-col items-center text-center">
      <div class="w-20 h-20 bg-gradient-to-tr from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-5 shadow-inner">
        <BookOpen :size="28" class="text-zinc-300 dark:text-zinc-600" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">아직 완독한 책이 없어요</h3>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs leading-relaxed">
        그룹에서 책을 읽고 완독하면<br />이곳에 서재가 만들어집니다.
      </p>
      <button @click="router.push('/')" class="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple">책 읽으러 가기</button>
    </div>

    <div v-else class="space-y-6">
      <!-- Reading -->
      <div v-if="readingBooks.length > 0">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">읽고 있는 책</h3>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ readingBooks.length }}권</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="book in readingBooks"
            :key="book.id"
            @click="!book.isBookDeleted && !book.isDiscontinued && $emit('open-book', book)"
            class="transition-opacity"
            :class="[
              (book.isBookDeleted || book.isDiscontinued) ? 'opacity-40 cursor-not-allowed' : 'opacity-60 cursor-pointer active:opacity-70'
            ]"
          >
            <div class="aspect-[1/1.5] overflow-hidden shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] relative">
              <img :src="book.cover_url" class="w-full h-full object-cover" />
              <!-- 삭제됨 배지 -->
              <div v-if="book.isBookDeleted" class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span class="text-[8px] font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded">삭제됨</span>
              </div>
              <!-- 중단됨 배지 -->
              <div v-else-if="book.isDiscontinued" class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span class="text-[8px] font-semibold text-white bg-orange-500 px-1.5 py-0.5 rounded">중단됨</span>
              </div>
              <!-- 회차 배지 (2회차 이상일 때만) -->
              <div v-else-if="book.round && book.round > 1" class="absolute top-1 right-1 bg-black/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                {{ book.round }}회
              </div>
            </div>
            <div class="mt-1 flex items-center justify-center gap-1 text-[10px] text-zinc-400">
              <template v-if="book.target_end_date && !book.isBookDeleted && !book.isDiscontinued">
                <span class="font-semibold" :class="getDaysRemaining(book.target_end_date) < 0 ? 'text-red-500' : 'text-lime-600 dark:text-lime-400'">
                  {{ formatDday(book.target_end_date) }}
                </span>
                <span>·</span>
              </template>
              <span>{{ Math.round(book.progress_pct) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Finished -->
      <div v-for="group in libraryGroups" :key="group.label">
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">{{ formatGroupLabel(group.label) }}</h3>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ group.books.length }}권</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="book in group.books"
            :key="book.id"
            @click="!book.isBookDeleted && $emit('open-book', book)"
            class="transition-opacity"
            :class="[
              book.isBookDeleted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:opacity-70'
            ]"
          >
            <div class="aspect-[1/1.5] overflow-hidden shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] relative">
              <img :src="book.cover_url" class="w-full h-full object-cover" />
              <!-- 삭제됨 배지 -->
              <div v-if="book.isBookDeleted" class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span class="text-[8px] font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded">삭제됨</span>
              </div>
              <!-- 회차 배지 (2회차 이상일 때만) -->
              <div v-else-if="book.round && book.round > 1" class="absolute top-1 right-1 bg-black/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                {{ book.round }}회
              </div>
            </div>
            <div class="mt-1 flex items-center justify-center gap-1 text-[10px]">
              <template v-if="book.myRating && !book.isBookDeleted">
                <Star :size="10" fill="#EAB308" class="text-yellow-500" />
                <span class="font-semibold text-zinc-900 dark:text-white">{{ book.myRating }}</span>
                <span class="text-zinc-300 dark:text-zinc-600">·</span>
              </template>
              <span class="text-zinc-500">{{ formatMonthOnly(book.finished_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Star, BookOpen } from 'lucide-vue-next'

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

const getDaysRemaining = (targetDateStr: string) => {
  const target = new Date(targetDateStr)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const formatDday = (targetDateStr: string) => {
  const days = getDaysRemaining(targetDateStr)
  if (days > 0) return `D-${days}`
  if (days === 0) return 'D-Day'
  return `D+${Math.abs(days)}`
}
</script>