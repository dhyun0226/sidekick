<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-background pb-20">
    <!-- Header -->
    <header class="flex items-center gap-4 px-4 h-14 border-b border-zinc-200 dark:border-zinc-800">
      <button @click="router.back()" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
        <ChevronLeft :size="24" />
      </button>
      <h1 class="text-lg font-bold text-zinc-900 dark:text-white">내 정보 수정</h1>
    </header>

    <div class="p-6 space-y-8">
      <!-- Stats Section -->
      <div class="grid grid-cols-2 gap-4">
        <button
          @click="showReadingHistory = true"
          class="bg-white dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-300 dark:border-zinc-700 hover:border-lime-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-left group"
        >
          <div class="text-xs text-zinc-600 dark:text-zinc-500 mb-1 group-hover:text-lime-400 transition-colors">읽은 책 (리뷰)</div>
          <div class="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-lime-400 transition-colors">{{ totalBooks }}<span class="text-sm text-zinc-500 font-normal ml-1">권</span></div>
        </button>
        <div class="bg-white dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-300 dark:border-zinc-700">
          <div class="text-xs text-zinc-600 dark:text-zinc-500 mb-1">참여 중인 그룹</div>
          <div class="text-2xl font-bold text-lime-400">{{ totalGroups }}<span class="text-sm text-zinc-500 font-normal ml-1">개</span></div>
        </div>
      </div>

      <!-- Reading Stats Card (New) -->
      <ReadingStatsCard />

      <!-- Monthly Reading Chart -->
      <MonthlyReadingChart />

      <!-- Profile Image -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative group cursor-pointer" @click="triggerFileInput">
          <div class="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-lime-400 transition-colors">
            <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
              <User :size="40" />
            </div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <div v-if="uploadingAvatar" class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <Camera v-else :size="24" class="text-white" />
          </div>
        </div>
        <p class="text-xs text-zinc-500">{{ uploadingAvatar ? '업로드 중...' : '프로필 사진 변경' }}</p>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handleAvatarUpload"
        />
      </div>

      <!-- Form -->
      <div class="space-y-6">
        <div>
          <label class="block text-xs font-bold text-zinc-600 dark:text-zinc-500 mb-2 uppercase">닉네임</label>
          <input
            v-model="nickname"
            type="text"
            class="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            placeholder="닉네임을 입력하세요"
          />
        </div>

        <button
          @click="saveProfile"
          class="w-full bg-lime-400 text-black font-bold py-4 rounded-xl hover:bg-lime-300 transition-colors disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? '저장 중...' : '저장하기' }}
        </button>
      </div>

      <!-- Theme & Notification Settings -->
      <div class="space-y-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <h2 class="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase">설정</h2>

        <!-- Theme Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm">테마</div>
            <div class="text-xs text-zinc-500">라이트 / 다크 모드</div>
          </div>
          <button
            @click="toggleTheme"
            class="relative w-14 h-7 rounded-full transition-colors"
            :class="theme === 'dark' ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-700'"
          >
            <div
              class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform flex items-center justify-center text-xs"
              :class="theme === 'dark' ? 'translate-x-7' : ''"
            >
              <Sun v-if="theme === 'light'" :size="14" class="text-yellow-500" />
              <Moon v-else :size="14" class="text-zinc-800" />
            </div>
          </button>
        </div>

        <!-- Notification Settings -->
        <div class="space-y-4">
          <div class="font-medium text-zinc-900 dark:text-zinc-200 text-sm">알림 설정</div>

          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-600 dark:text-zinc-400">댓글 답글 알림</div>
            <button
              @click="toggleNotification('comment_reply')"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="notificationSettings.comment_reply ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-700'"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                :class="notificationSettings.comment_reply ? 'translate-x-6' : ''"
              ></div>
            </button>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-600 dark:text-zinc-400">리액션 알림</div>
            <button
              @click="toggleNotification('reaction')"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="notificationSettings.reaction ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-700'"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                :class="notificationSettings.reaction ? 'translate-x-6' : ''"
              ></div>
            </button>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-600 dark:text-zinc-400">새 멤버 가입 알림</div>
            <button
              @click="toggleNotification('member_join')"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="notificationSettings.member_join ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-700'"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                :class="notificationSettings.member_join ? 'translate-x-6' : ''"
              ></div>
            </button>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm text-zinc-600 dark:text-zinc-400">완독 축하 알림</div>
            <button
              @click="toggleNotification('completion')"
              class="relative w-12 h-6 rounded-full transition-colors"
              :class="notificationSettings.completion ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-700'"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                :class="notificationSettings.completion ? 'translate-x-6' : ''"
              ></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Account Actions -->
      <div class="pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <div class="space-y-3">
          <button
            @click="handleSignOut"
            class="w-full py-3 text-red-400 bg-red-400/10 rounded-xl font-medium hover:bg-red-400/20 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut :size="20" />
            로그아웃
          </button>

          <button
            @click="showDeleteConfirm = true"
            class="w-full py-3 text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/20 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800/40 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 :size="20" />
            계정 삭제
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>

      <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-white">계정 삭제</h2>
          <button @click="showDeleteConfirm = false" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4 mb-6">
          <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p class="text-sm text-red-400 font-medium mb-2">⚠️ 주의: 이 작업은 되돌릴 수 없습니다!</p>
            <p class="text-xs text-red-400/80">계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:</p>
          </div>

          <ul class="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 ml-4">
            <li class="flex items-center gap-2">
              <span class="w-1 h-1 bg-red-400 rounded-full"></span>
              모든 그룹 참여 기록
            </li>
            <li class="flex items-center gap-2">
              <span class="w-1 h-1 bg-red-400 rounded-full"></span>
              작성한 모든 리뷰와 코멘트
            </li>
            <li class="flex items-center gap-2">
              <span class="w-1 h-1 bg-red-400 rounded-full"></span>
              독서 진행도 및 통계
            </li>
            <li class="flex items-center gap-2">
              <span class="w-1 h-1 bg-red-400 rounded-full"></span>
              프로필 정보 (닉네임, 아바타)
            </li>
          </ul>
        </div>

        <div class="flex gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="handleAccountDelete"
            :disabled="deletingAccount"
            class="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ deletingAccount ? '삭제 중...' : '영구 삭제' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reading History Modal -->
    <ReadingHistoryModal :is-open="showReadingHistory" @close="showReadingHistory = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { ChevronLeft, User, Camera, LogOut, Trash2, X, Sun, Moon } from 'lucide-vue-next'
