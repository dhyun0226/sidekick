<template>
  <main class="min-h-[100dvh] bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-[#09090b] dark:text-white sm:px-8 sm:py-10">
    <div class="mx-auto grid min-h-[calc(100dvh-48px)] w-full max-w-5xl place-items-center">
      <section v-if="pending" class="text-center">
        <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
        <p class="text-sm font-bold text-zinc-500">공유 카드를 불러오는 중입니다.</p>
      </section>

      <section v-else-if="error || !data" class="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06]">
        <h1 class="text-xl font-black">공유 카드를 찾을 수 없습니다</h1>
        <p class="mt-2 text-sm font-semibold leading-6 text-zinc-500 dark:text-zinc-400">
          링크가 만료되었거나 아직 공유되지 않은 독서 세션입니다.
        </p>
        <NuxtLink to="/" class="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-black text-white dark:bg-white dark:text-zinc-950">
          치어리더스 열기
        </NuxtLink>
      </section>

      <section v-else class="grid w-full gap-5 lg:grid-cols-[1fr_360px]">
        <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-7">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-black text-zinc-400">SIDEKICK SHARE</p>
              <h1 class="mt-1 text-2xl font-black tracking-tight sm:text-4xl">오늘의 독서 카드</h1>
              <p class="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {{ readerName }}님이 캐릭터와 함께 읽은 기록입니다.
              </p>
            </div>
            <CompanionMascot :code="session.companion_code" state="celebrate" class="hidden w-28 sm:block" />
          </div>

          <ReadingShareCard
            :title="bookTitle"
            :author="bookAuthor"
            :group-name="groupName"
            :companion-code="session.companion_code"
            :duration-seconds="session.duration_seconds"
            :progress="session.end_progress"
            :pages-read="session.pages_read"
            :quote="session.share_quote"
            eyebrow="Shared Reading Session"
          />

          <div class="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              class="h-11 rounded-full bg-zinc-100 px-4 text-sm font-black text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              @click="copyCurrentUrl"
            >
              링크 복사
            </button>
            <button
              type="button"
              class="h-11 rounded-full bg-zinc-100 px-4 text-sm font-black text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              @click="downloadShareImage"
            >
              이미지 저장
            </button>
            <NuxtLink to="/" class="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-4 text-sm font-black text-white dark:bg-white dark:text-zinc-950">
              나도 기록하기
            </NuxtLink>
          </div>
        </div>

        <aside class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
          <p class="text-xs font-black text-zinc-400">BOOK</p>
          <div class="mt-4 flex gap-4">
            <div class="h-32 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <img v-if="bookCover" :src="bookCover" class="h-full w-full object-cover" />
            </div>
            <div class="min-w-0">
              <h2 class="line-clamp-4 text-base font-black leading-6">{{ bookTitle }}</h2>
              <p class="mt-2 truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">{{ bookAuthor }}</p>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-2">
            <div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
              <p class="text-lg font-black">{{ formatDuration(session.duration_seconds) }}</p>
              <p class="mt-1 text-xs font-bold text-zinc-400">읽은 시간</p>
            </div>
            <div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
              <p class="text-lg font-black">{{ session.end_progress || 0 }}%</p>
              <p class="mt-1 text-xs font-bold text-zinc-400">진행률</p>
            </div>
          </div>
          <p class="mt-5 text-xs font-bold leading-5 text-zinc-400">
            {{ formattedDate }} 공유됨
          </p>
        </aside>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CompanionMascot from '~/components/reading/CompanionMascot.vue'
import ReadingShareCard from '~/components/reading/ReadingShareCard.vue'
import { useToastStore } from '~/stores/toast'
import { downloadReadingShareCard } from '~/utils/shareCardImage'

const route = useRoute()
const toast = useToastStore()
const token = computed(() => route.params.token as string)
const { data, pending, error } = await useFetch<any>(() => `/api/share/reading-session/${token.value}`)

const session = computed(() => data.value || {})
const book = computed(() => session.value?.group_book?.books || {})
const group = computed(() => session.value?.group_book?.groups || {})
const readerName = computed(() => session.value?.user?.nickname || '독자')
const bookTitle = computed(() => book.value?.title || '오늘의 독서')
const bookAuthor = computed(() => book.value?.author || '')
const bookCover = computed(() => book.value?.cover_url || '')
const groupName = computed(() => group.value?.name || 'Sidekick')
const formattedDate = computed(() => {
  const value = session.value?.shared_at || session.value?.started_at
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
})

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (safe > 0) return `${Math.max(1, minutes)}m`
  return '0m'
}

const copyCurrentUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('공유 링크를 복사했습니다.')
  } catch {
    toast.error('공유 링크 복사에 실패했습니다.')
  }
}

const downloadShareImage = async () => {
  try {
    await downloadReadingShareCard({
      title: bookTitle.value,
      author: bookAuthor.value,
      groupName: groupName.value,
      companionCode: session.value.companion_code,
      durationSeconds: session.value.duration_seconds,
      progress: session.value.end_progress,
      pagesRead: session.value.pages_read,
      quote: session.value.share_quote
    })
    toast.success('공유 카드 이미지를 저장했습니다.')
  } catch {
    toast.error('공유 카드 이미지 저장에 실패했습니다.')
  }
}
</script>
