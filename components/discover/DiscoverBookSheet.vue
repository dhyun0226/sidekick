<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-end justify-center pointer-events-none">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" @click="$emit('close')"></div>

    <!-- Sheet Content -->
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-t-3xl p-6 pointer-events-auto shadow-2xl border-t border-zinc-200 dark:border-zinc-800 animate-slide-up">
      <!-- Handle -->
      <div class="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>

      <!-- Book Info -->
      <div class="flex gap-4 mb-6 mt-2">
        <div class="w-20 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden shadow-lg bg-zinc-100 dark:bg-zinc-800">
          <img
            :src="book?.cover_url"
            :alt="book?.title"
            class="w-full h-full object-cover"
            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
          />
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2">
            {{ book?.title }}
          </h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            {{ book?.author }}
            <template v-if="book?.publisher">
              · {{ book.publisher }}
            </template>
          </p>

          <!-- Stats -->
          <div class="flex flex-wrap gap-2">
            <div v-if="book?.count" class="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              <Flame :size="12" class="text-orange-500" />
              <span>{{ book.count }}명이 읽는 중</span>
            </div>
            <div v-if="wishCount > 0" class="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              <Heart :size="12" class="text-pink-500" />
              <span>{{ wishCount }}명이 위시</span>
            </div>
            <div v-if="book?.avgRating" class="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              <Star :size="12" fill="#EAB308" class="text-yellow-500" />
              <span>{{ book.avgRating }}</span>
            </div>
            <div v-if="book?.completionRate" class="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              <CheckCircle :size="12" class="text-green-500" />
              <span>완독률 {{ book.completionRate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          @click="handleToggleWishlist"
          :disabled="wishLoading"
          class="flex-1 py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          :class="isInWishlist
            ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-500 hover:bg-pink-200 dark:hover:bg-pink-900/50'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-500'"
        >
          <Heart :size="20" :fill="isInWishlist ? 'currentColor' : 'none'" />
          {{ isInWishlist ? '위시에서 제거' : '위시 담기' }}
        </button>
        <button
          @click="handleStartBook"
          class="flex-1 py-4 bg-lime-400 text-black font-bold rounded-2xl hover:bg-lime-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20"
        >
          <BookOpen :size="20" />
          내 서재에서 읽기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import { Heart, BookOpen, Star, Flame, CheckCircle } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import type { DiscoverBook } from '~/composables/useDiscover'

const props = defineProps<{
  isOpen: boolean
  book: DiscoverBook | null
}>()

const emit = defineEmits(['close', 'start-book', 'wishlist-updated'])

const toast = useToastStore()
const userStore = useUserStore()
const client = useSupabaseClient()
const { addToWishlist, removeFromWishlist, fetchWishlist, wishlist } = useWishlist()

const wishLoading = ref(false)
const wishCount = ref(0)

const isInWishlist = computed(() => {
  if (!props.book) return false
  return wishlist.value.some(item => item.isbn === props.book!.isbn)
})

// 모달이 열릴 때 위시리스트 상태 확인
watch(() => props.isOpen, async (open) => {
  // body 스크롤 제어
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }

  if (open && props.book && userStore.profile?.id) {
    await fetchWishlist(userStore.profile.id)
    // 이 책의 위시 수 조회
    const { count } = await client
      .from('user_wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('isbn', props.book.isbn)
    wishCount.value = count || 0
  }
})

// Cleanup: restore body scroll when component unmounts
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const handleToggleWishlist = async () => {
  if (!props.book || !userStore.profile?.id) {
    toast.error('로그인이 필요합니다')
    return
  }

  wishLoading.value = true
  try {
    if (isInWishlist.value) {
      // 위시에서 제거
      const result = await removeFromWishlist(userStore.profile.id, props.book.isbn)
      if (result.success) {
        toast.success('위시리스트에서 제거했습니다')
        wishCount.value = Math.max(0, wishCount.value - 1)
        await fetchWishlist(userStore.profile.id)
        emit('wishlist-updated')
      } else {
        toast.error(result.message || '제거에 실패했습니다')
      }
    } else {
      // 위시에 추가
      // 먼저 books 테이블에 책이 있는지 확인
      const { data: existingBook } = await client
        .from('books')
        .select('isbn')
        .eq('isbn', props.book.isbn)
        .maybeSingle()

      if (!existingBook) {
        // 책 정보 저장
        await client.from('books').insert({
          isbn: props.book.isbn,
          title: props.book.title,
          author: props.book.author,
          publisher: props.book.publisher,
          cover_url: props.book.cover_url
        })
      }

      const result = await addToWishlist(userStore.profile.id, props.book.isbn)
      if (result.success) {
        toast.success('위시리스트에 담았습니다')
        wishCount.value++
        await fetchWishlist(userStore.profile.id)
        emit('wishlist-updated')
      } else {
        toast.error(result.message || '추가에 실패했습니다')
      }
    }
  } catch (err) {
    toast.error('처리에 실패했습니다')
  } finally {
    wishLoading.value = false
  }
}

const handleStartBook = () => {
  emit('start-book', props.book)
  emit('close')
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
