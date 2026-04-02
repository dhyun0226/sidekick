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

    <!-- Members List (Slim Style) -->
    <div v-else-if="filteredMembers.length > 0" class="space-y-1.5">
      <div 
        v-for="member in filteredMembers" 
        :key="member.id" 
        class="relative bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-2.5 shadow-apple transition-all group hover:ring-lime-200 dark:hover:ring-lime-900/50 active:scale-[0.99] flex items-center gap-3"
        :class="{ 'z-20 ring-lime-300 dark:ring-lime-700': activeMemberMenu === member.id }"
      >
        <!-- Avatar Section -->
        <div class="relative flex-shrink-0">
          <div class="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-300">
              <User :size="16" />
            </div>
          </div>
          <!-- Status Dot -->
          <div 
            class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center"
            :class="member.inactive ? 'bg-zinc-300 dark:bg-zinc-600' : 'bg-lime-500'"
          >
            <span v-if="member.inactive" class="text-[5px] text-zinc-500 dark:text-zinc-400">z</span>
          </div>
        </div>

        <!-- Info Section (Main) -->
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-1.5 mb-1.5 whitespace-nowrap overflow-hidden leading-none h-4">
            <span class="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[100px] leading-none">
              {{ member.nickname }}
            </span>
            
            <template v-if="member.timeAgo">
              <span class="text-[11px] text-zinc-300 dark:text-zinc-500 font-bold leading-none relative -translate-y-[0.5px] ml-0.5">·</span>
              <span class="text-[11px] text-zinc-400 dark:text-zinc-400 font-medium leading-none">{{ member.timeAgo }}</span>
            </template>

            <template v-if="member.id === currentUserId">
              <span class="text-[11px] text-zinc-300 dark:text-zinc-500 font-bold leading-none relative -translate-y-[0.5px] ml-0.5">·</span>
              <Badge variant="lime" size="sm" class="!px-1 !py-0 !text-[9px] !h-3.5 relative -translate-y-[0.5px]">나</Badge>
            </template>

            <template v-if="member.role === 'admin'">
              <span class="text-[11px] text-zinc-300 dark:text-zinc-500 font-bold leading-none relative -translate-y-[0.5px] ml-0.5">·</span>
              <Badge variant="purple" size="sm" class="!px-1 !py-0 !text-[9px] !h-3.5 relative -translate-y-[0.5px]">그룹장</Badge>
            </template>

            <!-- Free user badge (read-only in social groups) -->
            <template v-if="member.subscription_tier === 'free'">
              <span class="text-[11px] text-zinc-300 dark:text-zinc-500 font-bold leading-none relative -translate-y-[0.5px] ml-0.5">·</span>
              <Badge variant="zinc" size="sm" class="!px-1 !py-0 !text-[9px] !h-3.5 relative -translate-y-[0.5px]">읽기전용</Badge>
            </template>
          </div>
          
          <!-- Slim Progress Bar -->
          <div class="flex items-center gap-2 pr-10">
            <div class="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-lime-500 dark:bg-lime-400 rounded-full transition-all duration-700 ease-out"
                :style="{ width: `${member.progress}%` }"
              ></div>
            </div>
            <span class="text-[11px] font-black w-8 text-right" :class="member.isCompleted ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500 dark:text-zinc-400'">
              {{ member.isCompleted ? '완독' : `${member.progress}%` }}
            </span>
          </div>
        </div>

        <!-- Right Section: Menu (Common Component) -->
        <div v-if="isAdmin && member.id !== currentUserId && !isArchived" class="absolute right-2 top-1/2 -translate-y-1/2">
          <DropdownMenu
            :is-open="activeMemberMenu === member.id"
            @toggle="toggleMemberMenu(member.id)"
            @close="activeMemberMenu = null"
          >
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
import { User, Shield, UserX, Crown, Users, Clock, MoreVertical, Search } from 'lucide-vue-next'
import Badge from '~/components/Badge.vue'
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
