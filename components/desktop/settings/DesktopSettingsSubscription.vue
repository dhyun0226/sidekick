<template>
  <div class="pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
    <h3 class="text-desktop-caption text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-5">구독</h3>

    <div class="flex items-center justify-between mb-5">
      <div>
        <p class="text-desktop-body text-zinc-900 dark:text-white font-medium">
          {{ isPremium ? '프리미엄' : '무료' }}
        </p>
        <p class="text-desktop-caption text-zinc-400 dark:text-zinc-500 mt-0.5">
          {{ isPremium ? '모든 기능을 사용할 수 있습니다' : '기본 기능만 사용 가능합니다' }}
        </p>
      </div>
      <span
        class="px-2.5 py-0.5 rounded-full text-desktop-caption font-medium"
        :class="isPremium ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'"
      >
        {{ isPremium ? 'Premium' : 'Free' }}
      </span>
    </div>

    <button
      v-if="!isPremium"
      @click="$emit('upgrade')"
      class="w-full px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors ease-apple duration-200 text-desktop-callout"
    >
      프리미엄으로 업그레이드
    </button>
    <button
      v-else
      @click="$emit('manage')"
      class="w-full text-center text-desktop-callout text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors ease-apple duration-200"
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
