<template>
  <!-- Desktop View -->
  <DesktopHomeDashboard
    v-if="isDesktop"
    :loading="loading"
    :solo-group="soloGroup"
    :reading-groups="desktopReadingGroups"
    :idle-groups="desktopIdleGroups"
    @create-group="handleCreateGroupClick"
    @join-group="joinGroupModalOpen = true"
  />

  <div v-else class="pb-24 pb-safe px-4 pt-safe min-h-screen bg-gray-50 dark:bg-[#09090b]">
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
          <h1 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight text-gradient">Sidekick</h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">반가워요, {{ userStore.profile?.nickname }}님!</p>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <button
          @click="router.push('/discover')"
          class="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 hover:border-lime-200 transition-colors shadow-sm"
          title="디스커버"
        >
          <Compass :size="20" />
        </button>
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

    <!-- 1. My Library Section (Solo Group) -->
    <div v-if="soloGroup" class="mb-6">
      <div
        @click="router.push('/my-library')"
        class="relative w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex gap-4 items-stretch shadow-sm cursor-pointer group transition-all hover:border-lime-400 dark:hover:border-lime-500 active:scale-[0.98] min-h-[140px]"
      >
        <div v-if="soloGroup.currentBook" class="flex gap-4 w-full">
          <!-- Book Cover -->
          <div class="w-16 sm:w-20 aspect-[2/3] flex-shrink-0 self-center">
            <div class="w-full h-full shadow-md bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
              <img :src="soloGroup.currentBook.cover_url" class="w-full h-full object-cover" />
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <!-- Top: Group Name & D-Day Badge -->
            <div class="flex justify-between items-start mb-1 gap-2">
              <h4 class="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 truncate min-w-0">
                {{ soloGroup.name }}
              </h4>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <!-- D-Day Badge -->
                <Badge variant="lime" size="sm">
                  {{ getDdayShort(soloGroup.currentBook.target_end_date) }}
                </Badge>
                <!-- Done Books Badge -->
                <Badge v-if="soloGroup.doneCount > 0" size="sm">
                  <template #icon><BookOpen :size="10" /></template>
                  {{ soloGroup.doneCount }}
                </Badge>
              </div>
            </div>

            <!-- Middle: Title & Author -->
            <div class="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
              <h3 class="text-base font-bold text-zinc-900 dark:text-white leading-tight line-clamp-2 mb-1 min-h-0">
                {{ soloGroup.currentBook.title }}
              </h3>
              <div class="flex items-center h-4 gap-1 mt-1 whitespace-nowrap overflow-hidden leading-none text-[11px] text-zinc-600 dark:text-zinc-300">
                <p class="truncate max-w-[100px] font-bold flex-shrink-0">
                  {{ soloGroup.currentBook.author }}
                </p>

                <template v-if="soloGroup.currentBook.publisher || soloGroup.currentBook.total_pages">
                  <span class="text-[10px] text-zinc-300 dark:text-zinc-600 font-bold relative -translate-y-[0.5px] flex-shrink-0">·</span>
                  <span v-if="soloGroup.currentBook.publisher" class="truncate max-w-[80px] font-medium flex-shrink-0">{{ soloGroup.currentBook.publisher }}</span>
                  <span v-if="soloGroup.currentBook.publisher && soloGroup.currentBook.total_pages" class="text-[10px] text-zinc-300 dark:text-zinc-600 flex-shrink-0">·</span>
                  <span v-if="soloGroup.currentBook.total_pages" class="font-medium flex-shrink-0">{{ soloGroup.currentBook.total_pages }}p</span>
                </template>
              </div>
            </div>

            <!-- Bottom: Date & Progress -->
            <div class="w-full mt-auto pt-2">
              <div class="flex justify-between items-center mb-0.5 px-0.5">
                <div class="text-[10px] text-zinc-500 dark:text-zinc-400 flex gap-0.5 font-bold">
                  <span>{{ soloGroup.currentBook.target_start_date ? formatDateSimple(soloGroup.currentBook.target_start_date) : 'Start' }}</span>
                  <span>~</span>
                  <span>{{ soloGroup.currentBook.target_end_date ? formatDateSimple(soloGroup.currentBook.target_end_date) : 'End' }}</span>
                </div>
                <span class="text-[10px] font-bold text-lime-600 dark:text-lime-400">{{ Math.round(soloGroup.currentBook.progress) }}%</span>
              </div>
              <div class="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full bg-lime-500 rounded-full transition-all duration-300" :style="{ width: `${soloGroup.currentBook.progress}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex items-center justify-center w-full gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :class="soloGroup.doneCount > 0 ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-lime-100 dark:bg-lime-900/20'">
            {{ soloGroup.doneCount > 0 ? '🎉' : '📚' }}
          </div>
          <div>
            <p class="text-sm font-bold text-zinc-900 dark:text-white">
              {{ soloGroup.doneCount > 0 ? `${soloGroup.doneCount}권의 책을 완독했어요!` : '읽을 책을 추가해보세요' }}
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ soloGroup.doneCount > 0 ? '독서 여정을 이어가세요' : '독서 여정을 시작하세요' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Reading Social Groups Section -->
    <div v-if="readingSocialGroups.length > 0" class="space-y-1 mb-4">
      <div class="flex items-center gap-2 px-1">
        <span class="text-lg">🔥</span>
        <h2 class="text-xs font-bold text-zinc-900 dark:text-white">함께 읽고 있어요</h2>
      </div>
      
      <div class="grid gap-4">
        <div
          v-for="group in readingSocialGroups"
          :key="group.id"
          @click="router.push(`/group/${group.id}`)"
          class="relative w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex gap-4 items-stretch shadow-sm cursor-pointer group transition-all hover:border-lime-400 dark:hover:border-lime-500 active:scale-[0.98] min-h-[140px]"
        >
          <!-- Left: Book Cover (Fixed Aspect Ratio) -->
          <div class="w-16 sm:w-20 aspect-[2/3] flex-shrink-0 self-center">
            <div class="w-full h-full shadow-md bg-zinc-100 dark:bg-zinc-800 rounded-sm overflow-hidden">
              <img
                :src="group.currentBook.cover_url"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

                      <!-- Right: Info -->
                      <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">

                        <!-- Top: Group Name & Badges -->
                        <div class="flex justify-between items-start mb-1 gap-2">
                          <h4 class="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 truncate min-w-0">
                            {{ group.name }}
                          </h4>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <!-- D-Day Badge -->
                  <Badge variant="lime" size="sm">
                    {{ getDdayShort(group.currentBook.target_end_date) }}
                  </Badge>
                  <!-- Members Badge -->
                  <Badge size="sm">
                    <template #icon><User :size="10" /></template>
                    {{ group.members.length }}
                  </Badge>
                  <!-- Done Books Badge -->
                  <Badge v-if="group.doneCount > 0" size="sm">
                    <template #icon><BookOpen :size="10" /></template>
                    {{ group.doneCount }}
                  </Badge>
                </div>
                          
                        </div>
                      <!-- Middle: Title & Author -->
            <div class="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
              <h3 class="text-base font-bold text-zinc-900 dark:text-white leading-tight line-clamp-2 mb-1 min-h-0">
                {{ group.currentBook.title }}
              </h3>
              <div class="flex items-center h-4 gap-1 mt-1 whitespace-nowrap overflow-hidden leading-none text-[11px] text-zinc-600 dark:text-zinc-300">
                <p class="truncate max-w-[100px] font-bold flex-shrink-0">
                  {{ group.currentBook.author }}
                </p>
                
                <template v-if="group.currentBook.publisher || group.currentBook.total_pages">
                  <span class="text-[10px] text-zinc-300 dark:text-zinc-600 font-bold relative -translate-y-[0.5px] flex-shrink-0">·</span>
                  <span v-if="group.currentBook.publisher" class="truncate max-w-[80px] font-medium flex-shrink-0">{{ group.currentBook.publisher }}</span>
                  <span v-if="group.currentBook.publisher && group.currentBook.total_pages" class="text-[10px] text-zinc-300 dark:text-zinc-600 flex-shrink-0">·</span>
                  <span v-if="group.currentBook.total_pages" class="font-medium flex-shrink-0">{{ group.currentBook.total_pages }}p</span>
                </template>
              </div>
            </div>

            <!-- Bottom: Date & Progress -->
            <div class="w-full mt-auto pt-2">
              <div class="flex justify-between items-center mb-0.5 px-0.5">
                <div class="text-[10px] text-zinc-500 dark:text-zinc-400 flex gap-0.5 font-bold">
                  <span>{{ group.currentBook.target_start_date ? formatDateSimple(group.currentBook.target_start_date) : 'Start' }}</span>
                  <span>~</span>
                  <span>{{ group.currentBook.target_end_date ? formatDateSimple(group.currentBook.target_end_date) : 'End' }}</span>
                </div>
                <span class="text-[10px] font-bold text-lime-600 dark:text-lime-400">{{ Math.round(group.currentBook.progress) }}%</span>
              </div>
              <div class="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full bg-lime-500 rounded-full transition-all duration-300" :style="{ width: `${group.currentBook.progress}%` }"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- 3. Idle Social Groups Section -->
    <div v-if="idleSocialGroups.length > 0" class="space-y-1 mb-4">
      <div class="flex items-center gap-2 px-1">
        <span class="text-lg">💤</span>
        <h2 class="text-xs font-bold text-zinc-900 dark:text-white">잠시 쉬고 있어요</h2>
      </div>

      <div class="grid gap-3">
        <div
          v-for="group in idleSocialGroups"
          :key="group.id"
          @click="router.push(`/group/${group.id}`)"
          class="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer group hover:border-lime-400 dark:hover:border-lime-500"
        >
          <!-- Left Icon Box -->
          <div class="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-700 transition-colors group-hover:bg-lime-50 dark:group-hover:bg-lime-900/20 group-hover:border-lime-200 group-hover:text-lime-500 flex-shrink-0">
            <Coffee :size="20" />
          </div>

          <!-- Right Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <!-- Group Name -->
              <h3 class="font-bold text-zinc-900 dark:text-zinc-200 text-sm truncate">{{ group.name }}</h3>
              <!-- Member Badge -->
              <div class="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
                 <User :size="10" />
                 <span>{{ group.members.length }}</span>
              </div>
              <!-- Done Books Badge -->
              <div v-if="group.doneCount > 0" class="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
                 <BookOpen :size="10" />
                 <span>{{ group.doneCount }}</span>
              </div>
            </div>
            <p class="text-xs text-zinc-400 dark:text-zinc-500">
              {{ group.members.length }}명의 멤버가 새 책을 기다리고 있어요
            </p>
          </div>

          <ChevronRight :size="18" class="text-zinc-300 dark:text-zinc-600 group-hover:text-lime-500 transition-colors flex-shrink-0" />
        </div>
      </div>
    </div>

    <!-- Empty State (Social 그룹이 없을 때) -->
    <div v-if="socialGroups.length === 0 && !loading" class="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center">
      <div class="w-24 h-24 bg-gradient-to-tr from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span class="text-5xl">👋</span>
      </div>
      <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">반가워요, {{ userStore.profile?.nickname }}님!</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs leading-relaxed">
        아직 참여 중인 공유 그룹이 없네요.<br />
        새로운 모임을 만들거나 초대를 받아보세요.
      </p>
      
      <div class="w-full max-w-xs space-y-3">
        <button
          @click="handleCreateGroupClick"
          class="w-full py-4 bg-lime-400 text-black font-bold rounded-2xl hover:bg-lime-300 transition-all shadow-lg hover:shadow-lime-400/30 flex items-center justify-center gap-2"
        >
          <Plus :size="20" />
          공유 그룹 만들기
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

    <!-- FAB (항상 표시) -->
    <button
      @click="handleCreateGroupClick"
      class="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-40"
      title="공유 그룹 만들기"
    >
      <Plus :size="24" />
    </button>

  </div>

  <!-- Modals (desktop/mobile 공통) -->
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
</template>


