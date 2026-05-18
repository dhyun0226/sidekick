<template>
  <main class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#09090b] dark:text-white">
    <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header class="mb-6 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-black text-zinc-400">RECAP v2</p>
          <h1 class="mt-1 text-2xl font-black tracking-tight sm:text-4xl">{{ title }}</h1>
          <p class="mt-2 text-sm font-semibold leading-6 text-zinc-500 dark:text-zinc-400">
            읽기방 세션, 배지, 완독 기록을 모아 월간/연간 리캡으로 보여줍니다.
          </p>
        </div>
        <button
          type="button"
          class="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white text-zinc-700 shadow-apple ring-1 ring-black/[0.04] transition hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[0.06]"
          @click="router.push('/v2')"
        >
          <ArrowLeft :size="20" />
        </button>
      </header>

      <section class="mb-5 flex flex-wrap gap-2">
        <button
          v-for="item in periodOptions"
          :key="item.key"
          type="button"
          class="h-10 rounded-full px-4 text-sm font-black transition"
          :class="selectedPeriod === item.key ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' : 'bg-white text-zinc-600 ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[0.06]'"
          @click="selectedPeriod = item.key"
        >
          {{ item.label }}
        </button>
        <button
          type="button"
          class="h-10 rounded-full bg-zinc-900 px-4 text-sm font-black text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          :disabled="pending"
          @click="downloadRecap"
        >
          <span class="inline-flex items-center gap-1.5">
            <Download :size="15" />
            이미지 저장
          </span>
        </button>
      </section>

      <section v-if="pending" class="grid min-h-[420px] place-items-center">
        <div class="text-center">
          <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p class="text-sm font-bold text-zinc-500">리캡을 계산하는 중입니다.</p>
        </div>
      </section>

      <template v-else>
        <section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-7">
            <div class="mb-6 flex items-start justify-between gap-5">
              <div>
                <p class="text-xs font-black text-zinc-400">READING MEMORY</p>
                <h2 class="mt-1 text-2xl font-black">{{ recapSentence }}</h2>
              </div>
              <Sparkles :size="24" class="text-lime-500" />
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="stat in statCards" :key="stat.label" class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p class="text-xl font-black tabular-nums">{{ stat.value }}</p>
                <p class="mt-1 text-xs font-bold text-zinc-400">{{ stat.label }}</p>
              </div>
            </div>

            <div class="mt-6 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-sm font-black">월별 세션</p>
                <p class="text-xs font-bold text-zinc-400">{{ data?.period?.year }}</p>
              </div>
              <div class="grid grid-cols-6 gap-2 sm:grid-cols-12">
                <div v-for="month in data?.monthlyBreakdown || []" :key="month.key" class="text-center">
                  <div class="flex h-24 items-end justify-center rounded-xl bg-white p-1 dark:bg-zinc-900">
                    <div
                      class="w-full rounded-lg bg-zinc-900 transition-all dark:bg-white"
                      :style="{ height: `${monthBarHeight(month.sessions)}%` }"
                    ></div>
                  </div>
                  <p class="mt-2 text-[11px] font-bold text-zinc-400">{{ month.month }}월</p>
                </div>
              </div>
            </div>
          </div>

          <aside class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-black text-zinc-400">HIGHLIGHTS</p>
                <h2 class="text-lg font-black">이번 기간의 특징</h2>
              </div>
              <Trophy :size="21" class="text-amber-500" />
            </div>
            <div class="grid gap-2">
              <div v-for="item in highlights" :key="item.label" class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p class="text-xs font-bold text-zinc-400">{{ item.label }}</p>
                <p class="mt-1 text-base font-black">{{ item.value }}</p>
                <p v-if="item.sub" class="mt-1 text-xs font-semibold leading-5 text-zinc-500 dark:text-zinc-400">{{ item.sub }}</p>
              </div>
            </div>
          </aside>
        </section>

        <section class="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-black text-zinc-400">SESSIONS</p>
                <h2 class="text-lg font-black">최근 리캡 세션</h2>
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
                <div class="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <Clock3 :size="17" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black">{{ sessionTitle(session) }}</p>
                  <p class="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400">{{ formatDate(session.started_at) }}</p>
                </div>
                <p class="text-sm font-black tabular-nums">{{ formatDuration(session.duration_seconds) }}</p>
              </NuxtLink>
            </div>
            <div v-else class="rounded-2xl bg-zinc-50 p-5 text-sm font-semibold leading-6 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              아직 이 기간에 저장된 독서 세션이 없습니다.
            </div>
          </div>

          <div class="rounded-3xl bg-white p-5 shadow-apple ring-1 ring-black/[0.04] dark:bg-zinc-900 dark:ring-white/[0.06] sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-black text-zinc-400">ACHIEVEMENTS</p>
                <h2 class="text-lg font-black">완독과 배지</h2>
              </div>
              <Award :size="21" class="text-lime-500" />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p class="mb-3 text-sm font-black">완독한 책</p>
                <div v-if="finishedBooks.length > 0" class="grid gap-2">
                  <div v-for="item in finishedBooks" :key="item.group_book?.id || item.finished_at" class="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    {{ item.group_book?.books?.title || '제목 없는 책' }}
                  </div>
                </div>
                <p v-else class="text-sm font-semibold text-zinc-400">이 기간에는 아직 완독 기록이 없습니다.</p>
              </div>
              <div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p class="mb-3 text-sm font-black">획득 배지</p>
                <div v-if="badges.length > 0" class="grid gap-2">
                  <div v-for="item in badges" :key="`${item.badge?.code}-${item.earned_at}`" class="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    {{ item.badge?.title || '배지' }}
                  </div>
                </div>
                <p v-else class="text-sm font-semibold text-zinc-400">이 기간에는 새 배지가 없습니다.</p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, Award, Clock3, Download, Sparkles, Trophy } from 'lucide-vue-next'
