<template>
  <div class="pb-20 px-4 pt-safe">
    <!-- Header -->
    <header class="flex justify-between items-center py-6">
      <div class="flex items-center gap-3">
        <div
          @click="router.push('/profile')"
          class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:border-lime-400 transition-colors"
        >
          <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-zinc-600 dark:text-zinc-500">
            <User :size="20" />
          </div>
        </div>
        <div>
          <h1 class="text-lg font-bold text-zinc-900 dark:text-white">My Groups</h1>
          <p class="text-xs text-zinc-600 dark:text-zinc-400">오늘도 함께 읽어볼까요?</p>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <button 
          @click="joinGroupModalOpen = true"
          class="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="초대 코드 입력"
        >
          <KeyRound :size="24" />
        </button>
        <NotificationCenter />
      </div>
    </header>

    <!-- Group List -->
    <div v-if="groups.length > 0" class="space-y-4">
      <div
        v-for="group in groups"
        :key="group.id"
        @click="router.push(`/group/${group.id}`)"
        class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-300 dark:border-zinc-800 active:scale-[0.98] transition-transform cursor-pointer shadow-sm hover:shadow-md"
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">{{ group.name }}</h2>
          <span class="text-xs text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
            멤버 {{ group.members?.length || 0 }}명
          </span>
        </div>

        <!-- Current Book Card -->
        <div v-if="group.currentBook" class="flex gap-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-700/50">
          <img :src="group.currentBook.cover_url" class="w-16 h-24 object-cover rounded shadow-sm bg-zinc-200 dark:bg-zinc-700" />
          <div class="flex flex-col justify-center min-w-0">
            <span class="text-[10px] font-bold text-lime-600 dark:text-lime-400 uppercase tracking-wider mb-1">Currently Reading</span>
            <h3 class="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 text-sm">{{ group.currentBook.title }}</h3>
            <p class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 mb-2">{{ group.currentBook.author }}</p>
            
            <div class="flex items-center gap-1.5">
              <!-- D-Day Badge -->
              <span 
                v-if="group.currentBook.target_end_date"
                class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                :class="getDdayStyle(group.currentBook.target_end_date)"
              >
                {{ getDdayText(group.currentBook.target_end_date) }}
              </span>
              <span v-else class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                D+{{ getDaysSince(group.currentBook.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State (No Book) -->
        <div v-else class="flex items-center justify-center h-24 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <span class="text-sm text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
            <span>💤</span> 지금은 휴식 중입니다
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State: No Groups -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div class="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
        <span class="text-4xl">👥</span>
      </div>
      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">아직 참여 중인 그룹이 없어요</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-xs leading-relaxed">
        친구들과 함께 책을 읽고<br />생각을 나눌 수 있는 공간을 만들어보세요
      </p>
      
      <div class="w-full max-w-xs space-y-3">
        <button
          @click="createGroupModalOpen = true"
          class="w-full py-4 bg-lime-400 text-black font-bold rounded-2xl hover:bg-lime-300 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-[0.98]"
        >
          <Plus :size="20" />
          새 그룹 만들기
        </button>
        <button
          @click="joinGroupModalOpen = true"
          class="w-full py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <KeyRound :size="20" class="text-zinc-500" />
          초대 코드로 입장
        </button>
      </div>
    </div>

    <!-- FAB: Create Group (Only visible when groups exist) -->
    <button
      v-if="groups.length > 0"
      @click="createGroupModalOpen = true"
      class="fixed bottom-6 right-6 w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/20 text-black hover:bg-lime-300 transition-transform active:scale-90 z-40"
    >
      <Plus :size="24" />
    </button>

    <!-- Create Group Modal -->
    <CreateGroupModal
      :isOpen="createGroupModalOpen"
      @close="createGroupModalOpen = false"
      @created="handleGroupCreated"
    />

    <!-- Join Group Modal -->
    <JoinGroupModal
      :isOpen="joinGroupModalOpen"
      @close="joinGroupModalOpen = false"
      @joined="handleGroupJoined"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { User, Plus, KeyRound } from 'lucide-vue-next'
import NotificationCenter from '~/components/NotificationCenter.vue'
import CreateGroupModal from '~/components/CreateGroupModal.vue'
import JoinGroupModal from '~/components/JoinGroupModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()

const groups = ref<any[]>([])
const loading = ref(true)
const createGroupModalOpen = ref(false)
const joinGroupModalOpen = ref(false)

const fetchGroups = async () => {
  // 현재 로그인한 유저 ID 가져오기
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  loading.value = true
  try {
    // 1. Fetch groups where user is a member
    const { data: memberData, error } = await client
      .from('group_members')
      .select(`
        group_id,
        groups (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error

    if (memberData) {
      const groupPromises = memberData.map(async (item: any) => {
        const group = item.groups
        
        // 2. Fetch current book for each group
        const { data: bookData } = await client
          .from('group_books')
          .select(`
            created_at,
            target_start_date,
            target_end_date,
            books (
              title,
              author,
              cover_url
            )
          `)
          .eq('group_id', group.id)
          .eq('status', 'reading')
          .single()

        // 3. Fetch member count
        const { count } = await client
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)

        return {
          id: group.id,
          name: group.name,
          members: { length: count || 0 }, // Mocking array structure for template compatibility
          currentBook: bookData ? {
            ...bookData.books,
            created_at: bookData.created_at,
            target_start_date: bookData.target_start_date,
            target_end_date: bookData.target_end_date
          } : null
        }
      })

      groups.value = await Promise.all(groupPromises)
    }
  } catch (e: any) {
    console.error('Error fetching groups:', e)
    toast.error('그룹 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await userStore.fetchProfile()
  await fetchGroups()
})

const getDaysSince = (dateStr: string) => {
  const start = new Date(dateStr).getTime()
  const now = new Date().getTime()
  const diff = now - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const getDaysRemaining = (targetDateStr: string) => {
  const target = new Date(targetDateStr).getTime()
  const now = new Date().getTime()
  const diff = target - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getDdayText = (targetDateStr: string) => {
  const days = getDaysRemaining(targetDateStr)
  if (days > 0) return `D-${days}`
  if (days === 0) return 'D-Day'
  return `D+${Math.abs(days)}`
}

const getDdayStyle = (targetDateStr: string) => {
  const days = getDaysRemaining(targetDateStr)
  if (days <= 0) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' // Overdue or Today
  if (days <= 7) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' // Warning
  return 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' // Safe
}

const handleGroupCreated = async (newGroup: any) => {
  toast.success('새 그룹이 생성되었습니다!')
  await fetchGroups()
  router.push(`/group/${newGroup.id}`)
}

const handleGroupJoined = async (groupId: string) => {
  // Toast handled inside modal or here? Modal handles it.
  await fetchGroups()
  router.push(`/group/${groupId}`)
}
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top, 20px);
}
</style>
