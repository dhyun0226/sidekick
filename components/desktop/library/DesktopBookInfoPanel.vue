<template>
  <div class="space-y-6">
    <!-- Book Cover & Info -->
    <div v-if="book">
      <div class="relative mx-auto w-32 h-[184px] rounded-xl overflow-hidden shadow-apple-lg mb-5 group/cover">
        <img v-if="book.book?.cover_url" :src="book.book.cover_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-4xl">📚</div>
        <!-- Subtle progress overlay -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div class="h-full bg-lime-400 transition-all duration-500" :style="{ width: `${viewProgress}%` }"></div>
        </div>
      </div>
      <div class="text-center">
        <h3 class="text-desktop-callout text-zinc-900 dark:text-white mb-1 leading-snug">{{ book.book?.title }}</h3>
        <p class="text-desktop-caption text-zinc-500">{{ book.book?.author }}</p>
        <p v-if="book.book?.publisher" class="text-desktop-caption text-zinc-400 mt-0.5">{{ book.book.publisher }}</p>
      </div>
    </div>

    <!-- Progress Card -->
    <div v-if="book" class="apple-card p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-desktop-caption text-zinc-500 uppercase tracking-wider">진행률</h4>
        <span class="text-desktop-callout font-bold tabular-nums" :class="viewProgress >= 100 ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-900 dark:text-white'">
          {{ Math.round(viewProgress) }}%
        </span>
      </div>
      <DesktopProgressInput
        :model-value="viewProgress"
        :total-pages="book.total_pages"
        :preferred-mode="preferredMode"
        :disabled="isArchived"
        @update:model-value="$emit('progress-change', $event)"
        @update:mode="$emit('mode-change', $event)"
      />
      <div class="mt-3 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="viewProgress >= 100 ? 'bg-lime-500' : 'bg-gradient-to-r from-lime-400 to-emerald-500'"
          :style="{ width: `${Math.min(viewProgress, 100)}%` }"
        ></div>
      </div>
      <!-- Remaining estimate -->
      <p v-if="book.total_pages && viewProgress < 100 && viewProgress > 0" class="text-[11px] text-zinc-400 mt-2 text-right">
        {{ Math.round(book.total_pages * (1 - viewProgress / 100)) }}p 남음
      </p>
    </div>

    <!-- Book Details -->
    <div v-if="book" class="apple-card p-4 space-y-2.5">
      <h4 class="text-desktop-caption text-zinc-500 uppercase tracking-wider mb-1">정보</h4>
      <div v-if="book.total_pages" class="flex justify-between items-center">
        <span class="text-desktop-caption text-zinc-500 flex items-center gap-1.5">
          <BookOpen :size="12" />
          페이지
        </span>
        <span class="text-desktop-caption font-semibold text-zinc-900 dark:text-white">{{ book.total_pages }}p</span>
      </div>
      <div v-if="book.genre" class="flex justify-between items-center">
        <span class="text-desktop-caption text-zinc-500 flex items-center gap-1.5">
          <Tag :size="12" />
          장르
        </span>
        <span class="text-desktop-caption font-semibold text-zinc-900 dark:text-white">{{ book.genre }}</span>
      </div>
      <div v-if="book.target_start_date" class="flex justify-between items-center">
        <span class="text-desktop-caption text-zinc-500 flex items-center gap-1.5">
          <Calendar :size="12" />
          기간
        </span>
        <span class="text-desktop-caption font-semibold text-zinc-900 dark:text-white">
          {{ formatDate(book.target_start_date) }} ~ {{ book.target_end_date ? formatDate(book.target_end_date) : '' }}
        </span>
      </div>
      <!-- D-day -->
      <div v-if="daysRemaining !== null && !isArchived" class="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex justify-between items-center">
          <span class="text-desktop-caption text-zinc-500">남은 기간</span>
          <span class="text-desktop-caption font-bold" :class="daysRemaining <= 3 ? 'text-red-500' : daysRemaining <= 7 ? 'text-amber-500' : 'text-zinc-900 dark:text-white'">
            {{ daysRemaining <= 0 ? '마감일 지남' : `D-${daysRemaining}` }}
          </span>
        </div>
      </div>
    </div>

    <!-- TOC -->
    <div v-if="toc && toc.length > 0" class="apple-card p-4">
      <h4 class="text-desktop-caption text-zinc-500 uppercase tracking-wider mb-3">목차</h4>
      <div class="space-y-0.5 max-h-64 overflow-y-auto">
        <button
          v-for="(chapter, idx) in toc"
          :key="idx"
          @click="$emit('jump-to-chapter', chapter.start ?? 0)"
          class="w-full text-left px-2.5 py-2 rounded-lg text-desktop-caption transition-all flex items-center gap-2"
          :class="isCurrentChapter(chapter)
            ? 'bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'"
        >
          <div
            class="w-1.5 h-1.5 rounded-full flex-shrink-0"
            :class="isCurrentChapter(chapter) ? 'bg-lime-500' : isPastChapter(chapter) ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-zinc-200 dark:bg-zinc-700'"
          ></div>
          <span class="truncate">{{ chapter.title }}</span>
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="!isArchived" class="space-y-1">
      <button
        @click="$emit('edit-dates')"
        class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
      >
        <Calendar :size="14" />
        기간 수정
      </button>
      <button
        @click="$emit('edit-toc')"
        class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
      >
        <List :size="14" />
        목차 수정
      </button>
      <button
        @click="$emit('edit-genre')"
        class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
      >
        <Tag :size="14" />
        장르 수정
      </button>
      <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
        <button
          v-if="!book.user_finished_at"
          @click="$emit('mark-finished')"
          class="w-full px-3 py-2.5 text-desktop-caption text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-xl transition-colors text-left flex items-center gap-2.5"
        >
          <CheckCircle :size="14" />
          완독 처리
        </button>
        <button
          v-if="book.user_finished_at"
          @click="$emit('unmark-finished')"
          class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
        >
          <Undo2 :size="14" />
          완독 취소
        </button>
        <button
          v-if="showMarkCompleted && book.status === 'reading'"
          @click="$emit('mark-completed')"
          class="w-full px-3 py-2.5 text-desktop-caption text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors text-left flex items-center gap-2.5"
        >
          <CheckCircle :size="14" />
          완주 처리 (책장으로 이동)
        </button>
        <button
          v-if="book.user_finished_at"
          @click="$emit('open-review')"
          class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
        >
          <Star :size="14" />
          리뷰 작성
        </button>
        <button
          v-if="book.status === 'done'"
          @click="$emit('open-reviews')"
          class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
        >
          <MessageSquare :size="14" />
          리뷰 보기
        </button>
        <button
          @click="$emit('delete-book')"
          class="w-full px-3 py-2.5 text-desktop-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left flex items-center gap-2.5"
        >
          <Trash2 :size="14" />
          삭제
        </button>
      </div>
    </div>

    <!-- Archived book actions -->
    <div v-if="isArchived" class="space-y-1">
      <button
        v-if="book.user_finished_at"
        @click="$emit('unmark-finished')"
        class="w-full px-3 py-2.5 text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left flex items-center gap-2.5"
      >
        <Undo2 :size="14" />
        완독 취소
      </button>
      <button
        @click="$emit('delete-book')"
        class="w-full px-3 py-2.5 text-desktop-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left flex items-center gap-2.5"
      >
        <Trash2 :size="14" />
        삭제
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, List, CheckCircle, Tag, Trash2, Undo2, BookOpen, Star, MessageSquare } from 'lucide-vue-next'
import DesktopProgressInput from './DesktopProgressInput.vue'
import type { TocChapter } from '~/types'

const props = defineProps<{
  book: any
  viewProgress: number
  toc?: TocChapter[]
  isArchived?: boolean
  preferredMode?: 'percent' | 'page'
  showMarkCompleted?: boolean
}>()

defineEmits(['progress-change', 'mode-change', 'jump-to-chapter', 'edit-dates', 'edit-toc', 'mark-finished', 'delete-book', 'edit-genre', 'unmark-finished', 'mark-completed', 'open-review', 'open-reviews'])

const isCurrentChapter = (chapter: TocChapter) => {
  const pct = props.viewProgress
  const start = chapter.start ?? 0
  const end = chapter.end ?? 100
  return pct >= start && pct < end
}

const isPastChapter = (chapter: TocChapter) => {
  return props.viewProgress >= (chapter.end ?? 100)
}

const daysRemaining = computed(() => {
  if (!props.book?.target_end_date) return null
  const now = new Date()
  const end = new Date(props.book.target_end_date)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
})

const formatDate = (d: string) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>
