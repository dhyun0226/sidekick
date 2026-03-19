<template>
  <div class="max-w-4xl mx-auto px-8 py-12">
    <!-- Header -->
    <div class="mb-14">
      <h1 class="text-desktop-title font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight mb-2.5">
        {{ greeting.text }}
      </h1>
      <p class="text-desktop-body text-zinc-400 dark:text-zinc-500 font-light">{{ greeting.sub }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading">
      <SkeletonGroupCard :count="3" />
    </div>

    <template v-else>
      <!-- Current Reading (Solo) -->
      <section v-if="soloGroup" class="mb-10">
        <h2 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white mb-5">내 서재</h2>
        <DesktopCurrentBookCard
          v-if="soloGroup.currentBook"
          :book="soloGroup.currentBook"
          :group-name="soloGroup.name"
          @click="router.push('/my-library')"
        />
        <div v-else class="py-10 text-center">
          <p class="text-desktop-body text-zinc-400 dark:text-zinc-500 mb-5">읽을 책을 추가해보세요</p>
          <button
            @click="router.push('/my-library')"
            class="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-full hover:opacity-80 transition-opacity duration-200 ease-apple text-desktop-callout"
          >
            서재로 이동
          </button>
        </div>
      </section>

      <!-- Social Groups - Reading -->
      <section v-if="readingGroups.length > 0" class="mb-10">
        <h2 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white mb-5">함께 읽고 있어요</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DesktopGroupCard
            v-for="group in readingGroups"
            :key="group.id"
            :group="group"
            @click="router.push(`/group/${group.id}`)"
          />
        </div>
      </section>

      <!-- Social Groups - Idle -->
      <section v-if="idleGroups.length > 0" class="mb-10">
        <h2 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white mb-5">잠시 쉬고 있어요</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DesktopGroupCard
            v-for="group in idleGroups"
            :key="group.id"
            :group="group"
            @click="router.push(`/group/${group.id}`)"
          />
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="!soloGroup && readingGroups.length === 0 && idleGroups.length === 0" class="text-center py-24">
        <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center">
          <UsersIcon :size="24" class="text-zinc-300 dark:text-zinc-600" />
        </div>
        <h3 class="text-desktop-body font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">공유 그룹에 참여해보세요</h3>
        <p class="text-desktop-callout text-zinc-400 dark:text-zinc-500 font-light mb-8">새로운 모임을 만들거나 초대를 받아보세요.</p>
        <div class="flex gap-3 justify-center">
          <button
            @click="$emit('create-group')"
            class="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-full hover:opacity-80 transition-opacity duration-200 ease-apple text-desktop-callout"
          >
            그룹 만들기
          </button>
          <button
            @click="$emit('join-group')"
            class="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 font-medium rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 ease-apple text-desktop-callout"
          >
            초대 코드 입력
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users as UsersIcon } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'
import DesktopCurrentBookCard from './DesktopCurrentBookCard.vue'
import DesktopGroupCard from './DesktopGroupCard.vue'

const router = useRouter()
const userStore = useUserStore()

defineProps<{
  loading: boolean
  soloGroup: any
  readingGroups: any[]
  idleGroups: any[]
}>()

defineEmits(['create-group', 'join-group'])

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = userStore.profile?.nickname || ''
  if (hour < 6) return { text: `늦은 밤이에요, ${name}님`, sub: '조용한 밤, 독서하기 좋은 시간이죠.' }
  if (hour < 12) return { text: `좋은 아침이에요, ${name}님`, sub: '오늘도 한 페이지 시작해볼까요?' }
  if (hour < 18) return { text: `안녕하세요, ${name}님`, sub: '오후의 여유를 독서와 함께.' }
  return { text: `좋은 저녁이에요, ${name}님`, sub: '하루 마무리를 책과 함께 해보세요.' }
})
</script>
