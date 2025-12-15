<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#09090b] pb-20">
    <!-- 1. Compact Header -->
    <div class="pt-safe pb-4">
      
      <!-- Nav Bar -->
      <div class="flex justify-between items-center px-4 py-6">
        <button @click="router.back()" class="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <ChevronLeft :size="24" />
        </button>
        <div class="flex gap-1">
          <button @click="openSettings" class="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <Settings :size="24" />
          </button>
        </div>
      </div>

      <!-- Profile & Stats -->
      <div class="px-4 flex flex-col gap-6">
        <!-- Identity -->
        <div class="flex items-center gap-4">
          <div class="relative group cursor-pointer" @click="openSettings">
            <div class="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                <User :size="24" />
              </div>
            </div>
            <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 :size="16" class="text-white" />
            </div>
          </div>
          
          <div class="flex-1">
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white mb-0.5">
              {{ userStore.profile?.nickname }}
            </h1>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">오늘도 즐거운 독서 되세요!</p>
          </div>
        </div>

        <!-- Stats Row (Text-based, Clickable) -->
        <div class="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800/50 pt-4">
          <button @click="activeTab = 'library'" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.books }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">완독</span>
          </button>
          <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>
          
          <button @click="activeTab = 'timeline'" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.comments }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">기록</span>
          </button>
          <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

          <button @click="activeTab = 'insight'" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-lime-600 dark:text-lime-400">{{ stats.streak }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">연속</span>
          </button>
          <div class="w-px h-8 bg-zinc-200 dark:bg-zinc-700"></div>

          <button @click="router.push('/')" class="flex flex-col items-center flex-1 active:opacity-60 transition-opacity">
            <span class="text-lg font-bold text-zinc-900 dark:text-white">{{ stats.groups }}</span>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400">그룹</span>
          </button>
        </div>
      </div>
    </div>


    <!-- 3. Tabs -->
    <div class="sticky top-0 z-30 bg-gray-50/95 dark:bg-[#09090b]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 mb-4">
      <div class="flex">
        <button
          @click="activeTab = 'library'"
          class="flex-1 py-4 text-sm font-bold transition-colors relative"
          :class="activeTab === 'library' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          서재 (Library)
          <div v-if="activeTab === 'library'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-6"></div>
        </button>
        <button
          @click="activeTab = 'timeline'"
          class="flex-1 py-4 text-sm font-bold transition-colors relative"
          :class="activeTab === 'timeline' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          기록 (Timeline)
          <div v-if="activeTab === 'timeline'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-6"></div>
        </button>
        <button
          @click="activeTab = 'insight'"
          class="flex-1 py-4 text-sm font-bold transition-colors relative"
          :class="activeTab === 'insight' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-500'"
        >
          분석 (Insight)
          <div v-if="activeTab === 'insight'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 mx-6"></div>
        </button>
      </div>
    </div>

    <!-- 4. Content Area -->
    <div class="px-4 min-h-[300px]">
      
      <!-- Tab 1: Library Grid (Moved First) -->
      <div v-if="activeTab === 'library'">
        <div v-if="loading" class="py-20 text-center text-zinc-500">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm">서재를 정리하는 중...</p>
        </div>

        <div v-else-if="library.length === 0" class="py-16 flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <div class="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm mb-4 text-3xl">
            📚
          </div>
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">서재가 비어있어요</h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs leading-relaxed">
            책을 완독하면 이곳에 쌓입니다.<br/>첫 번째 책을 완료해보세요!
          </p>
          <button 
            @click="router.push('/')"
            class="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            책 읽으러 가기
          </button>
        </div>

        <div v-else class="grid grid-cols-3 gap-3 sm:gap-4">
          <div
            v-for="book in library"
            :key="book.id"
            class="relative group cursor-pointer aspect-[1/1.6]"
          >
            <img 
              :src="book.cover_url" 
              class="w-full h-full object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
            />
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
              <p class="text-white text-xs font-bold line-clamp-2 mb-1">{{ book.title }}</p>
              <div v-if="book.myRating" class="flex gap-0.5">
                 <Star :size="10" fill="white" class="text-white" />
                 <span class="text-[10px] text-white font-bold">{{ book.myRating }}</span>
              </div>
              <span class="text-[10px] text-zinc-300 mt-2">{{ formatDateSimple(book.finished_at) }} 완독</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tab 2: Timeline Feed (Moved Second) -->
      <div v-if="activeTab === 'timeline'" class="space-y-4">
        <div v-if="loading" class="py-20 text-center text-zinc-500">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm">나의 기록을 모으는 중...</p>
        </div>

        <div v-else-if="timeline.length === 0" class="py-16 flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <div class="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm mb-4 text-3xl">
            ✍️
          </div>
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">아직 남긴 기록이 없어요</h3>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs leading-relaxed">
            책을 읽으며 인상 깊은 문장에<br/>첫 번째 생각을 남겨보세요.
          </p>
          <button 
            @click="router.push('/')"
            class="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            내 그룹으로 가기
          </button>
        </div>

        <div
          v-else
          v-for="item in timeline"
          :key="item.id"
          @click="navigateToItem(item)"
          class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 active:scale-[0.99] transition-transform cursor-pointer"
        >
          <!-- Context Header -->
          <div class="flex items-center gap-3 mb-3">
            <img :src="item.bookCover" class="w-8 h-12 object-cover rounded bg-zinc-200 dark:bg-zinc-800 shadow-sm flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center text-xs text-zinc-500 dark:text-zinc-400 mb-0.5 space-x-1">
                <span class="truncate max-w-[100px]">{{ item.groupName }}</span>
                <span>•</span>
                <span class="truncate">{{ item.bookTitle }}</span>
              </div>
              <div class="text-xs font-medium text-lime-600 dark:text-lime-400">
                {{ item.type === 'review' ? '⭐ 리뷰' : `${item.chapter || Math.round(item.position_pct) + '%'} 지점` }}
              </div>
            </div>
            <div class="text-[10px] text-zinc-400 whitespace-nowrap self-start mt-1">
              {{ formatDate(item.created_at) }}
            </div>
          </div>

          <!-- Content Body -->
          <div class="pl-11">
            <!-- Anchor Text (Quote) -->
            <div v-if="item.anchor_text" class="mb-2 pl-3 border-l-2 border-zinc-300 dark:border-zinc-700">
              <p class="text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-2">"{{ item.anchor_text }}"</p>
            </div>

            <!-- User Text -->
            <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap line-clamp-4">{{ item.content }}</p>

            <!-- Rating (Review Only) -->
            <div v-if="item.type === 'review'" class="flex gap-0.5 mt-2">
              <Star v-for="i in 5" :key="i" :size="14" :fill="i <= item.rating ? '#FACC15' : 'none'" class="text-yellow-400" />
            </div>

            <!-- Footer Stats -->
            <div class="flex gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
               <div class="text-xs text-zinc-400">
                 {{ item.type === 'comment' ? '💬 댓글' : '📝 서평' }}
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Insight (Stats) -->
      <div v-if="activeTab === 'insight'">
        <div v-if="loading" class="py-20 text-center text-zinc-500">
          <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm">독서 패턴을 분석하는 중...</p>
        </div>
        
        <div v-else class="space-y-4">
          <!-- Heatmap Component -->
          <ReadingHeatmap :activities="timeline" />

          <!-- Additional Insights Placeholders (Future) -->
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <h3 class="text-base font-bold text-zinc-900 dark:text-white mb-2">📊 독서 요약</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span class="text-zinc-500 dark:text-zinc-400">이번 달 읽은 책</span>
                <span class="font-bold text-zinc-900 dark:text-white">{{ thisMonthBooks }}권</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-zinc-500 dark:text-zinc-400">이번 달 남긴 생각</span>
                <span class="font-bold text-zinc-900 dark:text-white">{{ thisMonthComments }}개</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Settings Modal -->
    <div v-if="settingsModalOpen" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="settingsModalOpen = false"></div>
      <div class="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl animate-scale-up border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white">설정</h3>
          <button @click="settingsModalOpen = false" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>
        
        <div class="space-y-8">
          <!-- 1. Profile Edit -->
          <section>
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-3 px-1">프로필 편집</h4>
            <div class="flex flex-col items-center gap-3 mb-4">
              <div class="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 relative group cursor-pointer" @click="triggerFileInput">
                 <img v-if="previewAvatar" :src="previewAvatar" class="w-full h-full object-cover" />
                 <div v-else class="w-full h-full flex items-center justify-center text-zinc-400"><User :size="32"/></div>
                 <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera :size="20" class="text-white" />
                 </div>
              </div>
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
              <button @click="triggerFileInput" class="text-xs text-lime-500 font-medium hover:underline">사진 변경</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-zinc-500 mb-1 px-1">닉네임</label>
              <div class="flex gap-2">
                <input 
                  v-model="editNickname" 
                  type="text" 
                  class="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white"
                />
                <button 
                  @click="saveProfile" 
                  class="px-4 py-2 bg-lime-400 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2" 
                  :disabled="isSaving"
                >
                  <div v-if="isSaving" class="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span v-else>저장</span>
                </button>
              </div>
            </div>
          </section>

          <!-- 2. App Settings -->
          <section class="space-y-3">
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2 px-1">앱 설정</h4>
            
            <!-- Dark Mode -->
            <div class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer" @click="toggleTheme">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-white dark:bg-zinc-700 rounded-full shadow-sm text-zinc-600 dark:text-zinc-300">
                  <Moon v-if="isDark" :size="18" />
                  <Sun v-else :size="18" />
                </div>
                <span class="text-sm font-medium text-zinc-900 dark:text-white">다크 모드</span>
              </div>
              <div 
                class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                :class="isDark ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
              >
                <div 
                  class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                  :class="isDark ? 'translate-x-5' : 'translate-x-0'"
                ></div>
              </div>
            </div>

            <!-- Notifications -->
            <div class="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
              <div class="flex items-center gap-3 mb-2">
                <div class="p-2 bg-white dark:bg-zinc-700 rounded-full shadow-sm text-zinc-600 dark:text-zinc-300">
                  <Bell :size="18" />
                </div>
                <span class="text-sm font-medium text-zinc-900 dark:text-white">알림 설정</span>
              </div>
              
              <div class="space-y-3 pl-2 pr-1">
                <!-- 1. Comment Replies -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.comment_reply = !notificationSettings.comment_reply">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">내 글에 달린 답글</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.comment_reply ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.comment_reply ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 2. Reactions -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.reaction = !notificationSettings.reaction">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">반응/좋아요</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.reaction ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.reaction ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 3. Member Join -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.member_join = !notificationSettings.member_join">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">새 멤버 가입</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.member_join ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.member_join ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>

                <!-- 4. Completion -->
                <div class="flex items-center justify-between cursor-pointer" @click="notificationSettings.completion = !notificationSettings.completion">
                  <span class="text-xs text-zinc-600 dark:text-zinc-400">책 완독 알림</span>
                  <div
                    class="w-11 h-6 rounded-full transition-colors duration-200 relative"
                    :class="notificationSettings.completion ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'"
                  >
                    <div
                      class="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200 shadow-sm"
                      :class="notificationSettings.completion ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. Account -->
          <section>
            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2 px-1">계정</h4>
            <button
              @click="handleSignOut"
              class="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut :size="18" />
              로그아웃
            </button>
          </section>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { ChevronLeft, LogOut, User, Camera, Edit2, Star, Heart, Settings, Moon, Sun, Bell, X } from 'lucide-vue-next'
