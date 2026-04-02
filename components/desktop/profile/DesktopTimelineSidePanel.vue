<template>
  <div class="w-56 flex-shrink-0 sticky top-0 self-start space-y-4 pt-1" v-if="months.length > 0">
    <!-- 월별 요약 (각 월) -->
    <div
      v-for="month in months"
      :key="month.key"
      class="bg-white dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-4"
    >
      <h4 class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">{{ month.label }} 요약</h4>
      <div class="space-y-2.5">
        <div class="flex justify-between">
          <span class="text-xs text-zinc-400 dark:text-zinc-300">코멘트</span>
          <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ month.comments }}개</span>
        </div>
        <div class="flex justify-between">
          <span class="text-xs text-zinc-400 dark:text-zinc-300">리뷰</span>
          <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ month.reviews }}개</span>
        </div>
        <div class="h-px bg-zinc-100 dark:bg-zinc-800"></div>
        <div class="flex justify-between">
          <span class="text-xs text-zinc-400 dark:text-zinc-300">총</span>
          <span class="text-sm font-bold text-lime-600 dark:text-lime-400">{{ month.total }}개</span>
        </div>
      </div>
      <!-- 책별 기록 -->
      <div v-if="month.books.length > 0" class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <h5 class="text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-2">책별 기록</h5>
        <div class="space-y-1.5">
          <div v-for="book in month.books" :key="book.title" class="flex items-center gap-2">
            <div class="w-4 h-6 bg-zinc-100 dark:bg-zinc-800 overflow-hidden rounded flex-shrink-0">
              <img v-if="book.cover" :src="book.cover" class="w-full h-full object-cover" />
            </div>
            <p class="text-[11px] truncate flex-1 text-zinc-600 dark:text-zinc-400">{{ book.title }}</p>
            <span class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300">{{ book.count }}</span>
          </div>
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

const months = computed(() => {
  if (!props.timeline || props.timeline.length === 0) return []

  // 타임라인에서 월별로 그룹핑
  const monthMap = new Map<string, { comments: number; reviews: number; bookMap: Map<string, { title: string; cover: string; count: number }> }>()

  props.timeline.forEach(item => {
    const d = new Date(item.created_at)
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`

    if (!monthMap.has(key)) {
      monthMap.set(key, { comments: 0, reviews: 0, bookMap: new Map() })
    }
    const data = monthMap.get(key)!

    if (item.type === 'comment') data.comments++
    else if (item.type === 'review') data.reviews++

    const title = item.bookTitle || '알 수 없음'
    const existing = data.bookMap.get(title)
    if (existing) existing.count++
    else data.bookMap.set(title, { title, cover: item.bookCover || '', count: 1 })
  })

  return [...monthMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, data]) => ({
      key,
      label: key.replace('.', '년 ') + '월',
      comments: data.comments,
      reviews: data.reviews,
      total: data.comments + data.reviews,
      books: [...data.bookMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)
    }))
})
</script>