<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { User, Plus, KeyRound, ChevronRight, MessageCircle, Coffee, BookOpen, Compass } from 'lucide-vue-next'
import NotificationCenter from '~/components/NotificationCenter.vue'
import CreateGroupModal from '~/components/CreateGroupModal.vue'
import JoinGroupModal from '~/components/JoinGroupModal.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'

const DesktopHomeDashboard = defineAsyncComponent(() => import('~/components/desktop/home/DesktopHomeDashboard.vue'))

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { fetchLimits, limits, isPremium } = useSubscription()
const { isDesktop } = useDevice()

// Desktop computed
const desktopReadingGroups = computed(() =>
  readingSocialGroups.value.map(g => ({
    id: g.id,
    name: g.name,
    memberCount: g.members?.length || 0,
    currentBook: g.currentBook ? {
      title: g.currentBook.title,
      cover_url: g.currentBook.cover_url,
      progress: g.currentBook.progress
    } : undefined
  }))
)
const desktopIdleGroups = computed(() =>
  idleSocialGroups.value.map(g => ({
    id: g.id,
    name: g.name,
    memberCount: g.members?.length || 0
  }))
)

const groups = ref<any[]>([])
const loading = ref(true)
const createGroupModalOpen = ref(false)
const joinGroupModalOpen = ref(false)

