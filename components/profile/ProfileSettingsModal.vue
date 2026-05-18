<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100010] flex items-center justify-center px-4"
    tabindex="-1"
    @keydown.esc="$emit('close')"
  >
    <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="$emit('close')"></div>

    <div class="relative w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <div class="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 class="text-lg font-black text-zinc-900 dark:text-white">설정</h3>
          <p class="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">계정과 사용 환경을 관리합니다.</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-zinc-400 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="닫기"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 text-left">
        <section>
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">계정</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
            <div class="flex flex-col items-center gap-4 mb-6">
              <div class="relative group cursor-pointer" @click="triggerFileInput">
                <div class="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-700 shadow-xl relative">
                  <img v-if="previewAvatar" :src="previewAvatar" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-500">
                    <UserIcon :size="40" />
                  </div>
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera :size="24" class="text-white" />
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
                  <Camera :size="14" class="text-black" />
                </div>
              </div>
              <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileChange" />
            </div>

            <div class="space-y-2">
              <label class="block text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase ml-1">닉네임</label>
              <div class="flex gap-2">
                <input
                  v-model="editNickname"
                  type="text"
                  class="flex-1 min-w-0 bg-white dark:bg-zinc-900 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-zinc-900 dark:text-white transition-all"
                />
                <button
                  @click="saveProfile"
                  class="flex-shrink-0 p-3 bg-zinc-900 dark:bg-zinc-700 text-white rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all active:scale-95 disabled:opacity-50"
                  :disabled="isSaving"
                  title="프로필 저장"
                >
                  <div v-if="isSaving" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <Save v-else :size="20" />
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-3">
            <button
              @click="$emit('sign-out')"
              class="py-3.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 border border-zinc-100 dark:border-zinc-800"
            >
              <LogOut :size="14" />
              로그아웃
            </button>
            <button
              @click="$emit('delete-account')"
              class="py-3.5 bg-red-50/50 dark:bg-red-900/10 text-red-500/80 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 border border-red-100/50 dark:border-red-900/20"
            >
              <Trash2 :size="14" />
              계정 삭제
            </button>
          </div>
        </section>

        <section>
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">v2 읽기 동행</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800">
            <NuxtLink
              v-for="item in companionLinks"
              :key="item.to"
              :to="item.to"
              class="flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
              @click="$emit('close')"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <component :is="item.icon" :size="16" />
                </div>
                <div>
                  <span class="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200">{{ item.label }}</span>
                  <span class="block text-[11px] text-zinc-400 dark:text-zinc-500">{{ item.caption }}</span>
                </div>
              </div>
              <ChevronRight :size="16" class="text-zinc-400 dark:text-zinc-300" />
            </NuxtLink>
          </div>
        </section>

        <section>
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">화면</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors" @click="$emit('toggle-theme')">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <Moon v-if="isDark" :size="16" />
                  <Sun v-else :size="16" />
                </div>
                <div>
                  <span class="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200">다크 모드</span>
                  <span class="block text-[11px] text-zinc-400 dark:text-zinc-500">앱 전체 테마를 전환합니다.</span>
                </div>
              </div>
              <div class="w-10 h-5 rounded-full transition-colors duration-300 relative" :class="isDark ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'">
                <div class="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm" :class="isDark ? 'translate-x-5' : 'translate-x-0'"></div>
              </div>
            </div>

            <div class="p-4 space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <LayoutGrid :size="16" />
                </div>
                <div>
                  <span class="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200">서재 보기</span>
                  <span class="block text-[11px] text-zinc-400 dark:text-zinc-500">프로필 서재의 기본 묶음을 정합니다.</span>
                </div>
              </div>
              <div class="flex p-1 bg-zinc-200 dark:bg-zinc-700/50 rounded-xl">
                <button
                  v-for="mode in (['year', 'month'] as const)"
                  :key="mode"
                  @click="appSettings.library_view_mode = mode"
                  class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                  :class="appSettings.library_view_mode === mode ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                >
                  {{ mode === 'year' ? '연도별' : '월별' }}
                </button>
              </div>
            </div>

            <div class="p-4 space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <Calendar :size="16" />
                </div>
                <div>
                  <span class="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200">캘린더 표시</span>
                  <span class="block text-[11px] text-zinc-400 dark:text-zinc-500">표지가 표시되는 활동 기준입니다.</span>
                </div>
              </div>
              <div class="flex p-1 bg-zinc-200 dark:bg-zinc-700/50 rounded-xl">
                <button
                  @click="appSettings.calendar_include_comments = true"
                  class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                  :class="appSettings.calendar_include_comments ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                >
                  코멘트와 리뷰
                </button>
                <button
                  @click="appSettings.calendar_include_comments = false"
                  class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                  :class="!appSettings.calendar_include_comments ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                >
                  리뷰만
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">알림</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 p-4 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                <Bell :size="16" />
              </div>
              <div>
                <span class="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200">알림 설정</span>
                <span class="block text-[11px] text-zinc-400 dark:text-zinc-500">그룹과 기록 활동 알림을 선택합니다.</span>
              </div>
            </div>

            <div class="space-y-3.5">
              <div
                v-for="(enabled, type) in notificationSettings"
                :key="type"
                class="flex items-center justify-between cursor-pointer"
                @click="notificationSettings[type] = !notificationSettings[type]"
              >
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">{{ getNotificationLabel(type) }}</span>
                <div class="w-8 h-4 rounded-full transition-colors duration-300 relative" :class="notificationSettings[type] ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'">
                  <div class="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm" :class="notificationSettings[type] ? 'translate-x-4' : 'translate-x-0'"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">구독</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
            <button
              @click="$emit('upgrade')"
              class="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors rounded-2xl"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <CreditCard :size="16" />
                </div>
                <div class="text-left">
                  <span class="block text-[13px] font-bold text-zinc-700 dark:text-zinc-200">{{ isPremium ? '프리미엄' : '무료' }}</span>
                  <span class="block text-[11px] font-medium text-zinc-400 dark:text-zinc-400">{{ isPremium ? '구독 관리' : '프리미엄으로 업그레이드' }}</span>
                </div>
              </div>
              <ChevronRight :size="16" class="text-zinc-400 dark:text-zinc-300" />
            </button>
          </div>
        </section>

        <section>
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">문의</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
            <button
              @click="$emit('open-inquiry')"
              class="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors rounded-2xl"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <MessageCircle :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">문의하기</span>
              </div>
              <ChevronRight :size="16" class="text-zinc-400 dark:text-zinc-300" />
            </button>
          </div>
        </section>

        <section class="pb-4">
          <div class="mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">약관 및 정책</h4>
          </div>

          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800">
            <NuxtLink to="/terms" class="flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <FileText :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">이용약관</span>
              </div>
              <ChevronRight :size="16" class="text-zinc-400 dark:text-zinc-300" />
            </NuxtLink>
            <NuxtLink to="/privacy" class="flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500 dark:text-zinc-400">
                  <Shield :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">개인정보처리방침</span>
              </div>
              <ChevronRight :size="16" class="text-zinc-400 dark:text-zinc-300" />
            </NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Camera,
  ChevronRight,
  Compass,
  CreditCard,
  FileText,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Moon,
  Save,
  Shield,
  Sun,
  Trash2,
  User as UserIcon,
  X
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  profile: any
  notificationSettings: Record<string, boolean>
  appSettings: {
    library_view_mode: 'year' | 'month'
    calendar_include_comments: boolean
  }
  isSaving: boolean
  isPremium: boolean
}>()

