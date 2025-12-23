<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between px-1">
      <h3 class="text-xs font-bold text-zinc-500 uppercase">독서 레이스</h3>
      <span class="text-[10px] text-zinc-400">{{ sortedMembersWithProgress.length }}명 참여 중</span>
    </div>

    <!-- Card -->
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-visible">
      <div class="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        <div v-for="member in sortedMembersWithProgress" :key="member.id" class="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-600">
              <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-zinc-400">
                <User :size="14" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-0.5">
                <span class="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                  {{ member.nickname }}
                  <span v-if="member.role === 'admin'" class="text-lime-600 bg-lime-100 dark:bg-lime-900 dark:text-lime-400 px-2 py-1 text-xs rounded ml-1 inline-flex items-center justify-center">
                    <Crown :size="10" />
                  </span>
                </span>
                <div class="flex items-center gap-2">
                  <!-- 완독한 경우: 완독 날짜 표시 / 진행 중: 퍼센트 표시 -->
                  <span class="text-xs font-bold" :class="member.isCompleted ? 'text-lime-500' : 'text-zinc-500 font-mono'">
                    <template v-if="member.isCompleted">
                      {{ member.finishedDate }} 완독
                    </template>
                    <template v-else>
                      {{ member.progress }}%
                    </template>
                  </span>

                  <!-- Admin Menu (관리자만 보임, 자기 자신 제외) -->
                  <div v-if="isAdmin && member.id !== currentUserId" class="relative">
                    <button
                      @click.stop="toggleMemberMenu(member.id)"
                      class="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    >
                      <MoreVertical :size="14" class="text-zinc-400" />
                    </button>

                    <!-- Backdrop (z-index를 먼저 렌더링) -->
                    <div
                      v-if="activeMemberMenu === member.id"
                      class="fixed inset-0 z-[100]"
                      @click="activeMemberMenu = null"
                    ></div>

                    <!-- Dropdown Menu -->
                    <div
                      v-if="activeMemberMenu === member.id"
                      class="absolute right-0 top-6 min-w-[160px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-[101] overflow-visible"
                    >
                      <button
                        @click="handleChangeRole(member)"
                        class="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                      >
                        <Shield :size="12" />
                        {{ member.role === 'admin' ? '멤버로 변경' : '관리자로 변경' }}
                      </button>
                      <button
                        @click="handleKickMember(member)"
                        class="w-full text-left px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-700/50 whitespace-nowrap"
                      >
                        <UserX :size="12" />
                        강퇴하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 활동 시간 -->
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1.5">
                <!-- 마지막 활동 시간 표시 -->
                <template v-if="member.timeAgo">
                  <span :class="member.inactive ? 'text-zinc-400' : ''">
                    {{ member.timeAgo }}
                    <span v-if="member.inactive">😴</span>
                  </span>
                </template>

                <!-- 활동 기록 없음 -->
                <template v-else>
                  <span class="text-zinc-400">활동 없음</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-lime-500 dark:bg-lime-400 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${member.progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, MoreVertical, Shield, UserX, Crown } from 'lucide-vue-next'

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
}

interface Props {
  sortedMembersWithProgress: MemberWithProgress[]
  isAdmin: boolean
  currentUserId: string | null
}

interface Emits {
  (e: 'changeMemberRole', member: MemberWithProgress): void
  (e: 'kickMember', member: MemberWithProgress): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const activeMemberMenu = ref<string | null>(null)

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
