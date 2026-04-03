<template>
  <div class="space-y-3" v-if="currentData">
    <!-- 현재 보이는 월 요약 -->
    <div class="bg-zinc-50 dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-4">
      <h4 class="text-desktop-caption font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">{{ currentData.label }} 요약</h4>
      <div class="space-y-2.5">
        <div class="flex justify-between">
          <span class="text-desktop-caption-regular text-zinc-400 dark:text-zinc-300">코멘트</span>
          <span class="text-desktop-callout font-bold text-zinc-900 dark:text-white">{{ currentData.comments }}개</span>
        </div>
        <div class="flex justify-between">
          <span class="text-desktop-caption-regular text-zinc-400 dark:text-zinc-300">리뷰</span>
          <span class="text-desktop-callout font-bold text-zinc-900 dark:text-white">{{ currentData.reviews }}개</span>
        </div>
        <div class="h-px bg-zinc-100 dark:bg-zinc-800"></div>
        <div class="flex justify-between">
          <span class="text-desktop-caption-regular text-zinc-400 dark:text-zinc-300">총</span>
          <span class="text-desktop-callout font-bold text-lime-600 dark:text-lime-400">{{ currentData.total }}개</span>
        </div>
      </div>
    </div>
    <!-- 책별 기록 -->
    <div v-if="currentData.books.length > 0" class="bg-zinc-50 dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-4">
      <h4 class="text-desktop-caption font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">책별 기록</h4>
      <div class="space-y-2">
        <div v-for="book in currentData.books" :key="book.title" class="flex items-center gap-2.5">
          <div class="w-5 h-7 bg-zinc-100 dark:bg-zinc-800 overflow-hidden rounded flex-shrink-0">
            <img v-if="book.cover" :src="book.cover" class="w-full h-full object-cover" />
          </div>
          <p class="text-desktop-caption truncate flex-1 text-zinc-600 dark:text-zinc-400">{{ book.title }}</p>
          <span class="text-desktop-caption font-bold text-zinc-400 dark:text-zinc-300">{{ book.count }}</span>
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
  visibleMonth: string
}>()

// 모든 월 데이터 미리 계산
const monthsMap = computed(() => {
  const map = new Map<string, { label: string; comments: number; reviews: number; total: number; books: { title: string; cover: string; count: number }[] }>()
  if (!props.timeline) return map

  const tempMap = new Map<string, { comments: number; reviews: number; bookMap: Map<string, { title: string; cover: string; count: number }> }>()

  props.timeline.forEach(item => {
    const d = new Date(item.created_at)
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`

    if (!tempMap.has(key)) {
      tempMap.set(key, { comments: 0, reviews: 0, bookMap: new Map() })
    }
    const data = tempMap.get(key)!

    if (item.type === 'comment') data.comments++
    else if (item.type === 'review') data.reviews++

    const title = item.bookTitle || '알 수 없음'
    const existing = data.bookMap.get(title)
    if (existing) existing.count++
    else data.bookMap.set(title, { title, cover: item.bookCover || '', count: 1 })
  })

  for (const [key, data] of tempMap) {
    map.set(key, {
      label: key.replace('.', '년 ') + '월',
      comments: data.comments,
      reviews: data.reviews,
      total: data.comments + data.reviews,
      books: [...data.bookMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)
    })
  }

  return map
})

// 현재 보이는 월 데이터 (없으면 첫 번째 월)
const currentData = computed(() => {
  if (props.visibleMonth && monthsMap.value.has(props.visibleMonth)) {
    return monthsMap.value.get(props.visibleMonth)!
  }
  // fallback: 첫 번째 월
  const first = monthsMap.value.entries().next()
  return first.done ? null : first.value[1]
})
</script>
