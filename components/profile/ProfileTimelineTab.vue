<template>
  <div class="space-y-8 pb-10">
    <div v-if="loading && timeline.length === 0" class="py-4">
      <SkeletonTimeline :count="3" />
    </div>

    <div v-else-if="timeline.length === 0 && !loading" class="py-16 flex flex-col items-center text-center">
      <div class="w-20 h-20 bg-gradient-to-tr from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-5 shadow-inner">
        <Pencil :size="28" class="text-zinc-300 dark:text-zinc-500" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-white mb-2">아직 남긴 기록이 없어요</h3>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs leading-relaxed">
        책을 읽으며 인상 깊은 구절이나<br />떠오르는 생각을 기록해 보세요.
      </p>
      <button @click="router.push('/')" class="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-apple">기록 남기러 가기</button>
    </div>

    <div v-else class="space-y-8">
      <div v-for="monthGroup in timelineByMonth" :key="monthGroup.month" class="space-y-4">
        <!-- Monthly Divider (Matched with Library Tab Style) -->
        <div class="flex items-center gap-3 sticky top-[49px] z-20 bg-gray-50/95 dark:bg-[#09090b]/95 py-2 backdrop-blur-sm">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-white">{{ monthGroup.month.replace('.', '년 ') }}월</h3>
          <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ monthlyTotals[monthGroup.month] || 0 }}개</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in monthGroup.items"
            :key="item.id"
            @click="isBookFinished(item.groupBookId) ? $emit('navigate', item) : null"
            class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-4 transition-all shadow-apple"
            :class="[isBookFinished(item.groupBookId) ? 'cursor-pointer hover:ring-lime-400' : 'cursor-default opacity-60']"
          >
            <!-- Card Header -->
            <div class="flex items-start gap-3 mb-3">
              <div class="w-8 h-11 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                <img v-if="item.bookCover" :src="item.bookCover" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-zinc-400">No Cover</div>
              </div>

              <div class="min-w-0 flex-1 text-left">
                <h4 class="text-sm font-semibold text-zinc-900 dark:text-white truncate mb-0.5 tracking-tight">{{ item.bookTitle }}</h4>
                <div class="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                  <span>{{ item.groupName }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>{{ formatTimeAgo(item.created_at) }}</span>
                </div>
              </div>
              
              <div class="flex-shrink-0 ml-1">
                <template v-if="item.type === 'review'">
                  <RatingBadge :rating="item.rating" size="sm" />
                </template>
                <Badge v-else variant="lime" size="sm">{{ Math.round(item.position_pct) }}%</Badge>
              </div>
            </div>

            <!-- Reply Context -->
            <div v-if="item.isReply && item.parentData" class="mb-3 overflow-hidden rounded-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] text-left">
              <div class="bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-3">
                <div class="flex items-center gap-2 mb-2">
                  <Avatar :src="item.parentData.avatar_url" :fallback="item.parentData.nickname?.charAt(0) || 'U'" size="xs" className="w-4 h-4 shadow-xs" />
                  <p class="text-[11px] font-semibold text-zinc-400">{{ item.parentData.nickname }}님의 기록</p>
                </div>
                <div v-if="item.parentData.anchor_text" class="mb-2 pl-2 border-l-2 border-zinc-300 dark:border-zinc-600">
                  <p class="text-[13px] text-zinc-500 dark:text-zinc-400 italic  leading-relaxed">{{ item.parentData.anchor_text }}</p>
                </div>
                <p class="text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{{ item.parentData.content }}</p>
              </div>
            </div>

            <!-- Quote -->
            <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 text-left">
              <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed ">{{ item.anchor_text }}</p>
            </div>

            <!-- Content -->
            <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed break-words text-left">{{ item.content }}</p>
          </div>
        </div>
      </div>

      <!-- Sentinel -->
      <div ref="sentinel" class="h-10 flex items-center justify-center">
        <LoadingSpinner v-if="isLoadingMore" size="sm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil } from 'lucide-vue-next'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import RatingBadge from '~/components/RatingBadge.vue'
import Badge from '~/components/Badge.vue'
import Avatar from '~/components/Avatar.vue'

const props = defineProps<{
  timeline: any[]
  loading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  monthlyTotals: Record<string, number>
  isBookFinished: (id: string) => boolean
}>()

const emit = defineEmits(['load-more', 'navigate'])
const router = useRouter()
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const timelineByMonth = computed(() => {
  const grouped: Record<string, any[]> = {}
  props.timeline.forEach(item => {
    const date = new Date(item.created_at)
    const key = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  })
  return Object.entries(grouped).map(([month, items]) => ({ month, items })).sort((a, b) => b.month.localeCompare(a.month))
})

const formatTimeAgo = (dateStr: string) => {
  const now = new Date(), date = new Date(dateStr), diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMs / 3600000), diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  const y = String(date.getFullYear()).slice(-2), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0')
  return diffDays < 7 ? `${diffDays}일 전 (${y}.${m}.${d})` : `${y}.${m}.${d}`
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && props.hasMore && !props.isLoadingMore) {
      emit('load-more')
    }
  }, { threshold: 0.1 })
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>