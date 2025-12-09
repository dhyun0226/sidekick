<template>
  <div class="pb-20 px-4 pt-safe">
    <!-- Header -->
    <header class="flex justify-between items-center py-6">
      <div class="flex items-center gap-3">
        <div 
          @click="router.push('/profile')"
          class="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 cursor-pointer hover:border-lime-400 transition-colors"
        >
          <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-zinc-500">
            <User :size="20" />
          </div>
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">My Groups</h1>
          <p class="text-xs text-zinc-400">오늘도 함께 읽어볼까요?</p>
        </div>
      </div>
      <div class="flex gap-4">
        <NotificationCenter />
      </div>
    </header>

    <!-- Group List -->
    <div class="space-y-4">
      <div 
        v-for="group in groups" 
        :key="group.id"
        @click="router.push(`/group/${group.id}`)"
        class="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 active:scale-[0.98] transition-transform cursor-pointer"
      >
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-lg font-bold text-zinc-100">{{ group.name }}</h2>
          <span class="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
            멤버 {{ group.members?.length || 0 }}명
          </span>
        </div>

        <!-- Current Book Card -->
        <div v-if="group.currentBook" class="flex gap-4 bg-black/40 rounded-xl p-3">
          <img :src="group.currentBook.cover_url" class="w-16 h-24 object-cover rounded shadow-lg bg-zinc-800" />
          <div class="flex flex-col justify-center">
            <span class="text-xs text-lime-400 font-medium mb-1">Currently Reading</span>
            <h3 class="font-bold text-zinc-200 line-clamp-1">{{ group.currentBook.title }}</h3>
            <p class="text-xs text-zinc-400">{{ group.currentBook.author }}</p>
            <div class="mt-2 text-xs text-zinc-500">
              D+{{ getDaysSince(group.currentBook.created_at) }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex items-center justify-center h-24 bg-zinc-800/30 rounded-xl border border-dashed border-zinc-700">
          <span class="text-sm text-zinc-500">지금은 휴식 중입니다 💤</span>
        </div>
      </div>
    </div>

    <!-- FAB: Create Group -->
    <button
      @click="createGroupModalOpen = true"
      class="fixed bottom-6 right-6 w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/20 text-black hover:bg-lime-300 transition-colors z-40"
    >
      <Plus :size="24" />
    </button>

    <!-- Create Group Modal -->
    <CreateGroupModal
      :isOpen="createGroupModalOpen"
      @close="createGroupModalOpen = false"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { User, Plus } from 'lucide-vue-next'
import NotificationCenter from '~/components/NotificationCenter.vue'
import CreateGroupModal from '~/components/CreateGroupModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()

const groups = ref<any[]>([])
const loading = ref(true)
const createGroupModalOpen = ref(false)

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
            created_at: bookData.created_at
          } : null
        }
      })

      groups.value = await Promise.all(groupPromises)
    }
  } catch (e) {
    console.error('Error fetching groups:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('[Index] Component mounted')
  console.log('[Index] userStore.user:', userStore.user)
  console.log('[Index] userStore.profile before fetch:', userStore.profile)

  await userStore.fetchProfile()

  console.log('[Index] userStore.profile after fetch:', userStore.profile)
  await fetchGroups()
})

const getDaysSince = (dateStr: string) => {
  const start = new Date(dateStr).getTime()
  const now = new Date().getTime()
  const diff = now - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const handleGroupCreated = async (newGroup: any) => {
  console.log('[Index] New group created:', newGroup)
  // 그룹 목록 새로고침
  await fetchGroups()
  // 새로 생성된 그룹으로 이동
  router.push(`/group/${newGroup.id}`)
}
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top, 20px);
}
</style>