import ReadingStatsCard from '~/components/ReadingStatsCard.vue'
import MonthlyReadingChart from '~/components/MonthlyReadingChart.vue'
import ReadingHistoryModal from '~/components/ReadingHistoryModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()
const { theme, toggleTheme: toggleThemeComposable } = useTheme()

const nickname = ref('')
const loading = ref(false)
const uploadingAvatar = ref(false)
const totalBooks = ref(0)
const totalGroups = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)
const showReadingHistory = ref(false)
const showDeleteConfirm = ref(false)
const deletingAccount = ref(false)

// Notification settings
const notificationSettings = ref({
  comment_reply: true,
  reaction: true,
  member_join: true,
  completion: true
})

const fetchStats = async () => {
  // 현재 로그인한 유저 ID 가져오기
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  // 1. Total Books (unique ISBNs from reviews)
  // Since reviews are now per group_book, we need to count unique books
  const { data: reviewsData } = await client
    .from('reviews')
    .select('group_books!inner(isbn)')
    .eq('user_id', user.id)

  // Count unique ISBNs
  const uniqueIsbns = new Set(reviewsData?.map((r: any) => r.group_books.isbn) || [])
  totalBooks.value = uniqueIsbns.size

  // 2. Total Groups
  const { count: groupCount } = await client
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  totalGroups.value = groupCount || 0
}

