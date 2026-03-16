<template>
  <div class="max-w-4xl mx-auto px-8 py-8">
    <!-- Header -->
    <div class="flex items-center gap-6 mb-8">
      <div class="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 shadow-apple">
        <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center text-2xl text-zinc-400 dark:text-zinc-500">
          {{ (profile?.nickname || 'U')[0] }}
        </div>
      </div>
      <div>
        <h1 class="text-desktop-title text-zinc-900 dark:text-white">{{ profile?.nickname }}</h1>
        <p class="text-desktop-body text-zinc-500 dark:text-zinc-400">{{ profile?.email }}</p>
      </div>
    </div>

    <!-- Stats -->
    <DesktopStatsDashboard :stats="statCards" />

    <!-- Tabs -->
    <div class="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="$emit('tab-change', tab.key)"
        class="px-5 py-3 text-desktop-callout transition-colors relative"
        :class="activeTab === tab.key ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'"
      >
        {{ tab.label }}
        <div v-if="activeTab === tab.key" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
      </button>
    </div>

    <!-- Tab Content -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DesktopStatsDashboard from './DesktopStatsDashboard.vue'

const props = defineProps<{
  profile: any
  stats: { books: number; wish: number; comments: number; streak: number; groups: number }
  activeTab: string
}>()

defineEmits(['tab-change'])

const tabs = [
  { key: 'library', label: '서재' },
  { key: 'wishlist', label: '위시' },
  { key: 'timeline', label: '기록' },
  { key: 'insight', label: '분석' },
  { key: 'groups', label: '그룹' }
]

const statCards = computed(() => [
  { label: '완독', value: props.stats.books },
  { label: '위시', value: props.stats.wish },
  { label: '기록', value: props.stats.comments },
  { label: '연속', value: `${props.stats.streak}일` },
  { label: '그룹', value: props.stats.groups },
])
</script>
