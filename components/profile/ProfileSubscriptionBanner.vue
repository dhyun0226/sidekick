<template>
  <div class="px-4 pt-2 pb-4 border-b border-zinc-200 dark:border-zinc-800/50">
    <!-- Premium User -->
    <div
      v-if="isPremium"
      class="bg-zinc-900 rounded-xl p-3.5 relative overflow-hidden flex items-center justify-between border border-white/5 shadow-md shadow-zinc-200/50 dark:shadow-none"
    >
      <div class="absolute -right-10 -top-10 w-24 h-24 bg-lime-500/10 blur-3xl rounded-full"></div>
      
      <div class="flex items-center gap-3 relative z-10">
        <div class="w-8 h-8 bg-gradient-to-tr from-lime-400 to-lime-500 rounded flex items-center justify-center shadow-lg shadow-lime-500/20">
          <Crown :size="16" class="text-black" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-white leading-none mb-1.5">프리미엄 회원</h3>
          <p v-if="subscriptionDetails" class="text-[10px] text-zinc-400 leading-none">
            {{ formatDate(subscriptionDetails.end_date) }}까지 이용 가능
          </p>
        </div>
      </div>

      <button
        @click="router.push('/subscription')"
        class="relative z-10 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all border border-white/10"
      >
        관리
      </button>
    </div>

    <!-- Free User -->
    <div
      v-else
      @click="router.push('/subscription')"
      class="bg-white dark:bg-zinc-900 rounded-xl p-3.5 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-lime-400 dark:hover:border-lime-500 transition-all flex items-center justify-between shadow-sm group"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-zinc-50 dark:bg-zinc-800 rounded flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
          <Lock :size="16" class="text-zinc-400 group-hover:text-lime-500 transition-colors" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1.5">프리미엄 혜택 보기</h3>
          <p class="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">더 많은 그룹과 상세 분석을 시작하세요</p>
        </div>
      </div>
      
      <div class="flex items-center gap-1 text-lime-600 dark:text-lime-400">
        <span class="text-xs font-bold">이동</span>
        <ChevronRight :size="14" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Crown, Lock, ChevronRight } from 'lucide-vue-next'

defineProps<{
  isPremium: boolean
  subscriptionDetails: any
}>()

const router = useRouter()

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`
}
</script>