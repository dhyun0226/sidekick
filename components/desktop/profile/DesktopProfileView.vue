<template>
  <div class="h-full flex">
    <!-- Left Panel -->
    <div class="w-[240px] flex-shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/50 p-5 flex flex-col overflow-y-auto">
      <!-- Avatar + Name -->
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 ring-2 ring-zinc-200/50 dark:ring-zinc-700/40">
          <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-xs font-light text-zinc-400 dark:text-zinc-300">
            {{ (profile?.nickname || 'U')[0] }}
          </div>
        </div>
        <div class="min-w-0">
          <h1 class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight truncate">{{ profile?.nickname }}</h1>
          <p class="text-xs text-zinc-400 dark:text-zinc-300 truncate">{{ profile?.email }}</p>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="flex items-center gap-2 mb-5 pb-5 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <button
          v-for="stat in statCards"
          :key="stat.label"
          @click="$emit('tab-change', stat.tab)"
          class="text-center flex-1 group cursor-pointer"
        >
          <p class="text-lg font-bold tabular-nums text-zinc-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition">{{ stat.value }}</p>
          <p class="text-xs text-zinc-400 dark:text-zinc-300">{{ stat.label }}</p>
        </button>
      </div>

      <!-- Tabs -->
      <nav class="space-y-0.5 mb-5 pb-5 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="$emit('tab-change', tab.key)"
          class="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-all"
          :class="activeTab === tab.key
            ? 'text-zinc-900 dark:text-white bg-zinc-100/70 dark:bg-zinc-800/50'
            : 'text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="activeTab === tab.key ? 'bg-lime-400' : 'bg-current opacity-30'"
          ></span>
          {{ tab.label }}
        </button>
      </nav>

      <!-- Extra Panel Content (tab-specific) -->
      <div class="flex-1">
        <slot name="panel" />
      </div>
    </div>

    <!-- Right Content -->
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

defineEmits(['tab-change'])

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
</script>
