<template>
  <div v-if="isOpen && selectedDay" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="$emit('close')"></div>
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[85vh] flex flex-col overflow-hidden">
      <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-zinc-900 dark:text-white">{{ selectedDay.dateString }}</h2>
            <p class="text-xs text-zinc-500 mt-1">{{ selectedDay.count }}개의 활동</p>
          </div>
          <button @click="$emit('close')" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X :size="20" class="text-zinc-600 dark:text-zinc-400" /></button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-for="item in selectedDay.activities" :key="item.id" @click="isBookFinished(item.groupBookId) ? $emit('navigate', item) : null" class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all" :class="[isBookFinished(item.groupBookId) ? 'cursor-pointer hover:border-lime-400' : 'cursor-default opacity-60']">
          <div class="flex items-center gap-2 mb-3 text-xs">
            <span class="text-zinc-500 dark:text-zinc-400">{{ item.groupName }}</span>
            <span class="text-zinc-300 dark:text-zinc-700">·</span>
            <span class="text-zinc-500 dark:text-zinc-400">{{ formatTimeOnly(item.created_at) }}</span>
            <span class="text-zinc-300 dark:text-zinc-700">·</span>
            <template v-if="item.type === 'review'"><div class="flex items-center gap-1"><StarIcon :size="12" fill="currentColor" class="text-yellow-500" /><span class="font-bold text-yellow-600">{{ item.rating }}</span></div></template>
            <span v-else class="text-lime-600 dark:text-lime-400 font-bold">{{ Math.round(item.position_pct) }}%</span>
          </div>
          <div v-if="item.isReply && item.parentData" class="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border-l-4 border-zinc-200 dark:border-zinc-700 text-left">
            <p class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-2">{{ item.parentData.nickname }}님의 기록에 대한 답글</p>
            <div v-if="item.parentData.anchor_text" class="mb-1.5 pl-2 border-l border-zinc-300 dark:border-zinc-600"><p class="text-[11px] text-zinc-400 italic line-clamp-1">{{ item.parentData.anchor_text }}</p></div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{{ item.parentData.content }}</p>
          </div>
          <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700"><p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">{{ item.anchor_text }}</p></div>
          <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{{ item.content }}</p>
        </div>
        <div v-if="selectedDay.count === 0" class="text-center py-12"><div class="text-3xl mb-3 opacity-20">📭</div><h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">활동이 없습니다</h3></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Star as StarIcon } from 'lucide-vue-next'
defineProps<{ isOpen: boolean, selectedDay: any, isBookFinished: (id: string) => boolean }>()
defineEmits(['close', 'navigate'])
const formatTimeOnly = (d: string) => { if (!d) return ''; const date = new Date(d); return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
</script>