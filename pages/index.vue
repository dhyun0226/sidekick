<template>
  <div class="pb-24 pb-safe px-4 pt-safe min-h-screen bg-gray-50 dark:bg-[#09090b]">
    <!-- Header -->
    <header class="flex justify-between items-center py-6 sticky top-0 z-20 bg-gray-50/80 dark:bg-[#09090b]/80 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div
          @click="router.push('/profile')"
          class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:ring-2 hover:ring-lime-400 transition-all shadow-sm"
        >
          <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
            <User :size="20" />
          </div>
        </div>
        <div>
          <h1 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">My Library</h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">오늘의 독서를 시작해볼까요?</p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <button 
          @click="joinGroupModalOpen = true"
          class="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 hover:border-lime-200 transition-colors shadow-sm"
          title="초대 코드 입력"
        >
          <KeyRound :size="20" />
        </button>
        <div class="relative">
          <NotificationCenter />
        </div>
      </div>
    </header>

    <!-- 1. Reading Now Section -->
    <div v-if="readingGroups.length > 0" class="space-y-1 mb-4">
      <div class="flex items-center gap-2 px-1">
        <span class="text-lg">🔥</span>
        <h2 class="text-xs font-bold text-zinc-900 dark:text-white">지금 읽고 있어요</h2>
      </div>
      
      <div class="grid gap-4">
        <div
          v-for="group in readingGroups"
          :key="group.id"
          @click="router.push(`/group/${group.id}`)"
          class="relative w-full rounded-2xl overflow-hidden shadow-lg cursor-pointer group transition-transform active:scale-[0.98] min-h-[140px]"
        >
          <!-- Background Image (Maximum Vibrancy) -->
          <div class="absolute inset-0 z-0">
            <img :src="group.currentBook.cover_url" class="w-full h-full object-cover blur-2xl opacity-85 scale-125" />
            <!-- Theme-aware Overlay -->
            <div class="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10 dark:from-black/30 dark:via-transparent dark:to-black/40"></div>
          </div>

          <!-- Content Wrapper -->
          <div class="absolute inset-0 z-10 p-4 flex gap-4 items-stretch">

            <!-- Left: Book Cover (Fixed Aspect Ratio) -->
            <div class="w-16 sm:w-20 aspect-[2/3] flex-shrink-0 self-center">
              <div class="w-full h-full shadow-2xl bg-zinc-800 rounded-sm overflow-hidden">
                <img
                  :src="group.currentBook.cover_url"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Right: Info -->
            <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
              
              <!-- Top: Group Name & Badges -->
              <div class="flex justify-between items-start mb-0.5">
                <h4 class="text-sm font-bold text-zinc-900 dark:text-white truncate pr-2">
                  {{ group.name }}
                </h4>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <!-- D-Day Badge (Drawer Style Match) -->
                  <div class="text-[10px] font-bold text-lime-700 dark:text-lime-400 bg-lime-50 dark:bg-lime-900/20 px-1.5 py-0.5 rounded shadow-sm">
                    {{ getDdayShort(group.currentBook.target_end_date) }}
                  </div>
                  <!-- Members Badge (Drawer Style Match) -->
                  <div class="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shadow-sm">
                    <User :size="10" />
                    <span>{{ group.members.length }}</span>
                  </div>
                </div>
              </div>

              <!-- Middle: Title & Author -->
              <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-base font-bold text-zinc-900 dark:text-white leading-tight line-clamp-2 mb-1">
                  {{ group.currentBook.title }}
                </h3>
                <div class="flex items-center h-4 gap-1 mt-1 whitespace-nowrap overflow-hidden leading-none text-[11px] text-zinc-700 dark:text-zinc-100">
                  <p class="truncate max-w-[100px] font-bold">
                    {{ group.currentBook.author }}
                  </p>
                  
                  <template v-if="group.currentBook.publisher || group.currentBook.total_pages">
                    <span class="text-[10px] text-zinc-400 dark:text-white/60 font-bold relative -translate-y-[0.5px]">·</span>
                    <span v-if="group.currentBook.publisher" class="truncate max-w-[80px] font-bold">{{ group.currentBook.publisher }}</span>
                    <span v-if="group.currentBook.publisher && group.currentBook.total_pages" class="text-[10px] opacity-60">·</span>
                    <span v-if="group.currentBook.total_pages" class="font-bold">{{ group.currentBook.total_pages }}p</span>
                  </template>
                </div>
              </div>

              <!-- Bottom: Date & Progress -->
              <div class="w-full mt-auto">
                <div class="flex justify-between items-center mb-1 px-0.5">
                  <div class="text-[10px] text-zinc-800 dark:text-white flex gap-0.5 font-mono font-bold">
                    <span>{{ group.currentBook.target_start_date ? formatDateSimple(group.currentBook.target_start_date) : 'Start' }}</span>
                    <span>~</span>
                    <span>{{ group.currentBook.target_end_date ? formatDateSimple(group.currentBook.target_end_date) : 'End' }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-lime-600 dark:text-lime-400">{{ Math.round(group.currentBook.progress) }}%</span>
                </div>
                <div class="h-1.5 w-full bg-black/10 dark:bg-white/20 rounded-full overflow-hidden">
                  <div class="h-full bg-lime-500 rounded-full transition-all duration-300" :style="{ width: `${group.currentBook.progress}%` }"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Idle Groups Section -->
    <div v-if="idleGroups.length > 0" class="space-y-1 mb-4">
      <div class="flex items-center gap-2 px-1">
        <span class="text-lg">💤</span>
        <h2 class="text-xs font-bold text-zinc-900 dark:text-white">잠시 쉬고 있어요</h2>
      </div>

      <div class="grid gap-3">
        <div
          v-for="group in idleGroups"
          :key="group.id"
          @click="router.push(`/group/${group.id}`)"
          class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
        >
          <!-- Left Icon Box (Mimics Book Cover) -->
          <div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
            <Coffee :size="24" />
          </div>

          <!-- Right Content -->
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-zinc-900 dark:text-zinc-200 mb-1 text-sm truncate">{{ group.name }}</h3>
            <div class="flex items-center gap-1">
               <User :size="12" class="text-zinc-400" />
               <p class="text-xs text-zinc-500 dark:text-zinc-500">멤버 {{ group.members.length }}명</p>
            </div>
          </div>

          <button class="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-lime-500 transition-colors flex-shrink-0">
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="groups.length === 0 && !loading" class="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div class="w-24 h-24 bg-gradient-to-tr from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span class="text-5xl">👋</span>
      </div>
      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">반가워요, {{ userStore.profile?.nickname }}님!</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs leading-relaxed">
        아직 참여 중인 독서 모임이 없네요.<br />
        새로운 모임을 만들거나 초대를 받아보세요.
      </p>
      
      <div class="w-full max-w-xs space-y-3">
        <button
          @click="createGroupModalOpen = true"
          class="w-full py-4 bg-lime-400 text-black font-bold rounded-2xl hover:bg-lime-300 transition-all shadow-lg hover:shadow-lime-400/30 flex items-center justify-center gap-2"
        >
          <Plus :size="20" />
          새 그룹 만들기
        </button>
        <button
          @click="joinGroupModalOpen = true"
          class="w-full py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          <KeyRound :size="20" class="text-zinc-400" />
          초대 코드로 입장
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <LoadingSpinner size="lg" message="그룹 목록 불러오는 중..." />
    </div>

    <!-- FAB -->
    <button
      v-if="groups.length > 0"
      @click="createGroupModalOpen = true"
      class="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-40"
    >
      <Plus :size="24" />
    </button>

    <!-- Modals -->
    <CreateGroupModal
      :isOpen="createGroupModalOpen"
      @close="createGroupModalOpen = false"
      @created="handleGroupCreated"
    />
    <JoinGroupModal
      :isOpen="joinGroupModalOpen"
      @close="joinGroupModalOpen = false"
      @joined="handleGroupJoined"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { User, Plus, KeyRound, ChevronRight, MessageCircle, Coffee } from 'lucide-vue-next'
import NotificationCenter from '~/components/NotificationCenter.vue'
import CreateGroupModal from '~/components/CreateGroupModal.vue'
import JoinGroupModal from '~/components/JoinGroupModal.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'

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

// Computed for splitting groups
const readingGroups = computed(() => groups.value.filter(g => g.currentBook))
const idleGroups = computed(() => groups.value.filter(g => !g.currentBook))

const fetchGroups = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  loading.value = true
  try {
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
      const groupIds = memberData.map((item: any) => item.groups.id)

      const { data: allBooks } = await client
        .from('group_books')
        .select(`
          id,
          group_id,
          created_at,
          target_start_date,
          target_end_date,
          books (
            title,
            author,
            publisher,
            total_pages,
            cover_url,
            official_genre,
            draft_genre
          ),
          user_reading_progress!left (
            last_read_at,
            progress_pct
          )
        `)
        .in('group_id', groupIds)
        .eq('status', 'reading')
        .eq('user_reading_progress.user_id', user.id)

      const { data: allMembers } = await client
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)

      const booksByGroup = new Map<string, any[]>()
      allBooks?.forEach(book => {
        if (!booksByGroup.has(book.group_id)) {
          booksByGroup.set(book.group_id, [])
        }
        booksByGroup.get(book.group_id)!.push(book)
      })

      const memberCountByGroup = new Map<string, number>()
      allMembers?.forEach(member => {
        const count = memberCountByGroup.get(member.group_id) || 0
        memberCountByGroup.set(member.group_id, count + 1)
      })

      groups.value = memberData.map((item: any) => {
        const group = item.groups
        const bookDataList = booksByGroup.get(group.id) || []

        const sortedBooks = bookDataList.sort((a: any, b: any) => {
          const aLastRead = a.user_reading_progress?.[0]?.last_read_at
          const bLastRead = b.user_reading_progress?.[0]?.last_read_at

          if (!aLastRead && !bLastRead) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          if (!aLastRead) return 1
          if (!bLastRead) return -1
          return new Date(bLastRead).getTime() - new Date(aLastRead).getTime()
        })

        const bookData = sortedBooks[0]

        return {
          id: group.id,
          name: group.name,
          members: { length: memberCountByGroup.get(group.id) || 0 },
          currentBook: bookData ? {
            ...bookData.books,
            created_at: bookData.created_at,
            target_start_date: bookData.target_start_date,
            target_end_date: bookData.target_end_date,
            genre: bookData.books?.official_genre || bookData.books?.draft_genre,
            progress: bookData.user_reading_progress?.[0]?.progress_pct || 0
          } : null
        }
      })
    }
  } catch (e: any) {
    console.error('Error fetching groups:', e)
    toast.error('그룹 목록을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    userStore.fetchProfile(),
    fetchGroups()
  ])
})

const getDaysRemaining = (targetDateStr: string) => {
  const target = new Date(targetDateStr).getTime()
  const now = new Date().getTime()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

const getDdayShort = (targetDateStr: string) => {
  if (!targetDateStr) return 'Reading'
  const days = getDaysRemaining(targetDateStr)
  if (days > 0) return `D-${days}`
  if (days === 0) return 'D-Day'
  return `D+${Math.abs(days)}`
}

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear().toString().slice(-2)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}.${month}.${day}`
}

const handleGroupCreated = async (newGroup: any) => {
  toast.success('새 그룹이 생성되었습니다!')
  await fetchGroups()
  router.push(`/group/${newGroup.id}`)
}

const handleGroupJoined = async (groupId: string) => {
  await fetchGroups()
  router.push(`/group/${groupId}`)
}
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top, 20px);
}
</style>
