<template>
  <div
    @click="$emit('click', book)"
    class="flex-shrink-0 w-28 cursor-pointer active:scale-95 transition-transform"
  >
    <!-- Book Cover -->
    <div class="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md bg-zinc-100 dark:bg-zinc-800 mb-2">
      <img
        :src="book.cover_url"
        :alt="book.title"
        class="w-full h-full object-cover"
        @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
      />
      <!-- Rank Badge -->
      <div
        v-if="rank"
        class="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-md"
        :class="rankBadgeClass"
      >
        {{ rank }}
      </div>
    </div>

    <!-- Book Info -->
    <h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate mb-0.5">
      {{ book.title }}
    </h4>
    <p class="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mb-1">
      {{ book.author }}
    </p>

    <!-- Stats Badge -->
    <div class="flex items-center gap-1 text-[10px] font-bold">
      <template v-if="type === 'hot'">
        <Flame :size="10" class="text-orange-500" />
        <span class="text-zinc-600 dark:text-zinc-400">{{ book.count }}명</span>
      </template>
      <template v-else-if="type === 'wish'">
        <Heart :size="10" class="text-pink-500" />
        <span class="text-zinc-600 dark:text-zinc-400">{{ book.count }}명</span>
      </template>
      <template v-else-if="type === 'rating'">
        <Star :size="10" fill="#EAB308" class="text-yellow-500" />
        <span class="text-zinc-600 dark:text-zinc-400">{{ book.avgRating }}</span>
        <span class="text-zinc-400 dark:text-zinc-500">({{ book.reviewCount }})</span>
      </template>
      <template v-else-if="type === 'completion'">
        <CheckCircle :size="10" class="text-green-500" />
        <span class="text-zinc-600 dark:text-zinc-400">{{ book.completionRate }}%</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star, Flame, Heart, CheckCircle } from 'lucide-vue-next'
import type { DiscoverBook } from '~/composables/useDiscover'

const props = defineProps<{
  book: DiscoverBook
  rank?: number
  type: 'hot' | 'wish' | 'rating' | 'completion'
}>()

defineEmits(['click'])

const rankBadgeClass = computed(() => {
  if (!props.rank) return ''
  if (props.rank === 1) return 'bg-yellow-400 text-yellow-900'
  if (props.rank === 2) return 'bg-zinc-300 text-zinc-700'
  if (props.rank === 3) return 'bg-amber-600 text-amber-100'
  return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
})
</script>
