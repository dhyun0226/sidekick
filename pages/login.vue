<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#09090b] relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-lime-400/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-sm space-y-8 relative z-10">
      <!-- Logo & Title -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-600 mb-4 shadow-lg shadow-lime-400/20">
          <span class="text-3xl">📚</span>
        </div>
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Sidekick</h1>
        <p class="text-zinc-600 dark:text-zinc-400">함께 읽는 즐거움, 사이드킥</p>
      </div>

      <!-- Social Login Buttons -->
      <div class="space-y-3 pt-8">
        <button
          @click="signInWithGoogle"
          :disabled="loading"
          class="w-full py-4 px-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span v-if="loading">로그인 중...</span>
          <span v-else>구글로 시작하기</span>
        </button>
      </div>

      <!-- Info Message -->
      <div class="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-xl p-4 backdrop-blur-sm">
        <div class="flex gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">간편하고 안전한 소셜 로그인</p>
            <p class="text-xs text-zinc-600 dark:text-zinc-500">구글 계정으로 3초 만에 시작하세요. 별도의 비밀번호 관리가 필요 없습니다.</p>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="space-y-3 pt-4">
        <div class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div class="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <span>그룹과 함께 책 읽기</span>
        </div>
        <div class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div class="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <span>위치별 댓글 및 토론</span>
        </div>
        <div class="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div class="w-5 h-5 rounded-full bg-lime-400/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <span>스포일러 자동 방지</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-6 text-center text-xs text-zinc-600">
      <p>로그인하시면 <a href="#" class="text-zinc-600 dark:text-zinc-500 hover:text-lime-400 underline">서비스 이용약관</a> 및 <a href="#" class="text-zinc-600 dark:text-zinc-500 hover:text-lime-400 underline">개인정보처리방침</a>에 동의하게 됩니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const loading = ref(false)

// 이미 로그인된 사용자는 홈으로 리다이렉트
onMounted(async () => {
  const { data: { session } } = await client.auth.getSession()

  if (session) {
    router.push('/')
  }
})

const signInWithGoogle = async () => {
  loading.value = true

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      throw error
    }
    // OAuth 리다이렉트가 발생하므로 여기는 실행되지 않음
  } catch (e: any) {
    console.error('Google OAuth error:', e)

    let errorMessage = '로그인에 실패했습니다.'
    if (e.message.includes('popup')) {
      errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.'
    } else if (e.message.includes('network')) {
      errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
    }

    toast.error(errorMessage)
    loading.value = false
  }
}
</script>

<style scoped>
/* 애니메이션 추가 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.space-y-8 > * {
  animation: fadeInUp 0.6s ease-out backwards;
}

.space-y-8 > *:nth-child(1) {
  animation-delay: 0s;
}

.space-y-8 > *:nth-child(2) {
  animation-delay: 0.1s;
}

.space-y-8 > *:nth-child(3) {
  animation-delay: 0.2s;
}

.space-y-8 > *:nth-child(4) {
  animation-delay: 0.3s;
}
</style>
