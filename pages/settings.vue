<template>
  <div>
    <!-- Desktop View -->
    <DesktopSettingsView
      v-if="isDesktop"
      :profile="userStore.profile"
      :saving="isSaving"
      :is-dark="isDark"
      :input-mode="inputMode"
      :notification-settings="notificationSettings"
      :is-premium="isPremium"
      @save-profile="saveProfile"
      @file-change="handleFileChange"
      @toggle-theme="toggleTheme"
      @change-input-mode="changeInputMode"
      @toggle-notification="toggleNotification"
      @upgrade="router.push('/subscription')"
      @manage-subscription="router.push('/subscription')"
      @sign-out="handleSignOut"
      @delete-account="handleDeleteAccount"
    />

    <!-- Mobile: redirect to profile settings -->
    <div v-else class="min-h-screen bg-gray-50 dark:bg-[#09090b] flex items-center justify-center">
      <p class="text-sm text-zinc-500">설정은 프로필에서 확인하세요.</p>
    </div>

    <!-- Modals -->
    <ConfirmModal
      :isOpen="showLogoutConfirm"
      title="로그아웃"
      message="정말 로그아웃 하시겠습니까?"
      confirmText="로그아웃"
      cancelText="취소"
      variant="warning"
      @confirm="confirmLogout"
      @cancel="showLogoutConfirm = false"
    />

    <ConfirmModal
      :isOpen="showDeleteConfirm"
      title="계정 삭제"
      message="정말 계정을 삭제하시겠습니까?"
      description="모든 데이터가 영구적으로 삭제됩니다."
      confirmText="삭제하기"
      cancelText="취소"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import ConfirmModal from '~/components/ConfirmModal.vue'

const DesktopSettingsView = defineAsyncComponent(() => import('~/components/desktop/settings/DesktopSettingsView.vue'))

definePageMeta({ middleware: ['auth'] })

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { isDesktop } = useDevice()
const { isDark, toggleTheme } = useTheme()
const { isPremium } = useSubscription()

const isSaving = ref(false)
const showLogoutConfirm = ref(false)
const showDeleteConfirm = ref(false)

const notificationSettings = ref<Record<string, boolean>>({
  comment_reply: true, reaction: true, member_join: true,
  completion: true, book_added: true, group_archived: true
})

const inputMode = ref<'percent' | 'page'>('percent')

onMounted(async () => {
  // On mobile, redirect to profile
  if (!isDesktop.value) {
    router.replace('/profile')
    return
  }
  await userStore.fetchProfile()
  if (userStore.profile?.notification_settings) {
    notificationSettings.value = { ...notificationSettings.value, ...userStore.profile.notification_settings }
  }
  if (userStore.profile?.app_settings) {
    inputMode.value = (userStore.profile.app_settings as any)?.preferred_input_mode || 'percent'
  }
})

const saveProfile = async (nickname: string) => {
  const userId = userStore.profile?.id
  if (!userId || !nickname.trim()) return
  isSaving.value = true
  try {
    await client.from('users').update({ nickname: nickname.trim() }).eq('id', userId)
    await userStore.fetchProfile(true)
    toast.success('닉네임 변경 완료!')
  } catch { toast.error('저장 실패') }
  finally { isSaving.value = false }
}

const handleFileChange = async (file: File) => {
  const userId = userStore.profile?.id
  if (!userId) return
  isSaving.value = true
  try {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    await client.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    const { data: { publicUrl } } = client.storage.from('avatars').getPublicUrl(path)
    await client.from('users').update({ avatar_url: publicUrl }).eq('id', userId)
    await userStore.fetchProfile(true)
    toast.success('프로필 사진 변경 완료!')
  } catch { toast.error('사진 업로드 실패') }
  finally { isSaving.value = false }
}

const changeInputMode = async (mode: 'percent' | 'page') => {
  inputMode.value = mode
  const userId = userStore.profile?.id
  if (!userId) return
  const currentSettings = userStore.profile?.app_settings || {}
  await client.from('users').update({
    app_settings: { ...currentSettings, preferred_input_mode: mode }
  }).eq('id', userId)
}

const toggleNotification = async (key: string) => {
  notificationSettings.value[key] = !notificationSettings.value[key]
  const userId = userStore.profile?.id
  if (!userId) return
  await client.from('users').update({ notification_settings: notificationSettings.value }).eq('id', userId)
}

const handleSignOut = () => { showLogoutConfirm.value = true }
const confirmLogout = async () => {
  showLogoutConfirm.value = false
  await userStore.signOut()
  router.push('/login')
}

const handleDeleteAccount = () => { showDeleteConfirm.value = true }
const confirmDelete = async () => {
  try {
    await client.from('users').delete().eq('id', userStore.user!.id)
    await userStore.signOut()
    toast.success('계정 삭제 완료')
    router.push('/login')
  } catch { toast.error('계정 삭제 실패') }
}
</script>
