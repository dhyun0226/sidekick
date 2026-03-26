<template>
  <div class="mb-6">
    <!-- Section Header -->
    <div class="flex items-center gap-2 mb-3 px-1">
      <component :is="iconComponent" :size="16" :class="iconColor" />
      <h2 class="text-sm font-semibold text-zinc-900 dark:text-white">{{ title }}</h2>
      <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex gap-3 overflow-hidden">
      <div v-for="i in 4" :key="i" class="flex-shrink-0 w-28">
        <div class="aspect-[2/3] rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2"></div>
        <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-1"></div>
        <div class="h-2 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="books.length === 0" class="py-8 text-center">
      <p class="text-sm text-zinc-400 dark:text-zinc-400">{{ emptyMessage }}</p>
    </div>

    <!-- Book List (Horizontal Scroll) -->
    <div v-else class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      <DiscoverBookCard
        v-for="(book, index) in books"
        :key="book.isbn"
        :book="book"
        :rank="index + 1"
        :type="type"
        @click="$emit('book-click', book)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Heart, Star, CheckCircle } from 'lucide-vue-next'
import type { DiscoverBook } from '~/composables/useDiscover'
import DiscoverBookCard from './DiscoverBookCard.vue'

const props = defineProps<{
  title: string
  icon: string
  books: DiscoverBook[]
  type: 'hot' | 'wish' | 'rating' | 'completion'
  loading?: boolean
  emptyMessage?: string
}>()

const iconMap: Record<string, any> = {
  flame: Flame,
  heart: Heart,
  star: Star,
  'check-circle': CheckCircle
}

const iconColorMap: Record<string, string> = {
  flame: 'text-orange-500',
  heart: 'text-pink-500',
  star: 'text-yellow-500',
  'check-circle': 'text-green-500'
}

const iconComponent = computed(() => iconMap[props.icon] || Flame)
const iconColor = computed(() => iconColorMap[props.icon] || 'text-zinc-400 dark:text-zinc-300')

defineEmits(['book-click'])
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
