<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-desktop-caption text-zinc-500 uppercase tracking-wider">멤버 ({{ members.length }})</h4>
      <!-- Leader badge -->
      <span v-if="leader" class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
        <Crown :size="10" />
        {{ leader.nickname }} 선두
      </span>
    </div>

    <div class="space-y-1.5">
      <div
        v-for="(member, index) in sortedMembers"
        :key="member.id"
        class="group relative flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        :class="[
          member.isCompleted ? 'bg-lime-50/50 dark:bg-lime-900/10' : '',
          member.id === currentUserId ? 'ring-1 ring-lime-200/50 dark:ring-lime-800/30' : ''
        ]"
      >
        <!-- Rank -->
        <div class="w-5 text-center flex-shrink-0">
          <span v-if="index === 0 && members.length > 1" class="text-sm">🥇</span>
          <span v-else-if="index === 1 && members.length > 2" class="text-sm">🥈</span>
          <span v-else-if="index === 2 && members.length > 3" class="text-sm">🥉</span>
          <span v-else class="text-[10px] text-zinc-400 font-semibold">{{ index + 1 }}</span>
        </div>

        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-zinc-900 shadow-sm">
          <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-white text-desktop-caption font-bold">
            {{ (member.nickname || 'U')[0] }}
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-desktop-caption font-semibold text-zinc-900 dark:text-white truncate">{{ member.nickname }}</span>
            <span v-if="member.id === currentUserId" class="text-[10px] px-1 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-full font-semibold">나</span>
            <span v-if="member.role === 'admin'" class="text-[10px] px-1 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-semibold">관리자</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="member.isCompleted ? 'bg-lime-500' : index === 0 ? 'bg-lime-500' : 'bg-zinc-400'"
                :style="{ width: `${member.progress}%` }"
              ></div>
            </div>
            <span class="text-[11px] font-bold tabular-nums w-8 text-right" :class="member.isCompleted ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500'">
              {{ Math.round(member.progress) }}%
            </span>
          </div>
        </div>

        <!-- Completed badge -->
        <div v-if="member.isCompleted" class="flex-shrink-0">
          <span class="text-sm" title="완독!">🎉</span>
        </div>

        <!-- Admin actions menu -->
        <div v-else-if="isAdmin && member.id !== currentUserId" class="relative flex-shrink-0">
          <button
            @click.stop="toggleMenu(member.id)"
            class="p-1 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <MoreHorizontal :size="14" />
          </button>
          <div
            v-if="openMenuId === member.id"
            class="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 rounded-xl shadow-apple-lg border border-zinc-200 dark:border-zinc-700 py-1 z-10"
          >
            <button
              @click="handleChangeRole(member)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {{ member.role === 'admin' ? '관리자 해제' : '관리자 지정' }}
            </button>
            <button
              @click="handleKick(member)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              추방
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Group summary -->
    <div v-if="members.length > 1" class="pt-3 border-t border-zinc-100 dark:border-zinc-800">
      <div class="flex items-center justify-between text-desktop-caption text-zinc-400">
        <span>평균 진행률</span>
        <span class="font-semibold text-zinc-600 dark:text-zinc-300">{{ avgProgress }}%</span>
      </div>
      <div v-if="completedCount > 0" class="flex items-center justify-between text-desktop-caption text-zinc-400 mt-1">
        <span>완독</span>
        <span class="font-semibold text-lime-600 dark:text-lime-400">{{ completedCount }}/{{ members.length }}명</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MoreHorizontal, Crown } from 'lucide-vue-next'
import type { MemberWithProgress } from '~/types'

const props = defineProps<{
  members: MemberWithProgress[]
  isAdmin?: boolean
  currentUserId?: string
}>()

const emit = defineEmits(['change-role', 'kick'])

const openMenuId = ref<string | null>(null)

const sortedMembers = computed(() => {
  return [...props.members].sort((a, b) => b.progress - a.progress)
})

const leader = computed(() => {
  if (props.members.length < 2) return null
  const sorted = sortedMembers.value
  if (sorted[0]?.progress > sorted[1]?.progress && !sorted[0]?.isCompleted) {
    return sorted[0]
  }
  return null
})

const avgProgress = computed(() => {
  if (!props.members.length) return 0
  const sum = props.members.reduce((s, m) => s + m.progress, 0)
  return Math.round(sum / props.members.length)
})

const completedCount = computed(() => {
  return props.members.filter(m => m.isCompleted).length
})

const toggleMenu = (memberId: string) => {
  openMenuId.value = openMenuId.value === memberId ? null : memberId
}

const handleChangeRole = (member: MemberWithProgress) => {
  openMenuId.value = null
  emit('change-role', member)
}

const handleKick = (member: MemberWithProgress) => {
  openMenuId.value = null
  emit('kick', member)
}

const closeMenu = (e: MouseEvent) => {
  openMenuId.value = null
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>
