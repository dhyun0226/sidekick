<template>
  <div v-if="book" class="relative w-full pt-20 pb-8 overflow-hidden bg-zinc-900">
    <!-- Background (Blurred) -->
    <div class="absolute inset-0 z-0">
      <img
        v-if="!hasError"
        :src="book.coverUrl"
        class="w-full h-full object-cover blur-2xl opacity-70 scale-125"
        @error="handleError"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-zinc-400 to-zinc-600 dark:from-zinc-700 dark:to-zinc-900"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-gray-50 dark:to-background"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center px-6 text-center">
      <!-- Book Cover (3D Effect) -->
      <div class="w-28 aspect-[2/3] rounded-lg shadow-2xl mb-5 transform transition-transform hover:scale-105 hover:-rotate-2 duration-500 relative">
        <img
          v-if="!hasError"
          :src="book.coverUrl"
          class="w-full h-full object-cover rounded-lg"
          @error="handleError"
        />
        <div
          v-else
          class="w-full h-full rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-white font-bold text-4xl"
        >
          {{ book.title.charAt(0).toUpperCase() }}
        </div>
        <!-- Round Badge -->
        <div v-if="book.round" class="absolute -top-2 -right-2 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center text-xs font-bold text-black border-2 border-white dark:border-zinc-900 shadow-lg z-20">
          {{ book.round }}회
        </div>
      </div>

      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-1 drop-shadow-sm line-clamp-2 px-4 leading-tight">
        {{ book.title }}
      </h2>
      <div class="flex flex-wrap items-center justify-center gap-1.5 mb-3 text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-none">
        <span>{{ book.author }}</span>
        <template v-if="book.publisher || book.total_pages">
          <span class="text-zinc-300 dark:text-zinc-700">·</span>
          <span v-if="book.publisher">{{ book.publisher }}</span>
          <span v-if="book.publisher && book.total_pages" class="text-zinc-300 dark:text-zinc-700">·</span>
          <span v-if="book.total_pages">{{ book.total_pages }}p</span>
        </template>
      </div>

      <!-- Badges Line (Synchronized with Drawer Info Tab) -->
      <div class="flex flex-wrap items-center justify-center gap-1.5 mb-6">
        <GenreBadge v-if="book.genre" :genre="book.genre" size="sm" variant="glass" />
        
        <div v-if="book.round && book.round > 1" class="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-white/40 dark:bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm">
          {{ book.round }}회차
        </div>

        <div v-if="book.target_start_date && book.target_end_date" class="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-white/40 dark:bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm">
          {{ formatDateRange(book.target_start_date, book.target_end_date) }}
        </div>

        <!-- Members Badge -->
        <div class="flex items-center gap-1 bg-white/40 dark:bg-black/20 backdrop-blur-md text-zinc-700 dark:text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
           <User :size="10" />
           <span>{{ memberCount }}</span>
        </div>

        <!-- D-Day Badge -->
        <div v-if="book.status === 'reading' && daysRemaining !== null" class="text-[10px] font-bold text-lime-600 dark:text-lime-400 bg-white/40 dark:bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm">
          {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}` }}
        </div>

        <!-- Finished Date Badge -->
        <div v-if="book.status === 'done' && book.finishedAt" class="text-[10px] font-bold text-lime-700 dark:text-lime-400 bg-white/40 dark:bg-black/20 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm">
          {{ formatDate(book.finishedAt) }} 완주
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from 'lucide-vue-next'
import { useImageError } from '~/composables/useImageError'

interface Book {
  coverUrl: string
  title: string
  author: string
  publisher?: string | null
  total_pages?: number | null
  genre?: string | null
  status: 'reading' | 'done'
  round?: number | null
  finishedAt?: string | null
  target_start_date?: string | null
  target_end_date?: string | null
}

interface Props {
  book: Book | null
  daysRemaining: number | null
  memberCount: number
}

const props = defineProps<Props>()

const { hasError, handleError } = useImageError()

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear() % 100
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}.${month}.${day}`
}

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return ''
  return `${formatDate(start)} - ${formatDate(end)}`
}
</script>