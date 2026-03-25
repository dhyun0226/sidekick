<template>
  <div class="space-y-6 pb-10">
    <!-- 내 위시 목록 -->
    <div>
      <div v-if="loading" class="py-4">
        <SkeletonBookCard :count="4" :columns="4" />
      </div>

      <div v-else-if="wishlist.length === 0" class="py-16 flex flex-col items-center text-center">
        <div class="w-20 h-20 bg-gradient-to-tr from-pink-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-5 shadow-inner">
          <Heart :size="28" class="text-zinc-300 dark:text-zinc-600" />
        </div>
        <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">아직 담은 책이 없어요</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed mb-6">
          읽고 싶은 책을 검색해서<br />위시리스트에 담아보세요.
        </p>
        <button
          @click="searchModalOpen = true"
          class="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple flex items-center gap-2"
        >
          <Plus :size="20" />
          책 담기
        </button>
      </div>

      <div v-else>
        <div class="flex items-center gap-3 mb-4">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">내 위시</h3>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ wishlist.length }}권</span>
          <button
            @click="searchModalOpen = true"
            class="p-1.5 bg-lime-400 text-black rounded-lg hover:bg-lime-300 transition-all active:scale-95"
          >
            <Plus :size="16" />
          </button>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="item in wishlist"
            :key="item.id"
            class="relative group"
          >
            <div
              @click="$emit('start-book', item)"
              class="cursor-pointer active:opacity-70 transition-opacity"
            >
              <div class="aspect-[2/3] overflow-hidden shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-lg">
                <img :src="item.book.cover_url" class="w-full h-full object-cover" />
              </div>
              <div class="mt-2">
                <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">{{ item.book.title }}</p>
                <p class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{{ item.book.author }}</p>
              </div>
            </div>
            <!-- 삭제 버튼 -->
            <button
              @click.stop="handleRemoveFromWishlist(item.isbn)"
              class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
            >
              <X :size="12" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 모달 -->
    <WishlistSearchModal
      :is-open="searchModalOpen"
      :wishlist="wishlist"
      @close="searchModalOpen = false"
      @added="handleWishlistAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X, Heart } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import { useUserStore } from '~/stores/user'
import WishlistSearchModal from '~/components/WishlistSearchModal.vue'

const props = defineProps<{
  wishlist: any[]
  loading: boolean
}>()

const emit = defineEmits(['refresh', 'start-book'])

const toast = useToastStore()
const userStore = useUserStore()
const { removeFromWishlist } = useWishlist()

const searchModalOpen = ref(false)

const handleWishlistAdded = () => {
  emit('refresh')
}

const handleRemoveFromWishlist = async (isbn: string) => {
  const userId = userStore.profile?.id
  if (!userId) return

  const result = await removeFromWishlist(userId, isbn)
  if (result.success) {
    toast.success('위시리스트에서 제거했습니다')
    emit('refresh')
  } else {
    toast.error(result.message || '제거에 실패했습니다')
  }
}
</script>
