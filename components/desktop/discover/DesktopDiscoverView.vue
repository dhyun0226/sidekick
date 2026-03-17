<template>
  <div class="max-w-5xl mx-auto px-8 py-8">
    <!-- Hero -->
    <DesktopDiscoverHero />

    <!-- Filters -->
    <div class="flex items-center gap-4 mb-10">
      <!-- Period -->
      <div class="flex bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full p-0.5">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          class="px-3.5 py-1.5 text-desktop-caption font-semibold rounded-full transition-all duration-200 ease-apple"
          :class="selectedPeriod === period.value
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
            : 'text-zinc-500 hover:text-zinc-700'"
        >
          {{ period.label }}
        </button>
      </div>

      <!-- Genre -->
      <div ref="genreDropdownRef" class="relative">
        <button
          @click="genreDropdownOpen = !genreDropdownOpen"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-desktop-caption font-semibold transition-all duration-200 ease-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] hover:ring-black/[0.08] dark:hover:ring-white/[0.1]"
          :class="selectedGenre ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
        >
          {{ selectedGenre || '전체 장르' }}
          <ChevronDown :size="14" />
        </button>
        <div
          v-if="genreDropdownOpen"
          class="absolute top-full left-0 mt-1.5 w-48 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl shadow-apple-lg z-50 py-1"
        >
          <button
            @click="selectedGenre = null; genreDropdownOpen = false"
            class="w-full text-left px-3.5 py-2 text-desktop-caption transition-colors duration-200 ease-apple hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
            :class="!selectedGenre ? 'text-lime-600 font-semibold' : 'text-zinc-600 dark:text-zinc-400'"
          >
            전체 장르
          </button>
          <button
            v-for="genre in genres"
            :key="genre"
            @click="selectedGenre = genre; genreDropdownOpen = false"
            class="w-full text-left px-3.5 py-2 text-desktop-caption transition-colors duration-200 ease-apple hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
            :class="selectedGenre === genre ? 'text-lime-600 font-semibold' : 'text-zinc-600 dark:text-zinc-400'"
          >
            {{ genre }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sections -->
    <div class="space-y-12">
      <DesktopBookGrid
        title="HOT 도서" icon="🔥" type="hot"
        :books="hotBooks" :loading="loading"
        empty-message="아직 데이터가 부족해요"
        @book-click="openBookDetail"
      />
      <DesktopBookGrid
        title="위시 인기" icon="💝" type="wish"
        :books="wishBooks" :loading="loading"
        empty-message="아직 데이터가 부족해요"
        @book-click="openBookDetail"
      />
      <DesktopBookGrid
        title="평점 TOP" icon="⭐" type="rating"
        :books="topRatedBooks" :loading="loading"
        empty-message="리뷰가 3개 이상인 책이 없어요"
        @book-click="openBookDetail"
      />
      <DesktopBookGrid
        title="완독률 TOP" icon="✅" type="completion"
        :books="completionBooks" :loading="loading"
        empty-message="읽은 사람이 5명 이상인 책이 없어요"
        @book-click="openBookDetail"
      />
    </div>

    <!-- Book Detail Sheet -->
    <DesktopBookDetailSheet
      :is-open="bookDetailOpen"
      :book="selectedBook"
      @close="bookDetailOpen = false"
      @start-book="$emit('start-book', $event)"
      @wishlist-updated="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { PeriodFilter } from '~/composables/useDiscover'
import DesktopDiscoverHero from './DesktopDiscoverHero.vue'
import DesktopBookGrid from './DesktopBookGrid.vue'
import DesktopBookDetailSheet from './DesktopBookDetailSheet.vue'

const { genres } = useGenres()
const { loading, hotBooks, wishBooks, topRatedBooks, completionBooks, fetchAll } = useDiscover()

const periods = [
  { value: 'week' as PeriodFilter, label: '이번 주' },
  { value: 'month' as PeriodFilter, label: '이번 달' },
  { value: 'all' as PeriodFilter, label: '전체' }
]
const selectedPeriod = ref<PeriodFilter>('week')
const selectedGenre = ref<string | null>(null)
const genreDropdownRef = ref<HTMLElement | null>(null)
const genreDropdownOpen = ref(false)
const bookDetailOpen = ref(false)
const selectedBook = ref<any>(null)

const emit = defineEmits(['start-book'])

const openBookDetail = (book: any) => {
  selectedBook.value = book
  bookDetailOpen.value = true
}

const fetchData = () => fetchAll(selectedPeriod.value, selectedGenre.value)

watch([selectedPeriod, selectedGenre], () => fetchData())
onMounted(() => {
  fetchData()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
const handleClickOutside = (e: MouseEvent) => {
  if (genreDropdownOpen.value && genreDropdownRef.value && !genreDropdownRef.value.contains(e.target as Node)) {
    genreDropdownOpen.value = false
  }
}
</script>
