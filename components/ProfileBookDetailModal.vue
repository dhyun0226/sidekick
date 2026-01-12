<template>
  <div v-if="isOpen && book" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="$emit('close')"></div>
    <div class="relative min-h-screen flex items-start justify-center p-4">
      <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8 overflow-hidden">

        <!-- Header with Book Cover -->
        <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <!-- Close Button Row -->
          <div class="flex items-center justify-between px-4 pt-4 pb-3">
            <h3 class="text-xs font-bold text-zinc-500 uppercase">책 상세</h3>
            <button @click="$emit('close')" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <X :size="20" class="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          <!-- Book Info -->
          <div class="px-4 pb-6 flex gap-4">
            <div class="w-20 h-28 overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
              <img :src="book.cover_url" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col pt-0.5">
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight mb-3">{{ book.title }}</h2>
              <div class="flex flex-wrap items-center gap-1.5 mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                <span class="font-medium">{{ book.author }}</span>
                <template v-if="book.publisher || book.total_pages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="book.publisher" class="truncate max-w-[120px]">{{ book.publisher }}</span>
                  <span v-if="book.publisher && book.total_pages" class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="book.total_pages">{{ book.total_pages }}p</span>
                </template>
              </div>

              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <GenreBadge v-if="book.genre" :genre="book.genre" />
                <RatingBadge :rating="book.myRating" />
                <Badge>
                  {{ bookTimeline.length }}개 기록
                </Badge>
                <Badge v-if="book.finished_at" variant="lime">
                  {{ formatCompletionDate(book.finished_at) }} 완독
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div class="flex px-4">
            <button
              @click="tab = 'all'"
              class="flex-1 py-3 text-sm font-bold transition-colors relative"
              :class="tab === 'all' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
            >
              전체
              <div v-if="tab === 'all'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
            </button>
            <button
              @click="tab = 'review'"
              class="flex-1 py-3 text-sm font-bold transition-colors relative"
              :class="tab === 'review' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
            >
              리뷰
              <div v-if="tab === 'review'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
            </button>
            <button
              @click="tab = 'comments'"
              class="flex-1 py-3 text-sm font-bold transition-colors relative"
              :class="tab === 'comments' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
            >
              코멘트
              <div v-if="tab === 'comments'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto">

          <!-- All Tab / Comments Tab -->
          <template v-if="tab !== 'review'">
            <div
              v-for="item in (tab === 'all' ? bookTimeline : bookComments)"
              :key="item.id"
              @click="book?.finished_at ? $emit('navigate', item) : null"
              :class="[
                'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
                book?.finished_at
                  ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                  : 'cursor-default opacity-60'
              ]"
            >
              <!-- Meta Info -->
              <div class="flex items-center gap-2 mb-3 text-[13px]">
                <span class="text-zinc-500 dark:text-zinc-400 font-medium">{{ item.groupName }}</span>
                <span class="text-zinc-300 dark:text-zinc-700">·</span>
                <span class="text-zinc-500 dark:text-zinc-400">{{ formatDateTime(item.created_at) }}</span>
                <span class="text-zinc-300 dark:text-zinc-700">·</span>

                <!-- Review Badge (if in 'all' tab) -->
                <template v-if="item.type === 'review'">
                  <RatingBadge :rating="item.rating" size="sm" />
                </template>

                <Badge v-else variant="lime" size="sm">
                  {{ Math.round(item.position_pct) }}%
                </Badge>
                
                <Badge v-if="item.isReply" variant="secondary" size="sm" class="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-none">
                  답글
                </Badge>
              </div>

              <!-- Reply Context -->
              <div v-if="comment.isReply && comment.parentData" class="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border-l-4 border-zinc-200 dark:border-zinc-700 text-left">
                <p class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">{{ comment.parentData.nickname }}님의 기록에 대한 답글</p>
                <p v-if="comment.parentData.anchor_text" class="text-[11px] text-zinc-400 italic mb-1 line-clamp-1">{{ comment.parentData.anchor_text }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{{ comment.parentData.content }}</p>
              </div>

              <!-- Quote -->
              <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 text-left">
                <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                  {{ item.anchor_text }}
                </p>
              </div>

              <!-- Content -->
              <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed text-left">
                {{ item.content }}
              </p>
            </div>

            <!-- Empty State -->
            <div v-if="(tab === 'all' ? bookTimeline : bookComments).length === 0" class="py-12 text-center">
              <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                📝
              </div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">기록이 없습니다</h3>
              <p class="text-xs text-zinc-500">이 책에 대한 생각을 남겨보세요</p>
            </div>
          </template>

          <!-- Review Tab -->
          <div v-else>
            <div
              v-if="bookReview"
              @click="book?.finished_at ? $emit('navigate', bookReview) : null"
              :class="[
                'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all',
                book?.finished_at
                  ? 'cursor-pointer hover:border-lime-400 dark:hover:border-lime-500'
                  : 'cursor-default opacity-60'
              ]"
            >
              <!-- Meta Info -->
              <div class="flex items-center gap-2 mb-3 text-[13px]">
                <span class="text-zinc-500 dark:text-zinc-400 font-medium">{{ bookReview.groupName }}</span>
                <span class="text-zinc-300 dark:text-zinc-700">·</span>
                <span class="text-zinc-500 dark:text-zinc-400">{{ formatDateTime(bookReview.created_at) }}</span>
                <span class="text-zinc-300 dark:text-zinc-700">·</span>
                
                <!-- Review: Show unified rating badge -->
                <RatingBadge :rating="bookReview.rating" size="sm" />
              </div>

              <!-- Content -->
              <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed text-left">
                {{ bookReview.content }}
              </p>
            </div>
            <div v-else class="py-12 text-center">
              <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                ⭐
              </div>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">리뷰가 없습니다</h3>
              <p class="text-xs text-zinc-500">이 책에 대한 리뷰를 남겨보세요</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import GenreBadge from './GenreBadge.vue'
import RatingBadge from './RatingBadge.vue'
import Badge from './Badge.vue'

const props = defineProps<{
  isOpen: boolean
  book: any | null
  timeline: any[]
}>()

const emit = defineEmits(['close', 'navigate'])

const tab = ref<'all' | 'review' | 'comments'>('all')

const bookTimeline = computed(() => {
  if (!props.book) return []
  return props.timeline.filter(item => item.groupBookId === props.book.groupBookId)
})

const bookReview = computed(() => {
  return bookTimeline.value.find(item => item.type === 'review')
})

const bookComments = computed(() => {
  return bookTimeline.value.filter(item => item.type === 'comment')
})

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = String(date.getFullYear()).slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

const formatCompletionDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = String(date.getFullYear()).slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}.${month}.${day}`
}
</script>