<template>
  <div
    @click="$emit('click')"
    class="bg-white dark:bg-zinc-900 rounded-2xl cursor-pointer transition-all duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-apple-lg group"
  >
    <div class="flex gap-6 p-6">
      <!-- Book Cover -->
      <div class="w-24 aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden shadow-apple-lg">
        <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <BookOpen :size="20" class="text-zinc-400 dark:text-zinc-500" />
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <p class="text-desktop-caption text-zinc-400 dark:text-zinc-500 mb-1.5">{{ groupName }}</p>
          <h3 class="text-desktop-body font-semibold text-zinc-900 dark:text-white line-clamp-2 mb-1">{{ book.title }}</h3>
          <p class="text-desktop-caption text-zinc-400 dark:text-zinc-500">{{ book.author }}</p>
        </div>

        <!-- Date & Progress -->
        <div class="flex justify-between items-center mt-4">
          <span class="text-desktop-caption text-zinc-400 dark:text-zinc-500">{{ dateRange }}</span>
          <div class="flex items-center gap-3">
            <span v-if="dday" class="text-desktop-caption font-medium" :class="ddayClass">{{ dday }}</span>
            <span class="text-desktop-callout font-semibold text-lime-500">{{ Math.round(book.progress) }}%</span>
          </div>
        </div>

        <!-- Progress Bar - thin, integrated -->
        <div class="mt-3 h-[3px] rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-lime-500 transition-all duration-500 ease-apple"
            :style="{ width: `${book.progress}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen } from 'lucide-vue-next'

const props = defineProps<{
  book: {
    title: string
    author: string
    cover_url?: string
    progress: number
    target_start_date?: string
    target_end_date?: string
  }
  groupName: string
}>()

defineEmits(['click'])

const getDaysRemaining = (dateStr: string) => {
  const target = new Date(dateStr).getTime()
  const now = new Date().getTime()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

const dday = computed(() => {
  if (!props.book.target_end_date) return null
  const days = getDaysRemaining(props.book.target_end_date)
  if (days > 0) return `D-${days}`
  if (days === 0) return 'D-Day'
  return `D+${Math.abs(days)}`
})

const ddayClass = computed(() => {
  if (!props.book.target_end_date) return 'text-zinc-400 dark:text-zinc-500'
  const days = getDaysRemaining(props.book.target_end_date)
  if (days <= 3) return 'text-red-500 dark:text-red-400'
  return 'text-zinc-400 dark:text-zinc-500'
})

const formatDate = (d: string) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const dateRange = computed(() => {
  const start = props.book.target_start_date ? formatDate(props.book.target_start_date) : ''
  const end = props.book.target_end_date ? formatDate(props.book.target_end_date) : ''
  if (start && end) return `${start} ~ ${end}`
  if (start) return `${start} ~`
  return ''
})
</script>