import { downloadRecapCardImage } from '~/utils/recapCardImage'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Recap v2' })

const router = useRouter()
const now = new Date()
const selectedPeriod = ref('year')
const periodOptions = [
  { key: 'year', label: `${now.getFullYear()}년` },
  { key: 'month', label: `${now.getMonth() + 1}월` }
]

const query = computed(() => ({
  year: now.getFullYear(),
  month: selectedPeriod.value === 'month' ? now.getMonth() + 1 : undefined
}))

const { data, pending } = await useFetch<any>('/api/pages/v2-recap', {
  query,
  watch: [selectedPeriod]
})

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (safe > 0) return `${Math.max(1, minutes)}m`
  return '0m'
}

const title = computed(() => data.value?.period?.month
  ? `${data.value.period.year}년 ${data.value.period.month}월 리캡`
  : `${data.value?.period?.year || now.getFullYear()}년 리캡`
)

const recapSentence = computed(() => {
  const stats = data.value?.stats
  if (!stats?.sessionCount) return '아직 리캡을 만들 독서 세션이 없습니다.'
  return `${stats.activeDays}일 동안 ${formatDuration(stats.totalDurationSeconds)} 읽었습니다.`
})

const statCards = computed(() => {
  const stats = data.value?.stats || {}
  return [
    { label: '세션', value: stats.sessionCount || 0 },
    { label: '읽은 시간', value: formatDuration(stats.totalDurationSeconds || 0) },
    { label: '평균 세션', value: formatDuration(stats.averageDurationSeconds || 0) },
    { label: '페이지', value: stats.pagesRead || 0 },
    { label: '기록', value: stats.noteCount || 0 },
    { label: '활동일', value: stats.activeDays || 0 },
    { label: '완독', value: stats.completedBooks || 0 },
    { label: '배지', value: stats.earnedBadges || 0 }
  ]
})

const highlights = computed(() => {
  const h = data.value?.highlights || {}
  return [
    {
      label: '가장 오래 읽은 세션',
      value: h.longestSession ? formatDuration(h.longestSession.duration_seconds) : '아직 없음',
      sub: h.longestSession ? sessionTitle(h.longestSession) : ''
    },
    {
      label: '가장 많이 읽은 날',
      value: h.bestDay ? h.bestDay.day : '아직 없음',
      sub: h.bestDay ? `${h.bestDay.sessions}회 · ${formatDuration(h.bestDay.duration)}` : ''
    },
    {
      label: '자주 읽은 요일',
      value: h.bestWeekday ? `${h.bestWeekday.label}요일` : '아직 없음',
      sub: h.bestWeekday ? `${h.bestWeekday.count}회` : ''
    },
    {
      label: '자주 읽은 시간대',
      value: h.bestHour ? `${h.bestHour.hour}시대` : '아직 없음',
      sub: h.bestHour ? `${h.bestHour.count}회` : ''
    },
    {
      label: '대표 캐릭터',
      value: h.topCompanion?.code ? companionName(h.topCompanion.code) : '아직 없음',
      sub: h.topCompanion ? `${h.topCompanion.sessions}회 · ${formatDuration(h.topCompanion.duration)}` : ''
    },
    {
      label: '대표 도서',
      value: h.topBook?.title || '아직 없음',
      sub: h.topBook ? `${h.topBook.sessions}회 · ${formatDuration(h.topBook.duration)}` : ''
    }
  ]
})

const recentSessions = computed(() => data.value?.recentSessions || [])
const finishedBooks = computed(() => data.value?.finishedBooks || [])
const badges = computed(() => data.value?.badges || [])
const maxMonthSessions = computed(() => Math.max(...(data.value?.monthlyBreakdown || []).map((item: any) => item.sessions), 1))
const monthBarHeight = (sessions: number) => sessions > 0 ? Math.max(6, Math.round((sessions / maxMonthSessions.value) * 100)) : 0

const sessionTitle = (session: any) => {
  const groupBook = Array.isArray(session?.group_book) ? session.group_book[0] : session?.group_book
  return groupBook?.books?.title || '제목 없는 책'
}

const companionName = (code: string) => ({
  pipi: 'Pipi',
  momo: 'Momo',
  rumi: 'Rumi',
  toto: 'Toto',
  nori: 'Nori'
}[code] || 'Pipi')

const formatDate = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))

const downloadRecap = async () => {
  await downloadRecapCardImage({
    title: title.value,
    sentence: recapSentence.value,
    stats: statCards.value.map((item) => ({ label: item.label, value: item.value })),
    highlights: highlights.value.slice(0, 3).map((item) => ({ label: item.label, value: item.value }))
  })
}
</script>
