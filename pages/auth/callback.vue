<template>
  <div class="min-h-screen flex items-center justify-center bg-[#09090b]">
    <div class="text-center space-y-4">
      <!-- Loading Spinner -->
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-400/20 animate-pulse">
        <div class="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-bold text-white">로그인 중입니다...</h2>
        <p class="text-sm text-zinc-400">잠시만 기다려주세요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()

onMounted(async () => {
  try {
    // 1. Supabase가 OAuth 콜백을 자동으로 처리
    // URL에서 토큰을 추출하고 세션 설정 (자동)

    // 2. 현재 사용자 확인
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      alert('로그인에 실패했습니다. 다시 시도해주세요.')
      router.push('/login')
      return
    }

    // 3. users 테이블에서 프로필 조회
    const { data: profile, error: profileError } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle() // single()은 없으면 에러, maybeSingle()은 null 반환

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    // 4. 프로필이 없거나 닉네임이 설정되지 않았으면 → 온보딩 페이지
    if (!profile || !profile.nickname) {
      console.log('New user or incomplete profile, redirecting to onboarding')
      router.push('/onboarding')
      return
    }

    // 5. 프로필이 완성된 기존 사용자 → 홈으로
    console.log('Existing user with complete profile, redirecting to home')
    userStore.profile = profile
    router.push('/')

  } catch (error) {
    console.error('Unexpected error in callback:', error)
    alert('예상치 못한 오류가 발생했습니다.')
    router.push('/login')
  }
})
</script>
