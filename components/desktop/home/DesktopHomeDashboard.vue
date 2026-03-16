<template>
  <div class="max-w-4xl mx-auto px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-desktop-title text-zinc-900 dark:text-white mb-1">
        {{ greeting.text }}
      </h1>
      <p class="text-desktop-body text-zinc-500 dark:text-zinc-400">{{ greeting.sub }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" message="불러오는 중..." />
    </div>

    <template v-else>
      <!-- Current Reading (Solo) -->
      <section v-if="soloGroup" class="mb-8">
        <h2 class="section-header mb-4">내 서재</h2>
        <DesktopCurrentBookCard
          v-if="soloGroup.currentBook"
          :book="soloGroup.currentBook"
          :group-name="soloGroup.name"
          @click="router.push('/my-library')"
        />
        <div v-else class="apple-card p-6 text-center">
          <p class="text-desktop-body text-zinc-500">읽을 책을 추가해보세요</p>
          <button
            @click="router.push('/my-library')"
            class="mt-3 px-4 py-2 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 transition-colors text-desktop-callout"
          >
            서재로 이동
          </button>
        </div>
      </section>

      <!-- Social Groups - Reading -->
      <section v-if="readingGroups.length > 0" class="mb-8">
        <h2 class="section-header mb-4">함께 읽고 있어요</h2>
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
      <section v-if="idleGroups.length > 0" class="mb-8">
        <h2 class="section-header mb-4">잠시 쉬고 있어요</h2>
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
      <div v-if="!soloGroup && readingGroups.length === 0 && idleGroups.length === 0" class="text-center py-16">
        <div class="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-4xl">
          👋
        </div>
        <h3 class="text-desktop-headline text-zinc-900 dark:text-white mb-2">공유 그룹에 참여해보세요</h3>
        <p class="text-desktop-body text-zinc-500 mb-6">새로운 모임을 만들거나 초대를 받아보세요.</p>
        <div class="flex gap-3 justify-center">
          <button
            @click="$emit('create-group')"
            class="px-5 py-2.5 bg-lime-400 text-black font-semibold rounded-xl hover:bg-lime-300 transition-colors text-desktop-callout"
          >
            그룹 만들기
          </button>
          <button
            @click="$emit('join-group')"
            class="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-desktop-callout"
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
import { useUserStore } from '~/stores/user'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
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
