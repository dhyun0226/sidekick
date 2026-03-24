<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h4 class="text-desktop-micro text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-medium">멤버 ({{ members.length }})</h4>
      <button
        @click="showSearch = !showSearch; if (!showSearch) searchQuery = ''"
        class="p-1 rounded-lg transition-colors"
        :class="showSearch ? 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-400'"
      >
        <Search :size="13" />
      </button>
    </div>
    <div v-if="showSearch" class="mt-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="멤버 검색"
        class="desktop-input w-full py-1.5 px-3 text-desktop-caption"
      />
    </div>

    <div class="space-y-0.5">
      <div
        v-for="(member, index) in filteredMembers"
        :key="member.id"
        class="group relative flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
        :class="{ 'opacity-60': member.inactive }"
      >
        <!-- Rank -->
        <div class="w-5 text-center flex-shrink-0 tabular-nums">
          <span v-if="index === 0 && members.length > 1" class="text-desktop-caption font-bold text-zinc-900 dark:text-white">1</span>
          <span v-else-if="index === 1 && members.length > 2" class="text-desktop-caption font-semibold text-zinc-600 dark:text-zinc-300">2</span>
          <span v-else-if="index === 2 && members.length > 3" class="text-desktop-caption font-semibold text-zinc-600 dark:text-zinc-300">3</span>
          <span v-else class="text-desktop-caption text-zinc-400">{{ index + 1 }}</span>
        </div>

        <!-- Avatar -->
        <div class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
          <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-desktop-caption font-medium">
            {{ (member.nickname || 'U')[0] }}
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="text-desktop-caption font-medium text-zinc-900 dark:text-white truncate max-w-[100px]">{{ member.nickname }}</span>
              <span v-if="member.id === currentUserId" class="text-desktop-footnote text-zinc-400 dark:text-zinc-500 font-normal flex-shrink-0">나</span>
              <span v-if="member.role === 'admin'" class="text-desktop-footnote text-zinc-400 dark:text-zinc-500 font-normal flex-shrink-0">관리자</span>
            </div>
            <span v-if="member.isCompleted && member.finishedDate" class="text-desktop-footnote text-zinc-400 dark:text-zinc-500 flex-shrink-0">{{ member.finishedDate }}</span>
            <span v-else-if="member.timeAgo" class="text-desktop-footnote text-zinc-400 dark:text-zinc-500 flex-shrink-0">{{ member.timeAgo }}</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="member.isCompleted ? 'bg-lime-400' : index === 0 ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-600'"
                :style="{ width: `${member.progress}%` }"
              ></div>
            </div>
            <span class="text-desktop-caption tabular-nums w-8 text-right" :class="member.isCompleted ? 'text-lime-600 dark:text-lime-400 font-semibold' : 'text-zinc-400'">
              {{ Math.round(member.progress) }}%
            </span>
          </div>
        </div>

        <!-- Completed badge -->
        <div v-if="member.isCompleted" class="flex-shrink-0">
          <Check :size="14" class="text-lime-500" />
        </div>

        <!-- Admin actions menu -->
        <div v-else-if="isAdmin && member.id !== currentUserId" class="relative flex-shrink-0">
          <button
            @click.stop="toggleMenu(member.id)"
            class="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-all"
          >
            <MoreHorizontal :size="14" />
          </button>
          <div
            v-if="openMenuId === member.id"
            class="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 rounded-lg shadow-apple ring-1 ring-black/[0.04] dark:ring-white/[0.06] py-1 z-10"
          >
            <button
              @click="handleChangeRole(member)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {{ member.role === 'admin' ? '관리자 해제' : '관리자 지정' }}
            </button>
            <button
              @click="handleKick(member)"
              class="w-full px-3 py-2 text-left text-desktop-caption text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              추방
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Group summary -->
    <div v-if="members.length > 1" class="pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/50">
      <div class="flex items-center justify-between text-desktop-caption text-zinc-400">
        <span>평균 진행률</span>
        <span class="tabular-nums text-zinc-500 dark:text-zinc-400">{{ avgProgress }}%</span>
      </div>
      <div v-if="completedCount > 0" class="flex items-center justify-between text-desktop-caption text-zinc-400 mt-1.5">
        <span>완독</span>
        <span class="tabular-nums text-zinc-500 dark:text-zinc-400">{{ completedCount }}/{{ members.length }}명</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MoreHorizontal, Check, Search } from 'lucide-vue-next'
import type { MemberWithProgress } from '~/types'

const props = defineProps<{
  members: MemberWithProgress[]
  isAdmin?: boolean
  currentUserId?: string
}>()

const emit = defineEmits(['change-role', 'kick'])

const openMenuId = ref<string | null>(null)
const showSearch = ref(false)
const searchQuery = ref('')

const sortedMembers = computed(() => {
  return [...props.members].sort((a, b) => b.progress - a.progress)
})

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) return sortedMembers.value
  const q = searchQuery.value.trim().toLowerCase()
  return sortedMembers.value.filter(m => m.nickname?.toLowerCase().includes(q))
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
