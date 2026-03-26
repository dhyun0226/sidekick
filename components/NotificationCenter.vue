<template>
  <div class="relative">
    <!-- Bell Icon -->
    <button 
      @click="toggleOpen" 
      class="relative w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 hover:border-lime-200 transition-all shadow-sm active:scale-95 z-[100015]"
    >
      <Bell :size="20" />
      <span v-if="unreadCount > 0" class="absolute top-2.5 right-2.5 flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white dark:border-zinc-800"></span>
      </span>
    </button>

    <!-- Global Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-[100005]" @click="isOpen = false"></div>

    <!-- Dropdown Modal -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-12 w-[340px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100010] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
      @keydown.esc="isOpen = false"
      tabindex="-1"
    >
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
      <div class="max-h-[420px] overflow-y-auto custom-scrollbar overscroll-contain">
        <div v-if="loading" class="p-12 text-center">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs text-zinc-500 font-medium">알림을 불러오고 있어요</p>
        </div>

        <div v-else-if="notifications.length === 0" class="p-12 text-center flex flex-col items-center">
          <div class="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
            <Bell :size="28" class="text-zinc-300 dark:text-zinc-500" />
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
            class="group relative flex flex-col p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
            :class="{ 'bg-lime-50/30 dark:bg-lime-900/5': !noti.is_read }"
            @click="handleNotificationClick(noti)"
          >
            <!-- Content Wrapper -->
            <div class="min-w-0">
              <!-- Top Row: Group Badge & Time -->
              <div class="flex items-center justify-between mb-2">
                <div v-if="noti.groupName" class="text-[11px] font-black text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-900/30 px-1.5 py-0.5 rounded uppercase tracking-tighter truncate max-w-[180px]">
                  {{ noti.groupName }}
                </div>
                <span class="text-[11px] font-bold text-zinc-400 whitespace-nowrap ml-auto">
                  {{ formatTimeAgo(noti.created_at) }}
                </span>
              </div>

              <!-- Middle Row: Title -->
              <h4 class="text-[13px] font-black text-zinc-900 dark:text-white truncate mb-1">
                {{ noti.title }}
              </h4>

              <!-- Bottom Row: Message -->
              <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                {{ noti.message }}
              </p>
            </div>

            <!-- Action: Individual Delete -->
            <button
              @click.stop="deleteNotification(noti.id)"
              class="absolute top-4 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-400 transition-all rounded-lg hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
            >
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete All Confirmation Modal -->
    <ConfirmModal
      :isOpen="showDeleteAllModal"
      title="모든 알림 삭제"
      message="모든 알림을 삭제하시겠습니까?"
      description="삭제한 알림은 복구할 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      @confirm="executeDeleteAll"
      @cancel="showDeleteAllModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

// Prevent background scroll when modal is open
watch(isOpen, (val) => {
  if (typeof document !== 'undefined') {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup: restore body scroll when component unmounts
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

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

    if (data && data.length > 0) {
      const groupIds = [...new Set(data.map(n => n.source_id).filter(id => id))]
      if (groupIds.length > 0) {
        const { data: groupsData } = await client.from('groups').select('id, name').in('id', groupIds)
        const groupsMap = new Map(groupsData?.map(g => [g.id, g.name]) || [])
        notifications.value = data.map(n => ({
          ...n,
          groupName: groupsMap.get(n.source_id)
        }))
      } else {
        notifications.value = data
      }
    } else {
      notifications.value = []
    }
  } catch (error) {
    console.error('Notifications error:', error)
  } finally {
    loading.value = false
  }
}

const markAllRead = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  try {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error
    
    notifications.value.forEach(n => n.is_read = true)
    toast.success('모든 알림을 읽음 처리했습니다')
    isOpen.value = false // Close modal after action
  } catch (err) {
    console.error('Mark all read error:', err)
    toast.error('알림 읽음 처리에 실패했습니다')
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
  try {
    const { error } = await client.from('notifications').delete().eq('id', notiId)
    if (error) throw error
    notifications.value = notifications.value.filter(n => n.id !== notiId)
  } catch (err) {
    toast.error('알림 삭제에 실패했습니다')
  }
}

const deleteAll = () => {
  if (notifications.value.length === 0) return
  showDeleteAllModal.value = true
}

const executeDeleteAll = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return
  try {
    const { error } = await client.from('notifications').delete().eq('user_id', user.id)
    if (error) throw error
    notifications.value = []
    toast.success('모든 알림이 삭제되었습니다')
    isOpen.value = false // Close modal after action
  } catch (error) {
    console.error('Delete all notifications error:', error)
    toast.error('알림 삭제에 실패했습니다')
  } finally {
    showDeleteAllModal.value = false
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
  const y = String(date.getFullYear()).slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

let notificationChannel: any = null

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return
  await fetchNotifications()
  notificationChannel = client.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, async (payload) => {
    const newNoti = payload.new as any
    const { data: groupData } = await client.from('groups').select('name').eq('id', newNoti.source_id).maybeSingle()
    notifications.value.unshift({ ...newNoti, groupName: groupData?.name })
  }).subscribe()
})

onUnmounted(() => {
  if (notificationChannel) {
    client.removeChannel(notificationChannel)
    notificationChannel = null
  }
})
</script>

