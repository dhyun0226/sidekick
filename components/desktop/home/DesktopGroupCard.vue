<template>
  <div
    @click="$emit('click')"
    class="bg-white dark:bg-zinc-900 rounded-2xl cursor-pointer transition-all duration-300 ease-apple hover:-translate-y-0.5 hover:shadow-apple-lg"
  >
    <div class="flex items-center gap-4 p-5">
      <!-- Book Cover / Idle Icon -->
      <div v-if="group.currentBook" class="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-apple-sm">
        <img :src="group.currentBook.cover_url" class="w-full h-full object-cover" />
      </div>
      <div v-else class="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
        <Coffee :size="18" class="text-zinc-300 dark:text-zinc-600" />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h4 class="text-desktop-callout font-medium text-zinc-900 dark:text-white truncate">{{ group.name }}</h4>
          <span class="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 flex items-center gap-0.5">
            <Users :size="10" />
            {{ group.memberCount }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <p v-if="group.currentBook" class="text-desktop-caption text-zinc-400 dark:text-zinc-500 truncate">
            {{ group.currentBook.title }}
          </p>
          <p v-else class="text-desktop-caption text-zinc-300 dark:text-zinc-600">
            새 책을 기다리고 있어요
          </p>
        </div>
      </div>

      <!-- Progress -->
      <div v-if="group.currentBook" class="flex-shrink-0 flex items-center gap-3">
        <!-- Mini circular-style progress indicator -->
        <div class="relative w-10 h-10">
          <svg class="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-100 dark:text-zinc-800" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-lime-500 transition-all duration-500 ease-apple" :stroke-dasharray="`${group.currentBook.progress * 0.9425} 94.25`" />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
            {{ Math.round(group.currentBook.progress) }}
          </span>
        </div>
      </div>
      <ChevronRight v-else :size="16" class="text-zinc-200 dark:text-zinc-700 flex-shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, Coffee, ChevronRight } from 'lucide-vue-next'

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
