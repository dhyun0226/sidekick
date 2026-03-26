<template>
  <div class="max-w-4xl mx-auto px-8 py-12">
    <!-- Header -->
    <div class="flex items-center gap-8 mb-12">
      <div class="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
        <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center text-desktop-headline font-light text-zinc-400 dark:text-zinc-400">
          {{ (profile?.nickname || 'U')[0] }}
        </div>
      </div>
      <div>
        <h1 class="text-desktop-headline font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">{{ profile?.nickname }}</h1>
        <p class="text-desktop-caption text-zinc-400 dark:text-zinc-400 mt-1.5 font-light">{{ profile?.email }}</p>
      </div>
    </div>

    <!-- Stats -->
    <DesktopStatsDashboard :stats="statCards" />

    <!-- Tabs -->
    <div class="flex gap-0.5 mb-8">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="$emit('tab-change', tab.key)"
        class="px-5 py-3 text-desktop-caption font-medium transition-all duration-200 relative"
        :class="activeTab === tab.key ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'"
      >
        {{ tab.label }}
        <div
          v-if="activeTab === tab.key"
          class="absolute bottom-0 left-3 right-3 h-[1.5px] bg-lime-400 rounded-full"
        ></div>
      </button>
      <div class="flex-1 border-b border-zinc-100 dark:border-zinc-800/50"></div>
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
