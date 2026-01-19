<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col">
      
      <div class="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 class="text-lg font-black text-zinc-900 dark:text-white">설정</h3>
        <button @click="$emit('close')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 text-left">
        <!-- Profile Edit -->
        <section>
          <div class="flex items-center justify-between mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">프로필 편집</h4>
          </div>
          
          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800/50">
            <div class="flex flex-col items-center gap-4 mb-6">
              <div class="relative group cursor-pointer" @click="triggerFileInput">
                <div class="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-700 shadow-xl relative">
                  <img v-if="previewAvatar" :src="previewAvatar" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600"><UserIcon :size="40"/></div>
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera :size="24" class="text-white" />
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
                  <Camera :size="14" class="text-black" />
                </div>
              </div>
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
            </div>

            <div class="space-y-2">
              <label class="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">닉네임</label>
              <div class="flex gap-2">
                <input v-model="editNickname" type="text" class="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white transition-all" />
                <button @click="saveProfile" class="flex-shrink-0 p-3 bg-zinc-900 dark:bg-zinc-700 text-white rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-all active:scale-95 disabled:opacity-50" :disabled="isSaving">
                  <div v-if="isSaving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <Save v-else :size="20" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Display Settings -->
        <section>
          <div class="flex items-center justify-between mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">화면 설정</h4>
          </div>
          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800">
            <!-- Library View Mode -->
            <div class="p-4 space-y-3">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500">
                  <LayoutGrid :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">서재 보기</span>
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

            <!-- Calendar Cover Settings -->
            <div class="p-4 space-y-3">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500">
                  <Calendar :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">캘린더 표지</span>
              </div>
              <div class="flex p-1 bg-zinc-200 dark:bg-zinc-700/50 rounded-xl">
                <button 
                  @click="appSettings.calendar_include_comments = true"
                  class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                  :class="appSettings.calendar_include_comments ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                >
                  모두
                </button>
                <button 
                  @click="appSettings.calendar_include_comments = false"
                  class="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                  :class="!appSettings.calendar_include_comments ? 'bg-white dark:bg-zinc-600 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'"
                >
                  리뷰만
                </button>
              </div>
              <p class="text-[10px] text-zinc-400 px-1">
                {{ appSettings.calendar_include_comments ? '코멘트와 리뷰를 남긴 날에 표지가 표시됩니다.' : '리뷰를 남긴 날에만 표지가 표시됩니다.' }}
              </p>
            </div>
          </div>
        </section>

        <!-- App Settings (Theme & Notification) -->
        <section>
          <div class="flex items-center justify-between mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">앱 설정</h4>
          </div>
          <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors" @click="$emit('toggle-theme')">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500">
                  <Moon v-if="isDark" :size="16" />
                  <Sun v-else :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">다크 모드</span>
              </div>
              <div class="w-10 h-5 rounded-full transition-colors duration-300 relative" :class="isDark ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'">
                <div class="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm" :class="isDark ? 'translate-x-5' : 'translate-x-0'"></div>
              </div>
            </div>

            <div class="p-4 space-y-4">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center shadow-sm text-zinc-500">
                  <Bell :size="16" />
                </div>
                <span class="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">알림 설정</span>
              </div>
              <div class="space-y-3.5 pl-11">
                <div v-for="(enabled, type) in notificationSettings" :key="type" class="flex items-center justify-between cursor-pointer" @click="notificationSettings[type] = !notificationSettings[type]">
                  <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">{{ getNotificationLabel(type) }}</span>
                  <div class="w-8 h-4 rounded-full transition-colors duration-300 relative" :class="notificationSettings[type] ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'">
                    <div class="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm" :class="notificationSettings[type] ? 'translate-x-4' : 'translate-x-0'"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Account -->
        <section class="pb-4">
          <div class="flex items-center justify-between mb-4 px-1">
            <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider">계정</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button @click="$emit('sign-out')" class="py-3.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 border border-zinc-100 dark:border-zinc-800"><LogOut :size="14" /> 로그아웃</button>
            <button @click="$emit('delete-account')" class="py-3.5 bg-red-50/50 dark:bg-red-900/10 text-red-500/80 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 border border-red-100/50 dark:border-red-900/20"><Trash2 :size="14" /> 계정 삭제</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, User as UserIcon, Camera, Save, LogOut, Trash2, Moon, Sun, Bell, LayoutGrid, Calendar } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean, profile: any, notificationSettings: any, appSettings: any, isSaving: boolean
}>()

const emit = defineEmits(['close', 'save-profile', 'handle-file', 'sign-out', 'delete-account', 'toggle-theme'])

const { isDark } = useTheme()
const editNickname = ref(props.profile?.nickname || '')
const previewAvatar = ref(props.profile?.avatar_url || '')
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.profile, (np) => {
  if (np) { editNickname.value = np.nickname; previewAvatar.value = np.avatar_url || '' }
}, { immediate: true })

const getNotificationLabel = (type: string) => {
  const labels: Record<string, string> = { 
    comment_reply: '내 글에 달린 답글', 
    reaction: '내 기록에 달린 반응', 
    member_join: '새로운 멤버 가입', 
    completion: '멤버의 완독 소식', 
    book_added: '새로운 책 추가',
    group_archived: '그룹 활동 종료'
  }
  return labels[type] || type
}

const triggerFileInput = () => fileInput.value?.click()
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('handle-file', file)
}
const saveProfile = () => emit('save-profile', editNickname.value)
</script>