<template>
  <DesktopModal :is-open="isOpen" :title="book?.title" size="md" @close="$emit('close')">
    <div v-if="book" class="px-8 py-6">
      <div class="flex gap-8">
        <!-- Cover -->
        <div class="w-40 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
          <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 flex flex-col">
          <h2 class="text-desktop-headline font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">{{ book.title }}</h2>
          <p class="mt-1.5 text-desktop-callout text-zinc-500 font-light">{{ book.author }}</p>
          <p v-if="book.publisher" class="mt-0.5 text-desktop-caption text-zinc-400 font-light">{{ book.publisher }}</p>

          <!-- Stats grid -->
          <div class="mt-auto pt-6 grid grid-cols-3 gap-4">
            <div v-if="book.avgRating" class="text-center">
              <p class="text-desktop-headline font-semibold text-zinc-900 dark:text-white tabular-nums leading-none">{{ book.avgRating.toFixed(1) }}</p>
              <p class="mt-1 text-desktop-caption text-zinc-400 uppercase tracking-widest font-medium">평점</p>
            </div>
            <div v-if="book.count" class="text-center">
              <p class="text-desktop-headline font-semibold text-zinc-900 dark:text-white tabular-nums leading-none">{{ book.count }}<span class="text-desktop-callout font-light text-zinc-400 ml-0.5">명</span></p>
              <p class="mt-1 text-desktop-caption text-zinc-400 uppercase tracking-widest font-medium">독자 수</p>
            </div>
            <div v-if="book.completionRate" class="text-center">
              <p class="text-desktop-headline font-semibold text-lime-500 tabular-nums leading-none">{{ Math.round(book.completionRate) }}<span class="text-desktop-callout font-light">%</span></p>
              <p class="mt-1 text-desktop-caption text-zinc-400 uppercase tracking-widest font-medium">완독률</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between px-2">
        <!-- Wishlist button -->
        <button
          @click="handleToggleWishlist"
          :disabled="wishLoading"
          class="flex items-center gap-2 px-4 py-2.5 text-desktop-callout font-medium rounded-full transition-all duration-200 ease-apple"
          :class="isInWishlist
            ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30'
            : 'text-zinc-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'"
        >
          <Heart :size="16" :fill="isInWishlist ? 'currentColor' : 'none'" />
          {{ isInWishlist ? '위시에서 제거' : '위시 담기' }}
        </button>

        <div class="flex items-center gap-3">
          <button
            @click="$emit('close')"
            class="px-5 py-2.5 text-desktop-callout text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            닫기
          </button>
          <button
            @click="handleStartBook"
            class="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-desktop-callout font-medium rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 ease-apple"
          >
            읽기 시작
          </button>
        </div>
      </div>
    </template>
  </DesktopModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Heart } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import DesktopModal from '~/components/desktop/shared/DesktopModal.vue'

const props = defineProps<{
  isOpen: boolean
  book: any
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
  return wishlist.value.some((item: any) => item.isbn === props.book.isbn)
})

watch(() => props.isOpen, async (open) => {
  if (open && props.book && userStore.profile?.id) {
    await fetchWishlist(userStore.profile.id)
    const { count } = await client
      .from('user_wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('isbn', props.book.isbn)
    wishCount.value = count || 0
  }
})

const handleToggleWishlist = async () => {
  if (!props.book || !userStore.profile?.id) {
    toast.error('로그인해주세요')
    return
  }

  wishLoading.value = true
  try {
    if (isInWishlist.value) {
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
      const { data: existingBook } = await client
        .from('books')
        .select('isbn')
        .eq('isbn', props.book.isbn)
        .maybeSingle()

      if (!existingBook) {
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
