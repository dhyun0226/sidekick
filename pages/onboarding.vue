<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#09090b] relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-lime-400/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-md space-y-8 relative z-10">
      <!-- Welcome Message -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-600 mb-4 shadow-lg shadow-lime-400/20">
          <span class="text-4xl">👋</span>
        </div>
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white">환영합니다!</h1>
        <p class="text-zinc-600 dark:text-zinc-400">프로필을 설정하고 독서를 시작해보세요</p>
      </div>

      <!-- Profile Setup Form -->
      <div class="space-y-6 bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-300 dark:border-zinc-800 rounded-2xl p-8">

        <!-- Avatar Section -->
        <div class="flex flex-col items-center space-y-4">
          <div class="relative group cursor-pointer" @click="handleAvatarClick">
            <div class="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-lime-400 transition-colors">
              <!-- Preview Image -->
              <img
                v-if="avatarPreview"
                :src="avatarPreview"
                class="w-full h-full object-cover"
                alt="Avatar Preview"
              />
              <!-- Default Icon -->
              <div v-else class="w-full h-full flex items-center justify-center text-zinc-600 dark:text-zinc-500">
                <User :size="40" />
              </div>
            </div>

            <!-- Hover Overlay -->
            <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera :size="24" class="text-white" />
            </div>
          </div>

          <!-- Hidden File Input -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />

          <div class="text-center space-y-1">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">프로필 사진 선택 (선택 사항)</p>
            <p class="text-xs text-zinc-600">클릭하여 이미지 업로드</p>
          </div>

          <!-- Upload Progress -->
          <div v-if="uploading" class="w-full">
            <div class="flex items-center gap-2 text-xs text-lime-400">
              <div class="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
              <span>업로드 중...</span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-zinc-300 dark:border-zinc-800"></div>

        <!-- Nickname Input -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-zinc-700 dark:text-zinc-300">닉네임 *</label>
          <input
            v-model="nickname"
            type="text"
            placeholder="사용할 닉네임을 입력하세요"
            maxlength="20"
            class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all placeholder-zinc-600 dark:placeholder-zinc-500"
            @keyup.enter="handleSubmit"
          />
          <div class="flex justify-between items-center text-xs">
            <span class="text-zinc-600">2-20자 사이로 입력해주세요</span>
            <span class="text-zinc-600 dark:text-zinc-500">{{ nickname.length }}/20</span>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          @click="handleSubmit"
          class="w-full bg-lime-400 text-black font-bold py-4 rounded-xl hover:bg-lime-300 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          :disabled="!canSubmit || loading"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            처리 중...
          </span>
          <span v-else>시작하기</span>
        </button>

      </div>

      <!-- Skip Option (Optional) -->
      <p class="text-center text-xs text-zinc-600">
        나중에 프로필 페이지에서 수정할 수 있습니다
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Camera } from 'lucide-vue-next'

const router = useRouter()
const client = useSupabaseClient()
const user = useSupabaseUser()

// State
const nickname = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string>('')
const avatarUrl = ref<string>('')
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Computed
const canSubmit = computed(() =>
  nickname.value.trim().length >= 2 &&
  nickname.value.trim().length <= 20 &&
  !loading.value
)

onMounted(async () => {
  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()

  // 사용자가 로그인하지 않았으면 로그인 페이지로
  if (!currentUser) {
    router.push('/login')
    return
  }

  // 이미 닉네임이 설정된 프로필이 있으면 홈으로 (중복 온보딩 방지)
  const { data: existingProfile } = await client
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .maybeSingle()

  if (existingProfile && existingProfile.nickname) {
    console.log('Profile already complete, redirecting to home')
    router.push('/')
    return
  }

  // OAuth 프로바이더의 프로필 이미지는 미리보기로 표시 (사용자가 선택 가능)
  if (currentUser.user_metadata?.avatar_url) {
    avatarPreview.value = currentUser.user_metadata.avatar_url
    avatarUrl.value = currentUser.user_metadata.avatar_url
  } else if (currentUser.user_metadata?.picture) {
    avatarPreview.value = currentUser.user_metadata.picture
    avatarUrl.value = currentUser.user_metadata.picture
  }
})

// 파일 선택 트리거
const handleAvatarClick = () => {
  fileInput.value?.click()
}

// 파일 선택 처리
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 파일 크기 체크 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    alert('파일 크기는 5MB 이하여야 합니다.')
    return
  }

  // 이미지 타입 체크
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.')
    return
  }

  avatarFile.value = file

  // 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 프로필 저장
const handleSubmit = async () => {
  if (!canSubmit.value) {
    return
  }

  // 현재 로그인한 유저 가져오기
  const { data: { user: currentUser } } = await client.auth.getUser()
  if (!currentUser) {
    console.error('User not authenticated')
    alert('로그인 정보가 없습니다. 다시 로그인해주세요.')
    router.push('/login')
    return
  }

  loading.value = true

  try {
    // 최종 아바타 URL (빈 문자열이나 undefined 방지)
    let finalAvatarUrl = avatarUrl.value || null

    // 1. 이미지 파일이 있으면 Supabase Storage에 업로드 시도
    if (avatarFile.value) {
      uploading.value = true

      try {
        const fileExt = avatarFile.value.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        // RLS 정책에 맞게 사용자 ID 폴더 안에 저장
        const filePath = `${currentUser.id}/${fileName}`

        console.log('[Onboarding] Uploading avatar to:', filePath)

        const { data: uploadData, error: uploadError } = await client.storage
          .from('avatars')
          .upload(filePath, avatarFile.value, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error('[Onboarding] Avatar upload error:', uploadError)
          // Storage 버킷이 없거나 업로드 실패 → OAuth 아바타 사용
          console.warn('[Onboarding] Using OAuth avatar as fallback')
          uploading.value = false
        } else {
          // 업로드 성공: Public URL 생성
          const { data: { publicUrl } } = client.storage
            .from('avatars')
            .getPublicUrl(filePath)

          finalAvatarUrl = publicUrl
          console.log('[Onboarding] Avatar uploaded successfully:', publicUrl)
          uploading.value = false
        }
      } catch (err) {
        console.error('[Onboarding] Unexpected upload error:', err)
        uploading.value = false
      }
    }

    // 2. users 테이블의 프로필 UPDATE (트리거가 이미 row 생성함)
    console.log('Updating profile for user:', currentUser.id)
    const { error: updateError } = await client
      .from('users')
      .update({
        nickname: nickname.value.trim(),
        avatar_url: finalAvatarUrl
      })
      .eq('id', currentUser.id)

    if (updateError) {
      throw updateError
    }

    // 3. 성공 - 홈으로 이동
    console.log('Profile updated successfully')
    router.push('/')

  } catch (error: any) {
    console.error('Profile update error:', error)
    alert(`프로필 생성 실패: ${error.message}`)
  } finally {
    loading.value = false
  }
}
</script>
