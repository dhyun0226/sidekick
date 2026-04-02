<template>
  <div class="w-56 flex-shrink-0 sticky top-[120px] self-start space-y-4" v-if="currentMonth">
    <!-- 월별 요약 -->
    <div class="bg-white dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-4">
      <h4 class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">{{ currentMonth }} 요약</h4>
      <div class="space-y-2.5">
        <div class="flex justify-between">
          <span class="text-xs text-zinc-400 dark:text-zinc-300">코멘트</span>
          <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ commentCount }}개</span>
        </div>
        <div class="flex justify-between">
          <span class="text-xs text-zinc-400 dark:text-zinc-300">리뷰</span>
          <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ reviewCount }}개</span>
        </div>
        <div class="h-px bg-zinc-100 dark:bg-zinc-800"></div>
        <div class="flex justify-between">
          <span class="text-xs text-zinc-400 dark:text-zinc-300">총</span>
          <span class="text-sm font-bold text-lime-600 dark:text-lime-400">{{ totalCount }}개</span>
        </div>
      </div>
    </div>
    <!-- 책별 기록 -->
    <div class="bg-white dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-4" v-if="bookStats.length > 0">
      <h4 class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">책별 기록</h4>
      <div class="space-y-2">
        <div
          v-for="book in bookStats"
          :key="book.title"
          class="flex items-center gap-2"
        >
          <div class="w-5 h-7 bg-zinc-100 dark:bg-zinc-800 overflow-hidden rounded flex-shrink-0">
            <img v-if="book.cover" :src="book.cover" class="w-full h-full object-cover" />
          </div>
          <p class="text-xs truncate flex-1 text-zinc-700 dark:text-zinc-300">{{ book.title }}</p>
          <span class="text-xs font-bold text-zinc-400 dark:text-zinc-300">{{ book.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  timeline: any[]
  monthlyTotals: Record<string, number>
}>()

// 가장 최근 월 기준으로 요약
const currentMonth = computed(() => {
  if (!props.timeline || props.timeline.length === 0) return ''
  const first = props.timeline[0]
  if (!first?.created_at) return ''
  const d = new Date(first.created_at)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
})

const currentMonthKey = computed(() => {
  if (!props.timeline || props.timeline.length === 0) return ''
  const first = props.timeline[0]
  if (!first?.created_at) return ''
  const d = new Date(first.created_at)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
})

const currentMonthItems = computed(() => {
  if (!currentMonthKey.value) return []
  return props.timeline.filter(item => {
    const d = new Date(item.created_at)
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    return key === currentMonthKey.value
  })
})

const commentCount = computed(() => currentMonthItems.value.filter(i => i.type === 'comment').length)
const reviewCount = computed(() => currentMonthItems.value.filter(i => i.type === 'review').length)
const totalCount = computed(() => currentMonthItems.value.length)

const bookStats = computed(() => {
  const map = new Map<string, { title: string; cover: string; count: number }>()
  currentMonthItems.value.forEach(item => {
    const title = item.bookTitle || '알 수 없음'
    const existing = map.get(title)
    if (existing) {
      existing.count++
    } else {
      map.set(title, { title, cover: item.bookCover || '', count: 1 })
    }
  })
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
})
</script>
