<template>
  <div class="pt-safe">
    <!-- Nav Bar -->
    <div class="flex justify-between items-center px-4 py-4">
      <button @click="router.back()" class="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ChevronLeft :size="24" />
      </button>
      <button @click="$emit('open-settings')" class="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <Settings :size="24" />
      </button>
    </div>

    <!-- Profile -->
    <div class="px-4 pb-3">
      <div class="flex items-center gap-3">
        <div class="relative group cursor-pointer" @click="$emit('open-settings')">
          <div class="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <img v-if="profile?.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-300">
              <User :size="20" />
            </div>
          </div>
          <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 :size="14" class="text-white" />
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <h1 class="text-base font-bold text-zinc-900 dark:text-white">
            {{ profile?.nickname || '사용자' }}
          </h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">오늘도 즐거운 독서 되세요!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronLeft, Settings, User, Edit2 } from 'lucide-vue-next'

defineProps<{
  profile: any
}>()

defineEmits(['open-settings'])

const router = useRouter()
</script>