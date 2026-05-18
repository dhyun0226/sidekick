<template>
  <div class="max-w-5xl mx-auto px-8 py-10">
    <div class="mb-8 flex items-start justify-between gap-6">
      <div class="min-w-0">
        <p class="text-desktop-caption text-zinc-400 dark:text-zinc-300 mb-2">v2.0 독서 워크스페이스</p>
        <h1 class="text-desktop-title font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight mb-2.5">
          {{ greeting.text }}
        </h1>
        <p class="text-desktop-body text-zinc-500 dark:text-zinc-300 font-light">{{ greeting.sub }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="$emit('join-group')"
          class="h-9 px-3 rounded-full text-desktop-caption font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          초대 코드
        </button>
        <button
          @click="router.push('/v2')"
          class="h-9 px-3 rounded-full text-desktop-caption font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          v2 허브
        </button>
        <button
          @click="$emit('create-group')"
          class="h-9 px-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-desktop-caption font-semibold hover:opacity-85 transition-opacity"
        >
          그룹 만들기
        </button>
        <NotificationCenter placement="sidebar" />
      </div>
    </div>

    <div v-if="loading">
      <GroupCardSkeleton :count="3" />
    </div>

    <template v-else>
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white">내 서재</h2>
            <p class="text-desktop-caption text-zinc-400 dark:text-zinc-300 mt-1">혼자 읽는 책과 개인 기록을 이어갑니다.</p>
          </div>
          <button
            @click="router.push('/my-library')"
            class="text-desktop-caption font-semibold text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            서재 열기
          </button>
        </div>

        <DesktopCurrentBookCard
          v-if="soloGroup?.currentBook"
          :book="soloGroup.currentBook"
          :group-name="soloGroup.name"
          @click="router.push('/my-library')"
        />
        <div
          v-else
          class="rounded-2xl bg-white dark:bg-zinc-900 p-7 ring-1 ring-black/[0.04] dark:ring-white/[0.06] flex items-center justify-between gap-6"
        >
          <div>
            <h3 class="text-desktop-body font-semibold text-zinc-900 dark:text-white mb-1">읽는 중인 책이 없어요</h3>
            <p class="text-desktop-callout text-zinc-500 dark:text-zinc-400">내 서재에서 책을 추가하고 첫 기록을 남겨보세요.</p>
          </div>
          <button
            @click="router.push('/my-library')"
            class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-85 transition-opacity text-desktop-callout"
          >
            책 추가하기
          </button>
        </div>
      </section>

      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white">함께 읽는 그룹</h2>
            <p class="text-desktop-caption text-zinc-400 dark:text-zinc-300 mt-1">진행 중인 모임과 다음 책을 기다리는 모임을 구분합니다.</p>
          </div>
        </div>

        <div v-if="readingGroups.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <DesktopGroupCard
            v-for="group in readingGroups"
            :key="group.id"
            :group="group"
            @click="router.push(`/group/${group.id}`)"
          />
        </div>

        <div v-if="idleGroups.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DesktopGroupCard
            v-for="group in idleGroups"
            :key="group.id"
            :group="group"
            @click="router.push(`/group/${group.id}`)"
          />
        </div>

        <div
          v-if="readingGroups.length === 0 && idleGroups.length === 0"
          class="text-center py-16 rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        >
          <div class="w-14 h-14 mx-auto mb-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center">
            <UsersIcon :size="22" class="text-zinc-400 dark:text-zinc-300" />
          </div>
          <h3 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">참여 중인 공유 그룹이 없어요</h3>
          <p class="text-desktop-callout text-zinc-500 dark:text-zinc-400 font-light mb-7">새 그룹을 만들거나 받은 초대 코드로 입장하세요.</p>
          <div class="flex gap-3 justify-center">
            <button
              @click="$emit('create-group')"
              class="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-85 transition-opacity text-desktop-callout"
            >
              그룹 만들기
            </button>
            <button
              @click="$emit('join-group')"
              class="px-5 py-2.5 text-zinc-600 dark:text-zinc-300 font-semibold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-desktop-callout"
            >
              초대 코드 입력
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users as UsersIcon } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'
import DesktopCurrentBookCard from './DesktopCurrentBookCard.vue'
import DesktopGroupCard from './DesktopGroupCard.vue'
import GroupCardSkeleton from '~/components/skeleton/GroupCardSkeleton.vue'

const router = useRouter()
const userStore = useUserStore()

defineProps<{
  loading: boolean
  soloGroup: any
  readingGroups: any[]
  idleGroups: any[]
}>()

defineEmits(['create-group', 'join-group', 'open-inquiry'])

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = userStore.profile?.nickname || '독자'
  if (hour < 6) return { text: `조용한 밤이에요, ${name}님`, sub: '읽던 곳으로 돌아가거나 오늘의 기록을 정리해보세요.' }
  if (hour < 12) return { text: `좋은 아침이에요, ${name}님`, sub: '내 서재와 함께 읽는 그룹의 진행 상황을 확인해보세요.' }
  if (hour < 18) return { text: `안녕하세요, ${name}님`, sub: '지금 읽는 책과 그룹 활동을 한눈에 이어갑니다.' }
  return { text: `좋은 저녁이에요, ${name}님`, sub: '오늘 읽은 내용을 기록하고 모임의 흐름을 확인해보세요.' }
})
</script>
