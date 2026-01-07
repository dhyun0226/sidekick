<template>
  <div class="relative">
    <!-- Bell Icon -->
    <button 
      @click="toggleOpen" 
      class="relative w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 hover:border-lime-200 transition-all shadow-sm active:scale-95"
    >
      <Bell :size="20" />
      <!-- Unread Indicator Pulse -->
      <span v-if="unreadCount > 0" class="absolute top-2.5 right-2.5 flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white dark:border-zinc-800"></span>
      </span>
    </button>

    <!-- Dropdown Modal -->
    <div v-if="isOpen" class="absolute right-0 top-12 w-[340px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div>
          <h3 class="font-black text-zinc-900 dark:text-white text-base">알림</h3>
        </div>
        <div class="flex items-center gap-3">
          <button @click="markAllRead" class="text-xs font-bold text-lime-600 dark:text-lime-400 hover:opacity-70 transition-opacity">모두 읽음</button>
          <button @click="deleteAll" class="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="모두 삭제">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="max-h-[420px] overflow-y-auto custom-scrollbar">
        <!-- Loading State -->
        <div v-if="loading" class="p-12 text-center">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs text-zinc-500 font-medium">알림을 불러오고 있어요</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="notifications.length === 0" class="p-12 text-center flex flex-col items-center">
          <div class="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-3xl">
            🔔
          </div>
          <h4 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">새로운 소식이 없어요</h4>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            나중에 새로운 알림이 오면<br/>여기서 알려드릴게요!
          </p>
        </div>

        <!-- Notifications List -->
        <div v-else class="divide-y divide-zinc-50 dark:divide-zinc-800/50">
          <div
            v-for="noti in notifications"
            :key="noti.id"
            class="group relative flex gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
            :class="{ 'bg-lime-50/30 dark:bg-lime-900/5': !noti.is_read }"
            @click="handleNotificationClick(noti)"
          >
            <!-- Unread Indicator Dot -->
            <div v-if="!noti.is_read" class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-lime-400 rounded-full"></div>

            <!-- Icon Column -->
            <div class="flex-shrink-0 pt-0.5">
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                :class="getIconBgClass(noti.type)"
              >
                <component :is="getIconComponent(noti.type)" :size="18" :class="getIconColorClass(noti.type)" />
              </div>
            </div>

            <!-- Text Column -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-black text-zinc-900 dark:text-white truncate pr-2">
                  {{ noti.title }}
                </span>
                <span class="text-[10px] font-bold text-zinc-400 whitespace-nowrap pt-0.5">
                  {{ formatTimeAgo(noti.created_at) }}
                </span>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {{ noti.message }}
              </p>
            </div>

            <!-- Action: Individual Delete -->
            <button
              @click.stop="deleteNotification(noti.id)"
              class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-400 transition-all rounded-lg hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
            >
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>

    <!-- Delete All Modal -->
    <ConfirmModal
      :isOpen="showDeleteAllModal"
      title="모든 알림 삭제"
      message="모든 알림을 삭제하시겠습니까?"
      description="삭제한 알림은 복구할 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      @confirm="executeDeleteAll"
      @cancel="cancelDeleteAll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, MessageCircle, Heart, Info, X, Trash2, BookOpen, UserPlus, CheckCircle2 } from 'lucide-vue-next'
import ConfirmModal from './ConfirmModal.vue'
import { useToastStore } from '~/stores/toast'

const router = useRouter()
const client = useSupabaseClient()
const toast = useToastStore()

const isOpen = ref(false)
const loading = ref(false)
const notifications = ref<any[]>([])
const showDeleteAllModal = ref(false)

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
  const { data: { user } } = await client.auth.getUser()
  if (!user) return
  loading.value = true
  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error) throw error
    notifications.value = data || []
  } catch (error) {
    console.error('Notifications error:', error)
  } finally {
    loading.value = false
  }
}

const markAllRead = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  if (!error) {
    notifications.value.forEach(n => n.is_read = true)
  }
}

const handleNotificationClick = async (noti: any) => {
  if (!noti.is_read) {
    await client.from('notifications').update({ is_read: true }).eq('id', noti.id)
    noti.is_read = true
  }
  if (noti.link) {
    isOpen.value = false
    router.push(noti.link)
  }
}

const deleteNotification = async (notiId: string) => {
  const { error } = await client.from('notifications').delete().eq('id', notiId)
  if (!error) {
    notifications.value = notifications.value.filter(n => n.id !== notiId)
  }
}

const deleteAll = () => { showDeleteAllModal.value = true }
const executeDeleteAll = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return
  try {
    const { error } = await client.from('notifications').delete().eq('user_id', user.id)
    if (error) throw error
    notifications.value = []
    toast.success('모든 알림이 삭제되었습니다.')
  } catch (error) {
    toast.error('알림 삭제에 실패했습니다.')
  } finally { showDeleteAllModal.value = false }
}
const cancelDeleteAll = () => { showDeleteAllModal.value = false }

// Helper for icons based on type
const getIconComponent = (type: string) => {
  switch (type) {
    case 'reply': return MessageCircle
    case 'reaction': return Heart
    case 'book_added': return BookOpen
    case 'member_join': return UserPlus
    case 'completion': return CheckCircle2
    default: return Info
  }
}

const getIconBgClass = (type: string) => {
  switch (type) {
    case 'reply': return 'bg-blue-50 dark:bg-blue-900/20'
    case 'reaction': return 'bg-red-50 dark:bg-red-900/20'
    case 'book_added': return 'bg-lime-50 dark:bg-lime-900/20'
    case 'member_join': return 'bg-purple-50 dark:bg-purple-900/20'
    case 'completion': return 'bg-emerald-50 dark:bg-emerald-900/20'
    default: return 'bg-zinc-50 dark:bg-zinc-800'
  }
}

const getIconColorClass = (type: string) => {
  switch (type) {
    case 'reply': return 'text-blue-500'
    case 'reaction': return 'text-red-500'
    case 'book_added': return 'text-lime-500'
    case 'member_join': return 'text-purple-500'
    case 'completion': return 'text-emerald-500'
    default: return 'text-zinc-400'
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
  const date = new Date(dateStr)
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return
  await fetchNotifications()
  const channel = client.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
    notifications.value.unshift(payload.new as any)
  }).subscribe()
  onUnmounted(() => { client.removeChannel(channel) })
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
</style>