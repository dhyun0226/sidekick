<template>
  <div class="relative">
    <!-- Bell Icon -->
    <button @click="toggleOpen" class="relative text-zinc-400 hover:text-white transition-colors p-2">
      <Bell :size="24" />
      <span v-if="unreadCount > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
    </button>

    <!-- Dropdown -->
    <div v-if="isOpen" class="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up origin-top-right">
      <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 class="font-bold text-white text-sm">알림</h3>
        <div class="flex items-center gap-2">
          <button @click="markAllRead" class="text-xs text-lime-400 hover:text-lime-300">모두 읽음</button>
          <span class="text-zinc-700">|</span>
          <button @click="deleteAll" class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <Trash2 :size="12" />
            모두 삭제
          </button>
        </div>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center text-zinc-500 text-xs">
          <div class="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          로딩 중...
        </div>

        <!-- Empty State -->
        <div v-else-if="notifications.length === 0" class="p-8 text-center text-zinc-500 text-xs">
          새로운 알림이 없습니다.
        </div>

        <!-- Notifications List -->
        <div
          v-else
          v-for="noti in notifications"
          :key="noti.id"
          class="flex gap-3 p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0 group relative"
          :class="{ 'bg-zinc-800/20': !noti.is_read }"
        >
          <div @click="handleNotificationClick(noti)" class="flex gap-3 flex-1 cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center">
              <MessageCircle v-if="noti.type === 'reply'" :size="14" class="text-blue-400" />
              <Heart v-else-if="noti.type === 'reaction'" :size="14" class="text-red-400" />
              <Info v-else :size="14" class="text-lime-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-zinc-200 leading-snug">
                <strong class="font-bold">{{ noti.title }}</strong>
              </p>
              <p v-if="noti.message" class="text-xs text-zinc-400 mt-1">{{ noti.message }}</p>
              <p class="text-[10px] text-zinc-500 mt-1">{{ formatTimeAgo(noti.created_at) }}</p>
            </div>
          </div>
          <!-- Delete Button -->
          <button
            @click.stop="deleteNotification(noti.id)"
            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-red-400"
            title="삭제"
          >
            <X :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Backdrop for closing -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, MessageCircle, Heart, Info, X, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const client = useSupabaseClient()
const user = useSupabaseUser()

const isOpen = ref(false)
const loading = ref(false)
const notifications = ref<any[]>([])

const unreadCount = computed(() =>
  notifications.value.filter(n => !n.is_read).length
)

const toggleOpen = async () => {
  isOpen.value = !isOpen.value

  if (isOpen.value && notifications.value.length === 0) {
    await fetchNotifications()
  }
}

const fetchNotifications = async () => {
  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  loading.value = true

  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Notifications fetch error:', error)
      return
    }

    notifications.value = data || []
  } catch (error) {
    console.error('Notifications error:', error)
  } finally {
    loading.value = false
  }
}

const markAllRead = async () => {
  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', currentUser.id)
    .eq('is_read', false)

  if (!error) {
    notifications.value.forEach(n => n.is_read = true)
  }
}

const handleNotificationClick = async (noti: any) => {
  // Mark as read
  if (!noti.is_read) {
    await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', noti.id)

    noti.is_read = true
  }

  // Navigate to link
  if (noti.link) {
    isOpen.value = false
    router.push(noti.link)
  }
}

const deleteNotification = async (notiId: string) => {
  const { error } = await client
    .from('notifications')
    .delete()
    .eq('id', notiId)

  if (!error) {
    // Remove from local array
    notifications.value = notifications.value.filter(n => n.id !== notiId)
  }
}

const deleteAll = async () => {
  if (!confirm('모든 알림을 삭제하시겠습니까?')) return

  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  const { error } = await client
    .from('notifications')
    .delete()
    .eq('user_id', currentUser.id)

  if (!error) {
    notifications.value = []
  }
}

const formatTimeAgo = (dateStr: string) => {
  const now = new Date().getTime()
  const time = new Date(dateStr).getTime()
  const diff = now - time

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString()
}

// Realtime subscription for new notifications
onMounted(async () => {
  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) return

  const channel = client
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      },
      (payload) => {
        console.log('New notification:', payload)
        notifications.value.unshift(payload.new as any)
      }
    )
    .subscribe()

  // Cleanup on unmount
  onUnmounted(() => {
    client.removeChannel(channel)
  })
})
</script>

<style scoped>
@keyframes scale-up {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-up {
  animation: scale-up 0.15s ease-out;
}
</style>
