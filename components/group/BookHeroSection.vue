<template>
  <div v-if="book" class="relative w-full pt-16 pb-8 bg-white dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800">
    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center px-6 text-center">
      <!-- Book Cover -->
      <div class="w-28 aspect-[2/3] shadow-2xl mb-5 transform transition-transform hover:scale-105 hover:-rotate-2 duration-500 relative">
        <img
          v-if="!hasError"
          :src="book.coverUrl"
          class="w-full h-full object-cover"
          @error="handleError"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-white font-bold text-4xl"
        >
          {{ book.title.charAt(0).toUpperCase() }}
        </div>
      </div>

      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-3 drop-shadow-sm line-clamp-2 px-4 leading-tight">
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
        <GenreBadge v-if="book.genre" :genre="book.genre" />
        
        <Badge v-if="book.round && book.round > 1">
          {{ book.round }}회차
        </Badge>

        <Badge v-if="book.target_start_date && book.target_end_date">
          {{ formatDateRange(book.target_start_date, book.target_end_date) }}
        </Badge>

        <!-- Members Badge (Social 그룹만) -->
        <Badge v-if="memberCount !== undefined">
          <template #icon><User :size="12" /></template>
          {{ memberCount }}
        </Badge>

        <!-- D-Day Badge -->
        <Badge v-if="book.status === 'reading' && daysRemaining !== null" variant="lime">
          {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}` }}
        </Badge>

        <!-- Finished Date Badge -->
        <Badge v-if="book.status === 'done' && book.finishedAt" variant="lime">
          {{ formatDate(book.finishedAt) }} {{ isSolo ? '완독' : '종료' }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from 'lucide-vue-next'
import { useImageError } from '~/composables/useImageError'
import Badge from '~/components/Badge.vue'
import GenreBadge from '~/components/GenreBadge.vue'

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
  memberCount?: number
  isSolo?: boolean
}

const props = defineProps<Props>()

const { hasError, handleError } = useImageError()

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear() % 100
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}.${month}.${day}`
}

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return ''
  return `${formatDate(start)} - ${formatDate(end)}`
}
</script>
