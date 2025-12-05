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
        <div class="relative group cursor-pointer">
          <div class="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 group-hover:border-lime-400 transition-colors">
            <img v-if="userStore.profile?.avatar_url" :src="userStore.profile.avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-zinc-500">
              <User :size="40" />
            </div>
          </div>
          <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera :size="24" class="text-white" />
          </div>
        </div>
        <p class="text-xs text-zinc-500">프로필 사진 변경</p>
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

const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()

const nickname = ref('')
const loading = ref(false)
const totalBooks = ref(0)
const totalGroups = ref(0)

const fetchStats = async () => {
  if (!userStore.user) return

  // 1. Total Books (Reviews count)
  const { count: reviewCount } = await client
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userStore.user.id)
  
  totalBooks.value = reviewCount || 0

  // 2. Total Groups
  const { count: groupCount } = await client
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userStore.user.id)
  
  totalGroups.value = groupCount || 0
}

onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.profile) {
    nickname.value = userStore.profile.nickname || ''
  }
  await fetchStats()
})

const saveProfile = async () => {
  if (!userStore.user) return
  loading.value = true
  
  const { error } = await client
    .from('users')
    .update({ nickname: nickname.value })
    .eq('id', userStore.user.id)

  loading.value = false
  
  if (error) {
    alert('프로필 저장 실패: ' + error.message)
  } else {
    alert('프로필이 저장되었습니다.')
    await userStore.fetchProfile() // Refresh store
  }
}

const handleSignOut = async () => {
  if (confirm('정말 로그아웃 하시겠습니까?')) {
    await userStore.signOut()
  }
}
</script>
