<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between px-1 h-4" :class="showSearch ? 'mb-2' : 'mb-3'">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">독서 레이스</h3>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[11px] text-zinc-400 dark:text-zinc-300 leading-none">총 {{ filteredMembers.length }}명</span>
        <!-- Search Toggle -->
        <button
          @click="showSearch = !showSearch"
          class="hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors text-zinc-400 dark:text-zinc-300 leading-none"
          :class="{ 'text-lime-500': showSearch || searchQuery }"
          title="멤버 검색"
        >
          <Search :size="12" class="block" />
        </button>
      </div>
    </div>

    <!-- Search Input (Expandable) -->
    <div v-if="showSearch" class="px-1 mb-3 animate-fade-in">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="닉네임으로 검색..."
        class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 border-none"
        autofocus
      />
    </div>

    <!-- Empty State (no members at all) -->
    <div v-if="sortedMembersWithProgress.length === 0" class="text-center py-8">
      <Users :size="28" class="text-zinc-300 dark:text-zinc-500 mx-auto mb-2" />
      <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">아직 멤버가 없어요</p>
    </div>

    <!-- Members List -->
    <div v-else-if="filteredMembers.length > 0" class="space-y-0.5">
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        class="relative flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors group"
        :class="{ 'z-20': activeMemberMenu === member.id }"
      >
        <!-- Avatar -->
        <div class="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-300">
            <User :size="16" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1 mb-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-[13px] font-semibold text-zinc-900 dark:text-white truncate max-w-[100px]">{{ member.nickname }}</span>
              <Crown v-if="member.role === 'admin'" :size="11" class="text-amber-500 flex-shrink-0" />
              <LockKeyhole v-if="member.subscription_tier === 'free'" :size="11" class="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <span v-if="member.isCompleted && member.finishedDate" class="text-[11px] text-zinc-400 dark:text-zinc-300 flex-shrink-0">· {{ member.finishedDate }}</span>
              <span v-else-if="member.timeAgo" class="text-[11px] text-zinc-400 dark:text-zinc-300 flex-shrink-0" :title="member.timeAgo">· {{ shortTimeAgo(member.timeAgo) }}</span>
            </div>
            <!-- Menu: 닉네임 줄 우측 -->
            <DropdownMenu
              v-if="isAdmin && member.id !== currentUserId && !isArchived"
              :is-open="activeMemberMenu === member.id"
              :icon-size="14"
              @toggle="toggleMemberMenu(member.id)"
              @close="activeMemberMenu = null"
            >
              <template #icon><MoreHorizontal :size="14" class="text-zinc-400" /></template>
              <button
                @click="handleChangeRole(member)"
                class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-bold"
              >
                <Shield :size="12" />
                {{ member.role === 'admin' ? '멤버로 변경' : '그룹장으로 변경' }}
              </button>
              <button
                @click="handleKickMember(member)"
                class="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700/50 whitespace-nowrap font-bold"
              >
                <UserX :size="12" />
                내보내기
              </button>
            </DropdownMenu>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-lime-500 dark:bg-lime-400 rounded-full transition-all duration-700 ease-out"
                :style="{ width: `${member.progress}%` }"
              ></div>
            </div>
            <span class="text-[11px] font-bold w-8 text-right" :class="member.isCompleted ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500 dark:text-zinc-400'">
              {{ member.isCompleted ? '완독' : `${Math.round(member.progress)}%` }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="sortedMembersWithProgress.length > 1" class="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/50">
      <div class="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-300">
        <span>평균 진행률</span>
        <span class="tabular-nums text-zinc-500 dark:text-zinc-300">{{ avgProgress }}%</span>
      </div>
      <div v-if="completedCount > 0" class="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-300 mt-1.5">
        <span>완독</span>
        <span class="tabular-nums text-zinc-500 dark:text-zinc-300">{{ completedCount }}/{{ sortedMembersWithProgress.length }}명</span>
      </div>
    </div>

    <!-- Empty Search State -->
    <div v-else class="text-center py-12 text-xs text-zinc-400 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-dashed ring-black/[0.04] dark:ring-white/[0.06]">
      <Search :size="28" class="text-zinc-300 dark:text-zinc-500 mx-auto mb-3" />
      <p>검색 결과와 일치하는 멤버가 없습니다</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { User, Shield, UserX, Crown, Users, Clock, MoreHorizontal, Search, LockKeyhole } from 'lucide-vue-next'

// 긴 시간 문자열에서 괄호 부분 제거 (예: "3일 전 (26.04.03 14:30)" → "3일 전")
const shortTimeAgo = (timeAgo: string | null | undefined) => {
  if (!timeAgo) return ''
  return timeAgo.replace(/\s*\(.*\)$/, '')
}
import DropdownMenu from '~/components/DropdownMenu.vue'

interface MemberWithProgress {
  id: string
  nickname: string
  avatar_url?: string
  role: 'admin' | 'member'
  progress: number
  timeAgo?: string | null
  inactive?: boolean
  finishedAt?: string | null
  finishedDate?: string | null
  isCompleted?: boolean
  subscription_tier?: 'free' | 'premium' | 'admin'
}

interface Props {
  sortedMembersWithProgress: MemberWithProgress[]
  isAdmin: boolean
  isArchived: boolean
  currentUserId: string | null
}

interface Emits {
  (e: 'changeMemberRole', member: MemberWithProgress): void
  (e: 'kickMember', member: MemberWithProgress): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeMemberMenu = ref<string | null>(null)
const showSearch = ref(false)
const searchQuery = ref('')

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return props.sortedMembersWithProgress
  const query = searchQuery.value.toLowerCase().trim()
  return props.sortedMembersWithProgress.filter(member => 
    member.nickname.toLowerCase().includes(query)
  )
})

const avgProgress = computed(() => {
  if (!props.sortedMembersWithProgress.length) return 0
  const sum = props.sortedMembersWithProgress.reduce((s, m) => s + m.progress, 0)
  return Math.round(sum / props.sortedMembersWithProgress.length)
})

const completedCount = computed(() => {
  return props.sortedMembersWithProgress.filter(m => m.isCompleted).length
})

const toggleMemberMenu = (memberId: string) => {
  activeMemberMenu.value = activeMemberMenu.value === memberId ? null : memberId
}

const handleChangeRole = (member: MemberWithProgress) => {
  activeMemberMenu.value = null
  emit('changeMemberRole', member)
}

const handleKickMember = (member: MemberWithProgress) => {
  activeMemberMenu.value = null
  emit('kickMember', member)
}
</script>

<style scoped>
@keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.2s ease-out; }
</style>
