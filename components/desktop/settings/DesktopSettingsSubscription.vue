<template>
  <div class="apple-card p-6">
    <h3 class="text-desktop-headline text-zinc-900 dark:text-white mb-6">구독</h3>

    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-desktop-body text-zinc-900 dark:text-white font-semibold">
          {{ isPremium ? '프리미엄' : '무료' }}
        </p>
        <p class="text-desktop-caption text-zinc-500 dark:text-zinc-400">
          {{ isPremium ? '모든 기능을 사용할 수 있습니다' : '기본 기능만 사용 가능합니다' }}
        </p>
      </div>
      <span
        class="px-3 py-1 rounded-full text-desktop-caption font-semibold"
        :class="isPremium ? 'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'"
      >
        {{ isPremium ? 'Premium' : 'Free' }}
      </span>
    </div>

    <button
      v-if="!isPremium"
      @click="$emit('upgrade')"
      class="w-full px-4 py-3 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 transition-colors text-desktop-callout"
    >
      프리미엄으로 업그레이드
    </button>
    <button
      v-else
      @click="$emit('manage')"
      class="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-desktop-callout"
    >
      구독 관리
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isPremium: boolean
}>()

defineEmits(['upgrade', 'manage'])
</script>
