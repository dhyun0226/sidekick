<template>
  <div
    @click="$emit('click')"
    class="apple-card overflow-hidden cursor-pointer hover:shadow-apple-lg transition-shadow duration-200 ease-apple group"
  >
    <div class="flex gap-5 p-5 pb-4">
      <!-- Book Cover -->
      <div class="w-20 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden shadow-apple">
        <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">📚</div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400 mb-1">{{ groupName }}</p>
          <h3 class="text-desktop-body font-semibold text-zinc-900 dark:text-white line-clamp-2 mb-1">{{ book.title }}</h3>
          <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400">{{ book.author }}</p>
        </div>

        <!-- Date & Percent -->
        <div class="flex justify-between items-center mt-3">
          <span class="text-desktop-caption text-zinc-400">{{ dateRange }}</span>
          <div class="flex items-center gap-2">
            <span v-if="dday" class="text-desktop-caption font-semibold px-2 py-0.5 rounded-md" :class="ddayClass">{{ dday }}</span>
            <span class="text-desktop-caption font-bold text-lime-600 dark:text-lime-400">{{ Math.round(book.progress) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Bar (Full Width, 카드 하단에 딱 붙음) -->
    <div class="h-1 bg-zinc-100 dark:bg-zinc-800">
      <div
        class="h-full bg-lime-500 transition-all duration-300"
        :style="{ width: `${book.progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  if (!props.book.target_end_date) return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
  const days = getDaysRemaining(props.book.target_end_date)
  if (days <= 3) return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  return 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400'
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
