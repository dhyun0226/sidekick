<template>
  <div class="h-full flex flex-col">
    <!-- Compact Sticky Header -->
    <div class="border-b border-zinc-200/50 dark:border-zinc-800/50 sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm z-10">
      <div class="px-8 pt-6 pb-0">
        <!-- Row 1: Profile + Stats -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 ring-2 ring-zinc-200/50 dark:ring-zinc-700/40">
              <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-base font-light text-zinc-400 dark:text-zinc-300">
                {{ (profile?.nickname || 'U')[0] }}
              </div>
            </div>
            <div>
              <h1 class="text-base font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">{{ profile?.nickname }}</h1>
              <p class="text-xs text-zinc-400 dark:text-zinc-300 mt-0.5 font-light">{{ profile?.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-5">
            <button
              v-for="stat in statCards"
              :key="stat.label"
              @click="handleStatClick(stat.tab)"
              class="group flex flex-col items-center px-3 py-1.5 rounded-lg hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition"
            >
              <span class="text-lg font-semibold text-zinc-900 dark:text-white tabular-nums group-hover:text-lime-600 dark:group-hover:text-lime-400 transition">{{ stat.value }}</span>
              <span class="text-[10px] text-zinc-400 dark:text-zinc-300 uppercase tracking-widest">{{ stat.label }}</span>
            </button>
          </div>
        </div>
        <!-- Row 2: Tabs -->
        <div class="flex gap-0.5">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="$emit('tab-change', tab.key)"
            class="px-5 py-3 text-desktop-caption font-medium transition-all duration-200 relative"
            :class="activeTab === tab.key ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300'"
          >
            {{ tab.label }}
            <div
              v-if="activeTab === tab.key"
              class="absolute bottom-0 left-3 right-3 h-[1.5px] bg-lime-400 rounded-full"
            ></div>
          </button>
          <div class="flex-1 border-b border-zinc-100 dark:border-zinc-800/50"></div>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  profile: any
  stats: { books: number; wish: number; comments: number; groups: number }
  activeTab: string
}>()

const emit = defineEmits(['tab-change'])

const tabs = [
  { key: 'library', label: '서재' },
  { key: 'wishlist', label: '위시' },
  { key: 'timeline', label: '기록' },
  { key: 'groups', label: '그룹' },
  { key: 'insight', label: '분석' }
]

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const statCards = computed(() => [
  { label: '완독', value: formatNumber(props.stats.books), tab: 'library' },
  { label: '위시', value: formatNumber(props.stats.wish), tab: 'wishlist' },
  { label: '기록', value: formatNumber(props.stats.comments), tab: 'timeline' },
  { label: '그룹', value: formatNumber(props.stats.groups), tab: 'groups' },
])

const handleStatClick = (tab: string) => {
  emit('tab-change', tab)
}
</script>
