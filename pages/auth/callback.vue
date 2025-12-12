<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#09090b]">
    <div class="text-center space-y-4">
      <!-- Loading Spinner -->
      <div v-if="!error" class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-400/20 animate-pulse">
        <div class="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Error State -->
      <div v-else class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white">
          {{ error ? '로그인 실패' : '로그인 중입니다...' }}
        </h2>
        <p class="text-sm text-zinc-600 dark:text-zinc-400">
          {{ error || '잠시만 기다려주세요' }}
        </p>
      </div>

      <!-- Retry Button (Only on Error) -->
      <button
        v-if="error"
        @click="redirectToLogin"
        class="mt-4 px-6 py-3 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors"
      >
        로그인 페이지로 돌아가기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const client = useSupabaseClient()
const error = ref<string | null>(null)

const redirectToLogin = () => {
  router.push('/login')
}

onMounted(async () => {
  try {
    console.log('[OAuth Callback] Starting authentication...')

    // 1. URL에서 에러 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search)
    const errorFromUrl = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (errorFromUrl) {
      console.error('[OAuth Callback] Error from URL:', errorFromUrl, errorDescription)
      error.value = errorDescription || '인증 중 오류가 발생했습니다.'
      return
    }

    // 2. Supabase가 OAuth 콜백을 자동으로 처리하고 세션 확인
    // getUser()는 현재 액세스 토큰을 검증하고 사용자 정보를 반환
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError) {
      console.error('[OAuth Callback] Auth error:', authError)
      error.value = '인증에 실패했습니다. 다시 로그인해주세요.'
      setTimeout(redirectToLogin, 3000)
      return
    }

    if (!user) {
      console.error('[OAuth Callback] No user found')
      error.value = '사용자 정보를 찾을 수 없습니다.'
      setTimeout(redirectToLogin, 3000)
      return
    }

    console.log('[OAuth Callback] User authenticated:', user.id)

    // 3. users 테이블에서 프로필 조회 (트리거가 자동 생성했을 것)
    const { data: profile, error: profileError } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[OAuth Callback] Profile fetch error:', profileError)
      // 프로필 조회 실패는 치명적이지 않음 - 온보딩으로 이동
    }

    console.log('[OAuth Callback] Profile:', profile)
    console.log('[OAuth Callback] Profile nickname:', profile?.nickname)
    console.log('[OAuth Callback] Profile avatar:', profile?.avatar_url)

    // 4. 라우팅 결정
    // 프로필이 없거나 닉네임이 없으면 → 온보딩
    if (!profile || !profile.nickname || profile.nickname.trim() === '') {
      console.log('[OAuth Callback] → Redirecting to onboarding (no profile or nickname)')
      router.push('/onboarding')
      return
    }

    // 프로필이 완성된 사용자 → 홈으로
    console.log('[OAuth Callback] → Redirecting to home (profile complete)')
    console.log('[OAuth Callback] User will see:', {
      nickname: profile.nickname,
      avatar: profile.avatar_url
    })
    router.push('/')

  } catch (err: any) {
    console.error('[OAuth Callback] Unexpected error:', err)
    error.value = '예상치 못한 오류가 발생했습니다.'
    setTimeout(redirectToLogin, 3000)
  }
})
</script>

<style scoped>
@keyframes scale-up {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-up {
  animation: scale-up 0.3s ease-out;
}
</style>
