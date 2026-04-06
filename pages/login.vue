<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-[#09090b] relative overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-[-30%] left-[-10%] w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[120px]"></div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex items-center justify-center p-6 relative z-10">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white mb-5 shadow-lg">
            <BookOpen :size="28" class="text-lime-400 dark:text-zinc-900" />
          </div>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">치어리더스</h1>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2">당신의 독서를 응원합니다</p>
        </div>

        <!-- Login Button -->
        <button
          @click="signInWithGoogle"
          :disabled="loading"
          class="w-full py-4 px-6 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span v-if="loading">로그인 중...</span>
          <span v-else>Google로 시작하기</span>
        </button>

        <!-- Features -->
        <div class="mt-8 space-y-3">
          <div v-for="feature in features" :key="feature" class="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <div class="w-1 h-1 rounded-full bg-lime-400 flex-shrink-0"></div>
            <span>{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="py-6 text-center text-[11px] text-zinc-400 dark:text-zinc-500 relative z-10">
      <p>
        로그인하시면
        <NuxtLink to="/terms" class="underline hover:text-lime-500 transition">서비스 이용약관</NuxtLink>
        및
        <NuxtLink to="/privacy" class="underline hover:text-lime-500 transition">개인정보처리방침</NuxtLink>에 동의하게 됩니다.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import { BookOpen } from 'lucide-vue-next'

useHead({ title: '로그인' })

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const loading = ref(false)

const features = ['함께 읽고 기록하는 소셜 독서', '위치별 코멘트와 토론', '독서 캘린더와 스트릭 추적']

onMounted(async () => {
  const { data: { user } } = await client.auth.getUser()
  if (user) router.replace('/')
})

const signInWithGoogle = async () => {
  loading.value = true
  try {
    const config = useRuntimeConfig()
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${config.public.baseUrl}/auth/callback` }
    })
    if (error) throw error
  } catch (error: any) {
    toast.error(error.message || '로그인 중 오류 발생')
    loading.value = false
  }
}
</script>
