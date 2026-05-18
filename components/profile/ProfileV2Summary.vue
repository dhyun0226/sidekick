<template>
  <section class="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-wide text-lime-600 dark:text-lime-400">v2 Reading Companion</p>
        <h2 class="mt-1 text-base font-black text-zinc-900 dark:text-white">캐릭터와 함께 읽기</h2>
        <p class="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          세션, 배지, 추천, 리캡을 한 흐름으로 이어서 봅니다.
        </p>
      </div>
      <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-lime-700 dark:bg-lime-400/10 dark:text-lime-300">
        <Sparkles :size="20" />
      </div>
    </div>

    <div class="mt-4 grid grid-cols-4 gap-2">
      <div v-for="item in statItems" :key="item.label" class="min-w-0 rounded-xl bg-zinc-50 px-2.5 py-3 text-center dark:bg-zinc-800/70">
        <p class="truncate text-sm font-black tabular-nums text-zinc-900 dark:text-white">{{ item.value }}</p>
        <p class="mt-0.5 truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{{ item.label }}</p>
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-2.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        :class="link.variant === 'secondary' ? '!bg-zinc-100 !text-zinc-700 hover:!bg-zinc-200 dark:!bg-zinc-800 dark:!text-zinc-100 dark:hover:!bg-zinc-700' : ''"
      >
        <component :is="link.icon" :size="14" />
        <span class="truncate">{{ link.label }}</span>
      </NuxtLink>
    </div>

    <div v-if="earnedBadges.length > 0" class="mt-4 flex flex-wrap gap-1.5">
      <span
        v-for="badge in earnedBadges"
        :key="badge.code"
        class="rounded-full bg-lime-100 px-2.5 py-1 text-[10px] font-bold text-lime-700 dark:bg-lime-400/10 dark:text-lime-300"
      >
        {{ badge.title }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, BookOpen, Compass, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  summary?: {
    sessionCount?: number
    totalDurationSeconds?: number
    noteCount?: number
    activeDays?: number
    activeCompanion?: string
    earnedBadges?: number
    badges?: any[]
  } | null
}>()

const formatDuration = (seconds = 0) => {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}분`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

const statItems = computed(() => [
  { label: '세션', value: props.summary?.sessionCount || 0 },
  { label: '읽은 시간', value: formatDuration(props.summary?.totalDurationSeconds || 0) },
  { label: '기록', value: props.summary?.noteCount || 0 },
  { label: '배지', value: props.summary?.earnedBadges || 0 }
])

const earnedBadges = computed(() => (props.summary?.badges || []).filter((badge: any) => badge.earned).slice(0, 4))

const links = [
  { to: '/v2', label: '동행', icon: BookOpen },
  { to: '/recap/v2', label: '리캡', icon: BarChart3, variant: 'secondary' },
  { to: '/recommendations/v2', label: '추천', icon: Compass, variant: 'secondary' }
]
</script>