// Computed for splitting groups
// 나간 그룹(left_at이 있는 경우)은 아예 목록에서 제외
const myGroups = computed(() => groups.value.filter(g => !g.left_at))

// Solo 그룹과 Social 그룹 분리
const soloGroup = computed(() => {
  const active = myGroups.value.filter(g => !g.deleted_at && g.status === 'active')
  return active.find(g => g.group_type === 'solo') || null
})

const socialGroups = computed(() => {
  const active = myGroups.value.filter(g => !g.deleted_at && g.status === 'active')
  return active.filter(g => g.group_type === 'social')
})

// Social 그룹만 reading/idle로 분리
const readingSocialGroups = computed(() => socialGroups.value.filter(g => g.currentBook))
const idleSocialGroups = computed(() => socialGroups.value.filter(g => !g.currentBook))

const fetchGroups = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  loading.value = true
  try {
    const { data: memberData, error } = await client
      .from('group_members')
      .select(`
        group_id,
        left_at,
        groups (
          id,
          name,
          group_type,
          status,
          deleted_at
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
          pages_snapshot,
          genre_snapshot,
          books (
            title,
            author,
            publisher,
            official_pages,
            draft_pages,
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
        .is('deleted_at', null)
        .eq('user_reading_progress.user_id', user.id)

      const { data: allMembers } = await client
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)

      // 완독한 책 수 조회
      const { data: doneBooks } = await client
        .from('group_books')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'done')

      const doneCountByGroup = new Map<string, number>()
      doneBooks?.forEach(book => {
        const count = doneCountByGroup.get(book.group_id) || 0
        doneCountByGroup.set(book.group_id, count + 1)
      })

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
          group_type: group.group_type,
          status: group.status,
          deleted_at: group.deleted_at,
          left_at: item.left_at,
          members: { length: memberCountByGroup.get(group.id) || 0 },
          doneCount: doneCountByGroup.get(group.id) || 0,
          currentBook: bookData ? {
            ...bookData.books,
            created_at: bookData.created_at,
            target_start_date: bookData.target_start_date,
            target_end_date: bookData.target_end_date,
            genre: bookData.genre_snapshot || bookData.books?.official_genre || bookData.books?.draft_genre,
            total_pages: bookData.pages_snapshot || bookData.books?.official_pages || bookData.books?.draft_pages,
            progress: bookData.user_reading_progress?.[0]?.progress_pct || 0
          } : null
        }
      })
      
      console.log('[Index] Fetched groups:', groups.value)
      console.log('[Index] Solo:', soloGroup.value ? 1 : 0, 'Social:', socialGroups.value.length)
      console.log('[Index] Reading Social:', readingSocialGroups.value.length, 'Idle Social:', idleSocialGroups.value.length)
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
    fetchGroups(),
    fetchLimits(true) // Force refresh limits
  ])
  console.log('[Index] Loaded limits:', limits.value)
})

const getDaysRemaining = (targetDateStr: string) => {
  const target = new Date(targetDateStr).getTime()
  const now = new Date().getTime()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

const getDdayShort = (targetDateStr: string) => {
  if (!targetDateStr) return '독서 중'
  const days = getDaysRemaining(targetDateStr)
  if (days > 0) return `D-${days}`
  if (days === 0) return 'D-Day'
  return `D+${Math.abs(days)}`
}

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}.${month}.${day}`
}

const handleCreateGroupClick = () => {
  if (!isPremium.value) {
    toast.error('공유 그룹 생성은 프리미엄 구독이 필요합니다.')
    router.push('/subscription')
    return
  }
  createGroupModalOpen.value = true
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