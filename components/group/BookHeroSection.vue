<template>
  <div v-if="book" class="relative w-full pt-20 pb-8 overflow-hidden bg-zinc-900">
    <!-- Background (Blurred) -->
    <div class="absolute inset-0 z-0">
      <img :src="book.coverUrl" class="w-full h-full object-cover blur-2xl opacity-70 scale-125" />
      <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-gray-50 dark:to-background"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center px-6 text-center">
      <!-- Book Cover (3D Effect) -->
      <div class="w-28 aspect-[2/3] rounded-lg shadow-2xl mb-5 transform transition-transform hover:scale-105 hover:-rotate-2 duration-500 relative">
        <img :src="book.coverUrl" class="w-full h-full object-cover rounded-lg border border-white/10" />
        <!-- Round Badge -->
        <div v-if="book.round" class="absolute -top-2 -right-2 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center text-xs font-bold text-black border-2 border-white dark:border-zinc-900 shadow-lg z-20">
          {{ book.round }}회
        </div>
      </div>

      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-1 drop-shadow-sm line-clamp-2 px-4 leading-tight">
        {{ book.title }}
      </h2>
      <p class="text-xs text-zinc-600 dark:text-zinc-400 font-medium mb-4 opacity-80">
        {{ book.author }}
      </p>

      <!-- Stats / D-Day -->
      <div class="flex items-center gap-3">
        <!-- 완독 뱃지 또는 D-Day 뱃지 -->
        <div v-if="book.status === 'done'" class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 backdrop-blur-md rounded-full border border-green-400/50 shadow-sm">
           <span class="text-xs font-bold text-white">
             ✅ 완독
           </span>
        </div>
        <div v-else-if="book.status === 'reading' && daysRemaining !== null" class="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
           <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">
             {{ daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}` }}
           </span>
        </div>

        <!-- 멤버 수 -->
        <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
           <User :size="12" class="text-zinc-700 dark:text-zinc-300" />
           <span class="text-xs font-bold text-zinc-800 dark:text-zinc-200">
             {{ book.status === 'reading' ? `${memberCount}명 함께 읽는 중` : `${memberCount}명이 함께 읽었어요` }}
           </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from 'lucide-vue-next'

interface Book {
  coverUrl: string
  title: string
  author: string
  status: 'reading' | 'done'
  round?: number | null
}

interface Props {
  book: Book | null
  daysRemaining: number | null
  memberCount: number
}

defineProps<Props>()
</script>
