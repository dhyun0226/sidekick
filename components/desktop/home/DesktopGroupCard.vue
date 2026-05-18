<template>
  <div
    @click="$emit('click')"
    class="bg-white dark:bg-zinc-900 rounded-2xl cursor-pointer transition-all duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
  >
    <div class="flex items-center gap-4 p-5">
      <div v-if="group.currentBook" class="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-apple-sm bg-zinc-100 dark:bg-zinc-800">
        <img v-if="group.currentBook.cover_url" :src="group.currentBook.cover_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <BookOpen :size="16" class="text-zinc-400 dark:text-zinc-300" />
        </div>
      </div>
      <div v-else class="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
        <Coffee :size="18" class="text-zinc-400 dark:text-zinc-300" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h4 class="text-desktop-callout font-semibold text-zinc-900 dark:text-white truncate">{{ group.name }}</h4>
          <span class="text-desktop-footnote text-zinc-400 dark:text-zinc-300 flex-shrink-0 flex items-center gap-0.5">
            <Users :size="10" />
            {{ group.memberCount }}
          </span>
        </div>
        <p v-if="group.currentBook" class="text-desktop-caption text-zinc-500 dark:text-zinc-300 truncate">
          {{ group.currentBook.title }}
        </p>
        <p v-else class="text-desktop-caption text-zinc-500 dark:text-zinc-300">
          다음 책을 기다리는 중
        </p>
      </div>

      <div v-if="group.currentBook" class="flex-shrink-0 flex items-center gap-3">
        <div class="relative w-10 h-10">
          <svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-100 dark:text-zinc-800" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-lime-500 transition-all duration-500 ease-apple" :stroke-dasharray="`${group.currentBook.progress * 0.9425} 94.25`" />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-desktop-micro font-semibold text-zinc-600 dark:text-zinc-300">
            {{ Math.round(group.currentBook.progress) }}
          </span>
        </div>
      </div>
      <ChevronRight v-else :size="16" class="text-zinc-300 dark:text-zinc-500 flex-shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, Coffee, ChevronRight, BookOpen } from 'lucide-vue-next'

defineProps<{
  group: {
    id: string
    name: string
    memberCount: number
    currentBook?: {
      title: string
      cover_url?: string
      progress: number
    }
  }
}>()

defineEmits(['click'])
</script>
