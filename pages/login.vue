<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[#09090b] relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-lime-400/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-sm space-y-8 relative z-10">
      <!-- Logo & Title -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-600 mb-4 shadow-lg shadow-lime-400/20">
          <span class="text-3xl">📚</span>
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Sidekick</h1>
        <p class="text-zinc-400">함께 읽는 즐거움, 사이드킥</p>
      </div>

      <!-- Social Login Buttons -->
      <div class="space-y-3 pt-8">
        <button 
          @click="signInWithOAuth('kakao')"
          class="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] rounded-xl font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
        >
          <MessageCircle :size="20" class="fill-current" />
          카카오로 시작하기
        </button>
        
        <button 
          @click="signInWithOAuth('google')"
          class="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          구글로 시작하기
        </button>
      </div>

      <!-- Divider -->
      <div class="relative py-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-zinc-800"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-[#09090b] px-2 text-zinc-500">또는 이메일로 계속하기</span>
        </div>
      </div>

      <!-- Email Login Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="isSignUp" class="animate-fade-in">
          <input 
            v-model="nickname" 
            type="text" 
            placeholder="닉네임" 
            class="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors placeholder-zinc-500"
            required
          />
        </div>
        <div>
          <input 
            v-model="email" 
            type="email" 
            placeholder="이메일 주소" 
            class="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors placeholder-zinc-500"
            required
          />
        </div>
        <div>
          <input 
            v-model="password" 
            type="password" 
            placeholder="비밀번호" 
            class="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors placeholder-zinc-500"
            required
          />
        </div>
        <button 
          type="submit"
          class="w-full py-3.5 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors border border-zinc-700"
          :disabled="loading"
        >
          {{ loading ? '처리 중...' : (isSignUp ? '회원가입' : '이메일로 로그인') }}
        </button>
      </form>

      <p class="text-center text-xs text-zinc-500">
        {{ isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?' }} 
        <button @click="isSignUp = !isSignUp" class="text-lime-400 hover:underline">
          {{ isSignUp ? '로그인' : '회원가입' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const nickname = ref('')
const loading = ref(false)

const signInWithOAuth = async (provider: 'google' | 'kakao') => {
  try {
    await userStore.signInWithOAuth(provider)
  } catch (e: any) {
    alert(e.message)
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    if (isSignUp.value) {
      if (!nickname.value) throw new Error('닉네임을 입력해주세요.')
      await userStore.signUp(email.value, password.value, nickname.value)
      alert('회원가입 확인 메일을 보냈습니다. 이메일을 확인해주세요!')
    } else {
      await userStore.signIn(email.value, password.value)
    }
  } catch (e: any) {
    alert(e.message)
  } finally {
    loading.value = false
  }
}
</script>
