<template>
  <main class="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white">
    <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header class="mb-6 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold text-zinc-400 dark:text-zinc-500">Sidekick v2.0</p>
          <h1 class="mt-1 text-2xl font-black tracking-tight sm:text-4xl">캐릭터와 함께 읽는 공간</h1>
          <p class="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            읽기방, 공유 카드, 배지, 추천을 한 흐름으로 묶는 v2 허브입니다.
          </p>
        </div>
        <button
          type="button"
          class="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-700 shadow-apple ring-1 ring-black/[0.04] transition hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[0.06]"
          @click="router.push('/')"
        >
          <ArrowLeft :size="20" />
        </button>
      </header>

      <section v-if="pending" class="grid min-h-[420px] place-items-center">
        <div class="text-center">
          <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p class="text-sm font-bold text-zinc-500">v2 데이터를 불러오는 중입니다.</p>
        </div>
      </section>

      <section v-else-if="data?.migrationRequired" class="rounded-3xl bg-white p-8 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06]">
        <h2 class="text-xl font-black">v2 테이블 적용이 필요합니다</h2>
        <p class="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
          읽기 세션, 캐릭터 설정, 캐릭터 통계를 저장하려면 새 Supabase migration을 먼저 적용해야 합니다.
        </p>
        <code class="mt-5 block rounded-2xl bg-zinc-100 p-4 text-sm font-bold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          supabase/migrations/20260518000000_add_reading_sessions.sql
        </code>
      </section>

      <template v-else>
        <section class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="grid gap-5 sm:grid-cols-[190px_1fr]">
              <div class="flex items-center justify-center rounded-3xl bg-zinc-50 p-5 dark:bg-zinc-950">
                <CompanionMascot :code="activeCompanion" :state="companionState" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-black text-zinc-400">ACTIVE COMPANION</p>
                <h2 class="mt-1 text-2xl font-black">{{ companionName }}</h2>
                <p class="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
                  {{ companionCopy }}
                </p>
                <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div v-for="stat in statCards" :key="stat.label" class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                    <p class="text-lg font-black tabular-nums">{{ stat.value }}</p>
                    <p class="mt-1 text-xs font-bold text-zinc-400">{{ stat.label }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-black text-zinc-400">COMPANIONS</p>
                  <h3 class="text-sm font-black">함께 읽을 캐릭터 선택</h3>
                </div>
                <p v-if="savingCompanion" class="text-xs font-bold text-zinc-400">저장 중</p>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-5">
                <button
                  v-for="option in companionOptions"
                  :key="option.code"
                  type="button"
                  class="rounded-2xl p-3 text-left ring-1 transition"
                  :class="activeCompanion === option.code
                    ? 'bg-zinc-950 text-white ring-zinc-950 dark:bg-white dark:text-zinc-950 dark:ring-white'
                    : 'bg-zinc-50 text-zinc-700 ring-transparent hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800'"
                  :disabled="savingCompanion"
                  @click="selectCompanion(option.code)"
                >
                  <div class="mb-2 flex justify-center">
                    <CompanionMascot :code="option.code" state="idle" class="companion-chip" />
                  </div>
                  <p class="text-sm font-black">{{ option.name }}</p>
                  <p class="mt-1 text-xs font-semibold leading-4 opacity-70">{{ option.short }}</p>
                </button>
              </div>
            </div>
          </div>

          <ReadingShareCard
            :title="latestSessionBook.title"
            :author="latestSessionBook.author"
            :group-name="latestSessionBook.groupName"
            :companion-code="activeCompanion"
            :duration-seconds="latestSession.duration_seconds"
            :progress="latestSession.end_progress"
            :pages-read="latestSession.pages_read"
            :quote="latestSession.quote"
            eyebrow="Share Card Preview"
          />
          <button
            type="button"
            class="rounded-3xl bg-white p-4 text-sm font-black text-zinc-700 shadow-apple ring-1 ring-black/[0.04] transition hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[0.06] dark:hover:text-white lg:col-start-2"
            @click="downloadLatestShareImage"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <Download :size="17" />
              최근 세션 카드 이미지 저장
            </span>
          </button>
          <NuxtLink
            to="/recap/v2"
            class="rounded-3xl bg-zinc-950 p-4 text-sm font-black text-white shadow-apple transition hover:opacity-90 dark:bg-white dark:text-zinc-950 lg:col-start-2"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <BarChart3 :size="17" />
              Recap v2 열기
            </span>
          </NuxtLink>
          <NuxtLink
            to="/recommendations/v2"
            class="rounded-3xl bg-white p-4 text-sm font-black text-zinc-700 shadow-apple ring-1 ring-black/[0.04] transition hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[0.06] dark:hover:text-white lg:col-start-2"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <Sparkles :size="17" />
              추천 v2 열기
            </span>
          </NuxtLink>
        </section>

        <section class="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black text-zinc-400">RECENT SESSIONS</p>
                <h2 class="text-lg font-black">최근 독서 로그</h2>
              </div>
              <Clock3 :size="21" class="text-indigo-500" />
            </div>
            <div v-if="recentSessions.length > 0" class="grid gap-2">
              <NuxtLink
                v-for="session in recentSessions"
                :key="session.id"
                :to="`/read/${session.group_book_id}`"
                class="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 transition hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800"
              >
                <div class="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white text-zinc-800 ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/[0.06]">
                  <Clock3 :size="18" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black">{{ sessionTitle(session) }}</p>
                  <p class="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {{ sessionGroupName(session) }} · {{ formatSessionDate(session.started_at) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-black tabular-nums">{{ formatDuration(session.duration_seconds) }}</p>
                  <p class="text-xs font-bold text-zinc-400">{{ session.end_progress || 0 }}%</p>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="rounded-2xl bg-zinc-50 p-5 text-sm font-semibold leading-6 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              아직 저장된 독서 세션이 없습니다. 읽기방에서 타이머를 시작하고 첫 기록을 남겨보세요.
            </div>
          </div>

          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black text-zinc-400">EARNED BADGES</p>
                <h2 class="text-lg font-black">획득한 배지</h2>
              </div>
              <Award :size="21" class="text-lime-500" />
            </div>
            <div v-if="earnedBadges.length > 0" class="grid gap-2">
              <div
                v-for="badge in earnedBadges"
                :key="badge.code"
                class="rounded-2xl bg-lime-50 p-3 text-zinc-950 ring-1 ring-lime-200 dark:bg-lime-400/10 dark:text-white dark:ring-lime-400/20"
              >
                <div class="flex items-center gap-3">
                  <div class="grid h-10 w-10 place-items-center rounded-xl bg-lime-400 text-zinc-950">
                    <Check :size="18" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black">{{ badge.title }}</p>
                    <p class="text-xs font-medium leading-5 opacity-75">{{ badge.description }}</p>
                  </div>
                </div>
                <p v-if="badge.earnedAt" class="mt-2 text-xs font-bold text-lime-700 dark:text-lime-300">
                  {{ formatSessionDate(badge.earnedAt) }} 획득
                </p>
              </div>
            </div>
            <div v-else class="rounded-2xl bg-zinc-50 p-5 text-sm font-semibold leading-6 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              첫 세션을 완료하면 배지가 여기에 쌓입니다.
            </div>
          </div>
        </section>

        <section class="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-black text-zinc-400">BADGES</p>
                <h2 class="text-lg font-black">배지 진행 상황</h2>
              </div>
              <Award :size="21" class="text-lime-500" />
            </div>
            <div class="grid gap-2">
              <div
                v-for="badge in data?.badges || []"
                :key="badge.code"
                class="flex items-center gap-3 rounded-2xl p-3 ring-1"
                :class="badge.earned ? 'bg-lime-50 text-zinc-950 ring-lime-200 dark:bg-lime-400/10 dark:text-white dark:ring-lime-400/20' : 'bg-zinc-50 text-zinc-500 ring-transparent dark:bg-zinc-950 dark:text-zinc-400'"
              >
                <div class="grid h-10 w-10 place-items-center rounded-xl" :class="badge.earned ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'">
                  <Check v-if="badge.earned" :size="18" />
                  <Lock v-else :size="17" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-black">{{ badge.title }}</p>
                  <p class="text-xs font-medium leading-5 opacity-75">{{ badge.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-black text-zinc-400">NEXT</p>
                <h2 class="text-lg font-black">다음 읽기 추천</h2>
              </div>
              <Sparkles :size="21" class="text-sky-500" />
            </div>
            <div class="grid gap-3">
              <NuxtLink
                v-for="item in data?.recommendations || []"
                :key="`${item.type}-${item.title}`"
                :to="item.href"
                class="group grid gap-3 rounded-2xl bg-zinc-50 p-3 transition hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 sm:grid-cols-[40px_1fr]"
              >
                <div class="h-14 w-10 flex-shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
                  <img v-if="item.coverUrl" :src="item.coverUrl" class="h-full w-full object-cover" />
                  <div v-else class="grid h-full w-full place-items-center text-zinc-400">
                    <Sparkles :size="17" />
                  </div>
                </div>
                <div class="min-w-0">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-black">{{ item.title }}</p>
                      <p class="mt-0.5 text-xs font-semibold leading-5 text-zinc-500 dark:text-zinc-400">{{ item.subtitle }}</p>
                    </div>
                    <ChevronRight :size="18" class="mt-0.5 flex-shrink-0 text-zinc-400 transition group-hover:translate-x-0.5" />
                  </div>
                  <p v-if="item.reason" class="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-zinc-500 ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/[0.06]">
                    {{ item.reason }}
                  </p>
                  <p class="mt-2 text-xs font-black text-zinc-900 dark:text-white">{{ item.actionLabel || '바로가기' }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, Award, BarChart3, Check, ChevronRight, Clock3, Download, Lock, Sparkles } from 'lucide-vue-next'
import CompanionMascot from '~/components/reading/CompanionMascot.vue'
import ReadingShareCard from '~/components/reading/ReadingShareCard.vue'
import { downloadReadingShareCard } from '~/utils/shareCardImage'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Sidekick v2.0' })

const router = useRouter()
const { data, pending, refresh } = await useFetch<any>('/api/pages/v2-companion')
const savingCompanion = ref(false)

const companionLabels: Record<string, { name: string; copy: string }> = {
  pipi: { name: 'Pipi', copy: '시작을 가볍게 만들어 주는 밝은 독서 친구입니다.' },
  momo: { name: 'Momo', copy: '조용한 서재 분위기로 긴 호흡의 독서를 돕습니다.' },
  rumi: { name: 'Rumi', copy: '좋은 문장과 메모를 놓치지 않게 챙깁니다.' },
  toto: { name: 'Toto', copy: '타이머와 목표를 중심으로 집중 리듬을 잡아 줍니다.' },
  nori: { name: 'Nori', copy: '밤 독서와 몰입감 있는 월페이퍼에 어울리는 친구입니다.' }
}

const companionOptions = [
  { code: 'pipi', name: 'Pipi', short: '밝게 시작' },
  { code: 'momo', name: 'Momo', short: '차분한 몰입' },
  { code: 'rumi', name: 'Rumi', short: '문장 수집' },
  { code: 'toto', name: 'Toto', short: '타이머 집중' },
  { code: 'nori', name: 'Nori', short: '밤 독서' }
]

const activeCompanion = computed(() => data.value?.activeCompanion || 'pipi')
const companionName = computed(() => companionLabels[activeCompanion.value]?.name || 'Pipi')
const companionCopy = computed(() => companionLabels[activeCompanion.value]?.copy || companionLabels.pipi.copy)
const companionState = computed(() => (data.value?.stats?.sessionCount || 0) > 0 ? 'cheer' : 'idle')

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (safe > 0) return `${Math.max(1, minutes)}m`
  return '0m'
}

const statCards = computed(() => [
  { label: '세션', value: data.value?.stats?.sessionCount || 0 },
  { label: '읽은 시간', value: formatDuration(data.value?.stats?.totalDurationSeconds || 0) },
  { label: '페이지', value: data.value?.stats?.pagesRead || 0 },
  { label: '기록', value: data.value?.stats?.noteCount || 0 }
])

const latestSession = computed(() => data.value?.recentSessions?.[0] || {
  duration_seconds: 0,
  end_progress: 0,
  pages_read: 0,
  quote: ''
})
const recentSessions = computed(() => data.value?.recentSessions || [])
const earnedBadges = computed(() => (data.value?.badges || []).filter((badge: any) => badge.earned))

const latestSessionBook = computed(() => {
  const session = latestSession.value
  return {
    title: session?.group_book?.books?.title || '아직 저장된 세션이 없어요',
    author: session?.group_book?.books?.author || '읽기방에서 첫 세션을 만들어 보세요',
    groupName: session?.group_book?.groups?.name || 'Sidekick',
  }
})

const formatSessionDate = (value: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

const sessionTitle = (session: any) =>
  session?.group_book?.books?.title || '제목 없는 책'

const sessionGroupName = (session: any) =>
  session?.group_book?.groups?.name || 'Sidekick'

const selectCompanion = async (code: string) => {
  if (savingCompanion.value || code === activeCompanion.value) return

  savingCompanion.value = true
  try {
    await $fetch('/api/companions/settings', {
      method: 'POST',
      body: { companionCode: code }
    })
    await refresh()
  } finally {
    savingCompanion.value = false
  }
}

const downloadLatestShareImage = async () => {
  await downloadReadingShareCard({
    title: latestSessionBook.value.title,
    author: latestSessionBook.value.author,
    groupName: latestSessionBook.value.groupName,
    companionCode: activeCompanion.value,
    companionName: companionName.value,
    durationSeconds: latestSession.value.duration_seconds,
    progress: latestSession.value.end_progress,
    pagesRead: latestSession.value.pages_read,
    quote: latestSession.value.quote
  })
}
</script>

<style scoped>
.companion-chip {
  width: 64px;
}
</style>
