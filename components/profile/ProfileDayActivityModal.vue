<template>
  <div v-if="isOpen && selectedDay" class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.esc="$emit('close')" tabindex="-1">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="$emit('close')"></div>
    <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] max-h-[85vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 text-left">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-zinc-900 dark:text-white">{{ selectedDay.dateString }}</h2>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{{ selectedDay.count }}개의 활동</p>
          </div>
          <button @click="$emit('close')" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X :size="20" class="text-zinc-600 dark:text-zinc-400" /></button>
        </div>
      </div>

      <!-- Activities List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/30 dark:bg-zinc-950/20">
        <div 
          v-for="item in selectedDay.activities" 
          :key="item.id" 
          @click="isBookFinished(item.groupBookId) ? $emit('navigate', item) : null" 
          class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all shadow-sm" 
          :class="[isBookFinished(item.groupBookId) ? 'cursor-pointer hover:border-lime-400' : 'cursor-default opacity-60']"
        >
          <!-- Card Header (Exact Match with Timeline Style) -->
          <div class="flex items-start gap-3 mb-3 text-left">
            <!-- Mini Cover -->
            <div class="w-8 h-11 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <img v-if="item.bookCover" :src="item.bookCover" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-zinc-400 dark:text-zinc-300">No Cover</div>
            </div>

            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-bold text-zinc-900 dark:text-white truncate mb-0.5 tracking-tight">
                {{ item.bookTitle }}
              </h4>
              <div class="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-300 font-medium">
                <span>{{ item.groupName }}</span>
                <span class="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{{ formatTimeOnly(item.created_at) }}</span>
              </div>
            </div>
            
            <div class="flex-shrink-0 ml-1">
              <template v-if="item.type === 'review'">
                <RatingBadge :rating="item.rating" size="sm" />
              </template>
              <Badge v-else variant="lime" size="sm">{{ Math.round(item.position_pct) }}%</Badge>
            </div>
          </div>

          <!-- Reply Context (Standardized Inset Box) -->
          <div v-if="item.isReply && item.parentData" class="mb-3 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800 text-left">
            <div class="bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-3">
              <div class="flex items-center gap-2 mb-2">
                <Avatar :src="item.parentData.avatar_url" :fallback="item.parentData.nickname || '탈'" size="xs" className="w-4 h-4 shadow-xs opacity-80" />
                <p class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300">
                  <span :class="{ 'italic opacity-70': !item.parentData.nickname }">{{ item.parentData.nickname || '탈퇴한 사용자' }}</span>님의 기록
                </p>
              </div>
              <div v-if="item.parentData.anchor_text" class="mb-2 pl-4 py-2 border-l-2 border-lime-400 bg-lime-50/60 dark:bg-lime-900/30 rounded-r-2xl">
                <p class="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-1">{{ item.parentData.anchor_text }}</p>
              </div>
              <p class="text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{{ item.parentData.content }}</p>
            </div>
          </div>

          <!-- Quote -->
          <div v-if="item.anchor_text" class="mb-3 pl-4 py-2 border-l-2 border-lime-400 bg-lime-50/60 dark:bg-lime-900/30 rounded-r-2xl text-left">
            <p class="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{{ item.anchor_text }}</p>
          </div>

          <!-- Content -->
          <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed text-left">{{ item.content }}</p>
        </div>

        <div v-if="selectedDay.count === 0" class="text-center py-12">
          <div class="text-3xl mb-3 opacity-20">📭</div>
          <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">활동이 없습니다</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import Badge from '~/components/Badge.vue'
import RatingBadge from '~/components/RatingBadge.vue'
import Avatar from '~/components/Avatar.vue'

defineProps<{ isOpen: boolean, selectedDay: any, isBookFinished: (id: string) => boolean }>()
defineEmits(['close', 'navigate'])

const formatTimeOnly = (d: string) => { 
  if (!d) return ''; 
  const date = new Date(d); 
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` 
}
</script>