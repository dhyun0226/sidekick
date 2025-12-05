<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[#09090b] relative overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-lime-400/10 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-sm space-y-8 relative z-10 text-center">
      <div v-if="loading" class="text-zinc-500">
        초대 정보를 불러오는 중...
      </div>

      <div v-else-if="error" class="text-red-400">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 shadow-xl">
          <span class="text-4xl">📚</span>
        </div>
        
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">{{ group?.name }}</h1>
          <p class="text-zinc-400">그룹에 초대되셨습니다!</p>
        </div>

        <div class="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
          <div class="flex items-center justify-center gap-2 text-sm text-zinc-300">
            <Users :size="16" />
            <span>멤버 {{ group?.members_count || 0 }}명</span>
          </div>
        </div>

        <button 
          @click="joinGroup"
          class="w-full py-4 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20"
          :disabled="joining"
        >
          {{ joining ? '참여 중...' : '그룹 참여하기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Users } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const code = route.params.code as string

const loading = ref(true)
const joining = ref(false)
const error = ref('')
const group = ref<any>(null)

// Mock Data for MVP
const mockGroups = {
  'ABC1234': { id: '1', name: '판교 직장인 독서클럽', members_count: 5 },
  'XYZ9876': { id: '2', name: '커플 교환일기', members_count: 2 }
}

onMounted(async () => {
  // Simulate API fetch
  setTimeout(() => {
    // In real app: const { data } = await supabase.from('groups').select('*').eq('invite_code', code).single()
    const found = mockGroups[code as keyof typeof mockGroups]
    
    if (found) {
      group.value = found
    } else {
      error.value = '유효하지 않은 초대 코드입니다.'
    }
    loading.value = false
  }, 500)
})

const joinGroup = async () => {
  joining.value = true
  // Simulate API join
  setTimeout(() => {
    // In real app: await supabase.from('group_members').insert({ group_id: group.value.id, user_id: user.id })
    joining.value = false
    router.push(`/group/${group.value.id}`)
  }, 1000)
}
</script>
