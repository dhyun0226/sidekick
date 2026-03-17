<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xl">{{ icon }}</span>
      <h2 class="section-header">{{ title }}</h2>
    </div>

    <div v-if="loading" class="flex gap-4 overflow-hidden">
      <div v-for="i in 6" :key="i" class="flex-shrink-0 w-40 apple-card p-4 animate-pulse">
        <div class="w-full aspect-[2/3] bg-zinc-200 dark:bg-zinc-700 rounded-lg mb-3"></div>
        <div class="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="books.length === 0" class="apple-card p-6 text-center">
      <p class="text-desktop-body text-zinc-400">{{ emptyMessage }}</p>
    </div>

    <div v-else class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      <div
        v-for="(book, index) in books"
        :key="book.isbn"
        @click="$emit('book-click', book)"
        class="flex-shrink-0 w-40 apple-card p-4 cursor-pointer hover:shadow-apple-lg transition-shadow duration-200 ease-apple group relative"
      >
        <!-- Rank Badge -->
        <div class="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center">
          {{ index + 1 }}
        </div>
        <div class="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-apple-sm mb-3">
          <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div v-else class="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-3xl">📚</div>
        </div>
        <h3 class="text-desktop-callout text-zinc-900 dark:text-white line-clamp-2 mb-1">{{ book.title }}</h3>
        <p class="text-desktop-caption text-zinc-500 truncate">{{ book.author }}</p>
        <div class="flex items-center gap-2 mt-2">
          <span v-if="book.avgRating" class="text-desktop-caption text-amber-500 font-semibold">{{ book.avgRating.toFixed(1) }}</span>
          <span v-if="book.count" class="text-desktop-caption text-zinc-400">{{ book.count }}명</span>
          <span v-if="book.completionRate" class="text-desktop-caption text-lime-600 dark:text-lime-400">{{ Math.round(book.completionRate) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon: string
  books: any[]
  loading: boolean
  emptyMessage: string
}>()

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