import ReadingHeatmap from '~/components/ReadingHeatmap.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { isDark, toggleTheme } = useTheme()

// State
const activeTab = ref<'timeline' | 'library' | 'insight'>('library')
const loading = ref(true)
const timeline = ref<any[]>([])
const library = ref<any[]>([])
const stats = ref({
  books: 0,
  comments: 0,
  streak: 0,
  groups: 0
})

// Settings Modal State
const settingsModalOpen = ref(false)
const notificationSettings = ref({
  comment_reply: true,
  reaction: true,
  member_join: true,
  completion: true
})

// Edit Profile State
const editNickname = ref('')
const previewAvatar = ref('')
const avatarFile = ref<File | null>(null)
const isSaving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Computed
const currentUserId = computed(() => userStore.user?.id)

const thisMonthBooks = computed(() => {
  const now = new Date()
  return library.value.filter(book => {
    const d = new Date(book.finished_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

const thisMonthComments = computed(() => {
  const now = new Date()
  return timeline.value.filter(item => {
    const d = new Date(item.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

// Initialization
onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.profile) {
    editNickname.value = userStore.profile.nickname
    previewAvatar.value = userStore.profile.avatar_url || ''

    // Load notification settings from DB
    if (userStore.profile.notification_settings) {
      notificationSettings.value = userStore.profile.notification_settings
    }
  }
  await fetchData()
})

// Auto-save notification settings on change
watch(notificationSettings, async (newSettings) => {
  if (!currentUserId.value) return

  try {
    const { error } = await client
      .from('users')
      .update({ notification_settings: newSettings })
      .eq('id', currentUserId.value)

    if (error) throw error

    // Silently update store without showing toast
    await userStore.fetchProfile()
  } catch (err: any) {
    console.error('Save notification settings error:', err)
    toast.error('알림 설정 저장 실패')
  }
}, { deep: true })

const fetchData = async () => {
  // 방어 코드: 유저 ID가 없으면 로딩을 끄고 종료
  if (!currentUserId.value) {
    console.warn('User ID not found, stopping fetch')
    loading.value = false
    return
  }
  
  loading.value = true

  try {
    // 1. Fetch Timeline (Comments + Reviews)
    // We need to fetch comments and reviews separately and merge them because Supabase doesn't support Union queries easily via JS client
    
    // Fetch Comments
    const { data: commentsData } = await client
      .from('comments')
      .select(`
        id, content, anchor_text, position_pct, created_at,
        group_book:group_books (
          id,
          group:groups (name, id),
          book:books (title, cover_url, official_toc, draft_toc, total_pages)
        )
      `)
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false })
      .limit(100) // Limit increased for heatmap

    // Fetch Reviews
    const { data: reviewsData } = await client
      .from('reviews')
      .select(`
        id, content, rating, created_at,
        book:books (title, cover_url),
        group_book_id
      `) // Note: reviews table links to books(isbn), but we might not have group info directly if we don't join group_books properly. 
         // However, reviews usually happen in context of a group_book. 
         // Let's assume for now we just show book info.
         // Actually, our schema says reviews has book_id (isbn) and user_id. It doesn't strictly link to group_book_id in schema (check schema).
         // Schema check: reviews(user_id, book_id, rating, content). No group_book_id.
         // So we can't easily link review to a group unless we infer it.
         // For now, we'll just show book info for reviews.
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false })
      .limit(50)

    // Merge and Normalize
    const normalizedComments = (commentsData || []).map((c: any) => ({
      type: 'comment',
      id: c.id,
      created_at: c.created_at,
      content: c.content,
      anchor_text: c.anchor_text,
      position_pct: c.position_pct,
      
      // Metadata
      groupId: c.group_book?.group?.id,
      groupName: c.group_book?.group?.name || 'Unknown Group',
      bookTitle: c.group_book?.book?.title || 'Unknown Book',
      bookCover: c.group_book?.book?.cover_url,
      
      // Navigation Data
      groupBookId: c.group_book?.id,
      
      // Chapter Name Calculation (Frontend side)
      chapter: calculateChapter(c.position_pct, c.group_book?.book)
    }))

    const normalizedReviews = (reviewsData || []).map((r: any) => ({
      type: 'review',
      id: r.id,
      created_at: r.created_at,
      content: r.content,
      rating: r.rating,
      
      // Metadata
      groupId: null, // Reviews are global in this schema, or we'd need complex join
      groupName: 'Library',
      bookTitle: r.book?.title,
      bookCover: r.book?.cover_url,
      
      // Navigation Data (Maybe jump to book page?)
      bookId: r.book_id // ISBN
    }))

    const merged = [...normalizedComments, ...normalizedReviews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    timeline.value = merged

    // 2. Fetch Library (Finished Books)
    // Find group_books where status='done' for groups I'm in?
    // Or user_reading_progress where status='done'? 
    // Schema check: group_books has status='done'. But that's for the GROUP.
    // Did I finish it? 
    // Ideally we check `user_reading_progress`.
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select(`
        finished_at,
        group_book:group_books (
          book:books (title, cover_url, isbn)
        )
      `)
      .eq('user_id', currentUserId.value)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })

    library.value = (progressData || []).map((p: any) => ({
      id: p.group_book?.book?.isbn, // Use ISBN as ID
      title: p.group_book?.book?.title,
      cover_url: p.group_book?.book?.cover_url,
      finished_at: p.finished_at,
      // Find my rating for this book
      myRating: normalizedReviews.find((r: any) => r.bookTitle === p.group_book?.book?.title)?.rating // Simple matching
    }))

    // 2.5 Fetch Group Count
    const { count: groupCount } = await client
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId.value)

    // 3. Stats
    stats.value = {
      books: library.value.length,
      comments: commentsData?.length || 0,
      streak: await calculateStreak(),
      groups: groupCount || 0
    }

  } catch (err: any) {
    console.error('Fetch profile data error:', err)
    toast.error('데이터를 불러오는데 실패했습니다: ' + err.message)
  } finally {
    loading.value = false
  }
}

const calculateChapter = (pct: number, book: any) => {
  if (!book) return null
  const toc = book.official_toc || book.draft_toc
  if (!toc || !Array.isArray(toc)) return null
  
  // Need to normalize TOC if stored as pages vs pct. 
  // Assuming TOC in DB is standardized or we just use raw if it looks like PCT.
  // Implementation specific. Let's return null to fallback to PCT display for now.
  return null 
}

const calculateStreak = async () => {
  // Streak based on comments and reviews (activity days)
  if (!currentUserId.value) return 0

  try {
    // 1. Fetch all comments and reviews
    const { data: commentsData } = await client
      .from('comments')
      .select('created_at')
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false })

    const { data: reviewsData } = await client
      .from('reviews')
      .select('created_at')
      .eq('user_id', currentUserId.value)
      .order('created_at', { ascending: false })

    // 2. Extract dates (YYYY-MM-DD format)
    const allDates = [
      ...(commentsData || []).map(c => c.created_at.split('T')[0]),
      ...(reviewsData || []).map(r => r.created_at.split('T')[0])
    ]

    // 3. Remove duplicates and sort descending
    const uniqueDates = [...new Set(allDates)].sort().reverse()

    if (uniqueDates.length === 0) return 0

    // 4. Check if streak is still active (today or yesterday)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0 // Streak broken
    }

    // 5. Count consecutive days
    let streak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1])
      const prevDate = new Date(uniqueDates[i])
      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / 86400000
      )

      if (diffDays === 1) {
        streak++
      } else {
        break // Streak broken
      }
    }

    return streak
  } catch (err) {
    console.error('Calculate streak error:', err)
    return 0
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

const formatDateSimple = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}`
}

const navigateToItem = (item: any) => {
  if (item.type === 'comment' && item.groupId) {
    // Navigate to group page with query to jump to position
    router.push({
      path: `/group/${item.groupId}`,
      query: { 
        jumpTo: item.position_pct,
        highlightComment: item.id
      }
    })
  } else if (item.type === 'review') {
    // Maybe go to a book detail page (not implemented yet) or just stay
    toast.info('서평 상세 페이지는 준비 중입니다.')
  }
}

// Settings / Edit Profile Logic
const openSettings = () => {
  settingsModalOpen.value = true
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    avatarFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      previewAvatar.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = async () => {
  if (!editNickname.value.trim()) return
  isSaving.value = true
  
  try {
    let avatarUrl = userStore.profile?.avatar_url

    // Upload new avatar if selected
    if (avatarFile.value && currentUserId.value) {
      const fileExt = avatarFile.value.name.split('.').pop()
      const fileName = `${currentUserId.value}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(fileName, avatarFile.value, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = client.storage
        .from('avatars')
        .getPublicUrl(fileName)
        
      avatarUrl = publicUrl
    }

    // Update DB
    const { error: updateError } = await client
      .from('users')
      .update({
        nickname: editNickname.value,
        avatar_url: avatarUrl
      })
      .eq('id', currentUserId.value)

    if (updateError) throw updateError

    await userStore.fetchProfile() // Refresh store
    toast.success('프로필이 업데이트되었습니다.')
    // settingsModalOpen.value = false // Keep open or close? Usually close is fine, or let user close.
    // Let's keep it open to show success, or close it? The user clicked save button next to nickname.
    // Let's not close the whole settings modal, just show toast.
    
  } catch (err: any) {
    console.error('Save profile error:', err)
    toast.error('프로필 저장 실패: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

const handleSignOut = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    await userStore.signOut()
    router.push('/login')
  }
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes scale-up {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-up {
  animation: scale-up 0.2s ease-out;
}
</style>