const emit = defineEmits([
  'close',
  'save-profile',
  'handle-file',
  'sign-out',
  'delete-account',
  'toggle-theme',
  'open-inquiry',
  'upgrade'
])

const { isDark } = useTheme()
const editNickname = ref(props.profile?.nickname || '')
const previewAvatar = ref(props.profile?.avatar_url || '')
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.profile, (nextProfile) => {
  if (nextProfile) {
    editNickname.value = nextProfile.nickname
    previewAvatar.value = nextProfile.avatar_url || ''
  }
}, { immediate: true })

const getNotificationLabel = (type: string) => {
  const labels: Record<string, string> = {
    comment_reply: '내 댓글의 답글',
    reaction: '내 기록의 반응',
    member_join: '새 멤버 참여',
    completion: '멤버 완독',
    book_added: '새 책 추가',
    group_archived: '그룹 종료'
  }
  return labels[type] || type
}

const triggerFileInput = () => fileInput.value?.click()

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('handle-file', file)
}

const saveProfile = () => emit('save-profile', editNickname.value)

const companionLinks = [
  { to: '/v2', label: '동행 설정', caption: '캐릭터와 배경을 바꿉니다.', icon: BookOpen },
  { to: '/recap/v2', label: '리캡', caption: '읽은 시간과 기록을 요약합니다.', icon: BarChart3 },
  { to: '/recommendations/v2', label: '추천', caption: '다음 책 후보를 봅니다.', icon: Compass }
]
</script>