onMounted(async () => {
  console.log('[Profile] Component mounted')
  console.log('[Profile] userStore.user:', userStore.user)
  console.log('[Profile] userStore.profile before fetch:', userStore.profile)

  await userStore.fetchProfile()

  console.log('[Profile] userStore.profile after fetch:', userStore.profile)
  if (userStore.profile) {
    nickname.value = userStore.profile.nickname || ''

    // Load notification settings
    if (userStore.profile.notification_settings) {
      notificationSettings.value = userStore.profile.notification_settings
    }

    console.log('[Profile] Nickname set to:', nickname.value)
  } else {
    console.log('[Profile] No profile found after fetch!')
  }
  await fetchStats()
})

const saveProfile = async () => {
  // 현재 로그인한 유저 ID 가져오기
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  loading.value = true

  const { error } = await client
    .from('users')
    .update({ nickname: nickname.value })
    .eq('id', user.id)

  loading.value = false

  if (error) {
    alert('프로필 저장 실패: ' + error.message)
  } else {
    alert('프로필이 저장되었습니다.')
    await userStore.fetchProfile() // Refresh store
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    alert('JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.')
    return
  }

  // Validate file size (2MB limit)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    alert('파일 크기는 2MB 이하여야 합니다.')
    return
  }

  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    alert('로그인이 필요합니다.')
    return
  }

  uploadingAvatar.value = true

  try {
    // File name: {userId}/avatar.{extension}
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    console.log('[Avatar Upload] Uploading to:', filePath)

    // Delete old avatar if exists
    const { data: oldFiles } = await client.storage
      .from('avatars')
      .list(user.id)

    if (oldFiles && oldFiles.length > 0) {
      const filesToDelete = oldFiles.map(f => `${user.id}/${f.name}`)
      await client.storage
        .from('avatars')
        .remove(filesToDelete)
      console.log('[Avatar Upload] Deleted old avatars:', filesToDelete)
    }

    // Upload new avatar
    const { data: uploadData, error: uploadError } = await client.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('[Avatar Upload] Upload error:', uploadError)
      throw uploadError
    }

    console.log('[Avatar Upload] Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = client.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    console.log('[Avatar Upload] Public URL:', avatarUrl)

    // Update user profile
    const { error: updateError } = await client
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Avatar Upload] Profile update error:', updateError)
      throw updateError
    }

    console.log('[Avatar Upload] Profile updated successfully')

    // Refresh user store
    await userStore.fetchProfile()

    alert('프로필 사진이 변경되었습니다! 🎉')

  } catch (error: any) {
    console.error('[Avatar Upload] Error:', error)
    alert('업로드 실패: ' + (error.message || '알 수 없는 오류'))
  } finally {
    uploadingAvatar.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleSignOut = async () => {
  if (confirm('정말 로그아웃 하시겠습니까?')) {
    await userStore.signOut()
  }
}

const toggleTheme = () => {
  toggleThemeComposable()
}

const toggleNotification = async (key: 'comment_reply' | 'reaction' | 'member_join' | 'completion') => {
  notificationSettings.value[key] = !notificationSettings.value[key]

  // Save to database
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  const { error } = await client
    .from('users')
    .update({ notification_settings: notificationSettings.value })
    .eq('id', user.id)

  if (error) {
    console.error('Notification settings update error:', error)
    // Revert on error
    notificationSettings.value[key] = !notificationSettings.value[key]
  }
}

const handleAccountDelete = async () => {
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  deletingAccount.value = true

  try {
    // Delete user from auth (cascade will delete all related data)
    const { error } = await client.auth.admin.deleteUser(user.id)

    if (error) {
      // If admin API not available, use RPC or direct delete
      // This requires proper RLS policies
      console.error('Delete error:', error)

      // Alternative: Delete user record (auth.users deletion requires admin)
      // For now, just sign out and show message
      alert('계정 삭제는 관리자 권한이 필요합니다. 고객센터에 문의해주세요.')
      return
    }

    alert('계정이 삭제되었습니다.')
    await userStore.signOut()

  } catch (error: any) {
    console.error('Account deletion error:', error)
    alert('계정 삭제 실패: ' + (error.message || '알 수 없는 오류'))
  } finally {
    deletingAccount.value = false
    showDeleteConfirm.value = false
  }
}
</script>
