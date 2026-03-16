<template>
  <div
    @click="$emit('click')"
    class="apple-card overflow-hidden cursor-pointer hover:shadow-apple-lg transition-shadow duration-200 ease-apple"
  >
    <div class="flex items-center gap-4 p-4">
      <!-- Book Cover / Idle Icon -->
      <div v-if="group.currentBook" class="w-12 h-16 flex-shrink-0 rounded-md overflow-hidden shadow-apple-sm">
        <img :src="group.currentBook.cover_url" class="w-full h-full object-cover" />
      </div>
      <div v-else class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <Coffee :size="20" class="text-zinc-400" />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <h4 class="text-desktop-callout text-zinc-900 dark:text-white truncate">{{ group.name }}</h4>
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[11px] text-zinc-500 flex-shrink-0">
            <Users :size="11" />
            {{ group.memberCount }}
          </span>
        </div>
        <p v-if="group.currentBook" class="text-desktop-caption text-zinc-500 dark:text-zinc-400 truncate">
          {{ group.currentBook.title }}
        </p>
        <p v-else class="text-desktop-caption text-zinc-400">
          새 책을 기다리고 있어요
        </p>
      </div>

      <!-- Progress % -->
      <span v-if="group.currentBook" class="text-desktop-caption font-bold text-lime-600 dark:text-lime-400 flex-shrink-0">
        {{ Math.round(group.currentBook.progress) }}%
      </span>
      <ChevronRight v-else :size="16" class="text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
    </div>

    <!-- Progress Bar (Full Width) -->
    <div v-if="group.currentBook" class="h-0.5 bg-zinc-100 dark:bg-zinc-800">
      <div
        class="h-full bg-lime-500 transition-all duration-300"
        :style="{ width: `${group.currentBook.progress}%` }"
      ></div>
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
