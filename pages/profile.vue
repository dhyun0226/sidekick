<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Header -->
    <header class="flex items-center gap-4 px-4 h-14 border-b border-zinc-800">
      <button @click="router.back()" class="text-zinc-400 hover:text-white">
        <ChevronLeft :size="24" />
      </button>
      <h1 class="text-lg font-bold text-white">내 정보 수정</h1>
    </header>

    <div class="p-6 space-y-8">
      <!-- Stats Section (New) -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
          <div class="text-xs text-zinc-500 mb-1">읽은 책 (리뷰)</div>
          <div class="text-2xl font-bold text-white">{{ totalBooks }}<span class="text-sm text-zinc-500 font-normal ml-1">권</span></div>
        </div>
        <div class="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
          <div class="text-xs text-zinc-500 mb-1">참여 중인 그룹</div>
          <div class="text-2xl font-bold text-lime-400">{{ totalGroups }}<span class="text-sm text-zinc-500 font-normal ml-1">개</span></div>
        </div>
      </div>

      <!-- Monthly Chart (CSS-based Mock) -->
      <div class="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800">
        <div class="text-xs font-bold text-zinc-500 mb-4 uppercase">월별 독서량</div>
        <div class="flex items-end justify-between h-32 gap-2">
          <div v-for="(height, i) in [30, 45, 20, 60, 80, 50, 40, 70, 90, 55, 65, 40]" :key="i" class="w-full bg-zinc-700 rounded-t-sm relative group">
            <div class="absolute bottom-0 w-full bg-lime-400/80 rounded-t-sm transition-all duration-500 group-hover:bg-lime-400" :style="{ height: height + '%' }"></div>
          </div>
        </div>
        <div class="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span>
        </div>
      </div>

      <!-- Profile Image -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative group cursor-pointer" @click="triggerFileInput">
          <div class="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 group-hover:border-lime-400 transition-colors">
            <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-zinc-500">
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
          <label class="block text-xs font-bold text-zinc-500 mb-2 uppercase">닉네임</label>
          <input 
            v-model="nickname" 
            type="text" 
            class="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
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

      <!-- Account Actions -->
      <div class="pt-8 border-t border-zinc-800">
        <button 
          @click="handleSignOut"
          class="w-full py-3 text-red-400 bg-red-400/10 rounded-xl font-medium hover:bg-red-400/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut :size="20" />
          로그아웃
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { ChevronLeft, User, Camera, LogOut } from 'lucide-vue-next'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()

const nickname = ref('')
const loading = ref(false)
const uploadingAvatar = ref(false)
const totalBooks = ref(0)
const totalGroups = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

const fetchStats = async () => {
  // 현재 로그인한 유저 ID 가져오기
  const { data: { user } } = await client.auth.getUser()
  if (!user) return

  // 1. Total Books (Reviews count)
  const { count: reviewCount } = await client
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  totalBooks.value = reviewCount || 0

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
</script>
