<template>
  <div class="relative">
    <!-- Bell Icon -->
    <button @click="isOpen = !isOpen" class="relative text-zinc-400 hover:text-white transition-colors p-2">
      <Bell :size="24" />
      <span v-if="unreadCount > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
    </button>

    <!-- Dropdown -->
    <div v-if="isOpen" class="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up origin-top-right">
      <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 class="font-bold text-white text-sm">알림</h3>
        <button @click="markAllRead" class="text-xs text-lime-400 hover:text-lime-300">모두 읽음</button>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <div v-if="notifications.length === 0" class="p-8 text-center text-zinc-500 text-xs">
          새로운 알림이 없습니다.
        </div>
        
        <div 
          v-for="noti in notifications" 
          :key="noti.id" 
          class="flex gap-3 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer border-b border-zinc-800/50 last:border-0"
          :class="{ 'bg-zinc-800/20': !noti.is_read }"
        >
          <div class="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center">
            <MessageCircle v-if="noti.type === 'reply'" :size="14" class="text-blue-400" />
            <Heart v-else-if="noti.type === 'like'" :size="14" class="text-red-400" />
            <Info v-else :size="14" class="text-lime-400" />
          </div>
          <div>
            <p class="text-sm text-zinc-200 leading-snug">
              <span class="font-bold">{{ noti.sender }}</span>님이 
              <span v-if="noti.type === 'reply'">회원님의 글에 답글을 남겼습니다.</span>
              <span v-else-if="noti.type === 'like'">회원님의 글을 좋아합니다.</span>
              <span v-else>{{ noti.content }}</span>
            </p>
            <p class="text-[10px] text-zinc-500 mt-1">{{ noti.timeAgo }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Backdrop for closing -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bell, MessageCircle, Heart, Info } from 'lucide-vue-next'

const isOpen = ref(false)
const unreadCount = ref(2)

const notifications = ref([
  { id: '1', type: 'reply', sender: '영희', content: '', timeAgo: '방금 전', is_read: false },
  { id: '2', type: 'like', sender: '철수', content: '', timeAgo: '10분 전', is_read: false },
  { id: '3', type: 'notice', sender: 'Sidekick', content: '새로운 기능이 추가되었습니다!', timeAgo: '1시간 전', is_read: true },
])

const markAllRead = () => {
  unreadCount.value = 0
  notifications.value.forEach(n => n.is_read = true)
}
</script>
