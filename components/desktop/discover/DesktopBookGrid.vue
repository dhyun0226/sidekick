<template>
  <div>
    <!-- Section Header -->
    <div class="flex items-center gap-3 mb-6">
      <component :is="iconComponent" :size="18" class="text-zinc-400 dark:text-zinc-500" />
      <h2 class="text-desktop-headline font-semibold tracking-tight text-zinc-900 dark:text-white">{{ title }}</h2>
      <div class="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/60 ml-1"></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-5 gap-5">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="aspect-[2/3] bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-3"></div>
        <div class="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-md w-4/5 mb-2"></div>
        <div class="h-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-md w-3/5"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="books.length === 0" class="py-12 text-center">
      <p class="text-desktop-callout text-zinc-400 font-light">{{ emptyMessage }}</p>
    </div>

    <!-- Book Grid: 5 per row, max 2 rows -->
    <div v-else class="grid grid-cols-5 gap-5">
      <div
        v-for="(book, index) in books"
        :key="book.isbn"
        @click="$emit('book-click', book)"
        class="group cursor-pointer"
      >
        <!-- Cover -->
        <div class="relative mb-3">
          <!-- Rank -->
          <div
            class="absolute -top-1.5 -left-1.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-desktop-caption font-bold shadow-sm"
            :class="index < 3
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'"
          >
            {{ index + 1 }}
          </div>
          <div class="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200/50 dark:ring-zinc-700/50 group-hover:ring-zinc-300 dark:group-hover:ring-zinc-600 transition-all duration-200">
            <img
              v-if="book.cover_url"
              :src="book.cover_url"
              :alt="book.title"
              class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <BookOpen :size="24" class="text-zinc-400 dark:text-zinc-500" />
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="px-0.5">
          <h3 class="text-desktop-callout font-semibold text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-0.5">
            {{ book.title }}
          </h3>
          <p class="text-desktop-caption-regular text-zinc-400 truncate mb-1.5">{{ book.author }}</p>

          <!-- Contextual Label -->
          <p class="text-desktop-caption-regular leading-tight" :class="labelColor">
            <template v-if="type === 'hot'">{{ book.count }}명이 읽는 중</template>
            <template v-else-if="type === 'wish'">{{ book.count }}명이 담았어요</template>
            <template v-else-if="type === 'rating'">
              <span class="inline-flex items-center gap-0.5">
                <span class="text-amber-500">★</span>
                {{ book.avgRating?.toFixed(1) }}
                <span class="text-zinc-400">(리뷰 {{ book.reviewCount }}개)</span>
              </span>
            </template>
            <template v-else-if="type === 'completion'">
              완독률 {{ book.completionRate }}%
              <span class="text-zinc-400">({{ book.count }}명 참여)</span>
            </template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Heart, Star, CheckCircle, BookOpen } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  icon: string
  type: 'hot' | 'wish' | 'rating' | 'completion'
  books: any[]
  loading: boolean
  emptyMessage: string
}>()

const iconComponent = computed(() => {
  switch (props.icon) {
    case 'flame': return Flame
    case 'heart': return Heart
    case 'star': return Star
    case 'check-circle': return CheckCircle
    default: return Flame
  }
})

defineEmits(['book-click'])

const labelColor = computed(() => {
  switch (props.type) {
    case 'hot': return 'text-rose-500 dark:text-rose-400'
    case 'wish': return 'text-pink-500 dark:text-pink-400'
    case 'rating': return 'text-amber-600 dark:text-amber-400'
    case 'completion': return 'text-lime-600 dark:text-lime-400'
    default: return 'text-zinc-500'
  }
})
</script>
