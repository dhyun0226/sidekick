<template>
  <main
    class="min-h-[100dvh] overflow-hidden text-zinc-900 dark:text-white"
    :class="wallpaperClass"
  >
    <div class="relative min-h-[100dvh]">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.45),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.28),transparent_30%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_30%)]"></div>

      <div class="relative z-10 min-h-[100dvh] flex flex-col">
        <header class="flex items-center justify-between px-4 sm:px-8 py-4">
          <button
            type="button"
            class="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-950/50 backdrop-blur flex items-center justify-center ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
            @click="goBack"
          >
            <ArrowLeft :size="20" />
          </button>
          <div class="text-center min-w-0 px-3">
            <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-300 truncate">{{ roomData?.group?.name || '독서방' }}</p>
            <h1 class="text-sm sm:text-base font-bold truncate max-w-[220px] sm:max-w-[420px]">{{ bookTitle }}</h1>
          </div>
          <button
            type="button"
            class="w-10 h-10 rounded-full bg-white/70 dark:bg-zinc-950/50 backdrop-blur flex items-center justify-center ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
            @click="showCompanions = !showCompanions"
          >
            <Sparkles :size="19" />
          </button>
        </header>

        <section v-if="loading" class="flex-1 grid place-items-center px-6">
          <div class="text-center">
            <div class="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-zinc-900/20 border-t-zinc-900 dark:border-white/20 dark:border-t-white animate-spin"></div>
            <p class="text-sm font-semibold">독서방을 준비하고 있어요</p>
          </div>
        </section>

        <section v-else-if="errorMessage" class="flex-1 grid place-items-center px-6">
          <div class="max-w-sm text-center bg-white/70 dark:bg-zinc-950/50 backdrop-blur rounded-2xl p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
            <p class="text-base font-bold mb-2">독서방을 열 수 없습니다</p>
            <p class="text-sm text-zinc-500 dark:text-zinc-300 mb-5">{{ errorMessage }}</p>
            <button class="px-5 py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold" @click="goBack">돌아가기</button>
          </div>
        </section>

        <template v-else>
          <section class="flex-1 grid lg:grid-cols-[minmax(260px,0.8fr)_minmax(320px,1.15fr)_minmax(280px,0.9fr)] gap-4 lg:gap-8 px-4 sm:px-8 pb-6">
            <aside class="hidden lg:flex flex-col justify-end">
              <div class="bg-white/58 dark:bg-zinc-950/42 backdrop-blur-xl rounded-2xl p-5 ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
                <div class="flex gap-4">
                  <div class="w-16 h-24 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-apple flex-shrink-0">
                    <img v-if="bookCover" :src="bookCover" class="w-full h-full object-cover" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-zinc-500 dark:text-zinc-300 mb-1">오늘의 책</p>
                    <h2 class="font-bold leading-tight line-clamp-2">{{ bookTitle }}</h2>
                    <p class="text-sm text-zinc-500 dark:text-zinc-300 truncate mt-1">{{ bookAuthor }}</p>
                  </div>
                </div>
                <div class="mt-5">
                  <div class="flex justify-between text-xs font-semibold mb-2">
                    <span>진행률</span>
                    <span>{{ progress }}%</span>
                  </div>
                  <div class="h-2 rounded-full bg-white/70 dark:bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full bg-zinc-900 dark:bg-white transition-all" :style="{ width: `${progress}%` }"></div>
                  </div>
                </div>
                <div class="mt-4 border-t border-zinc-900/10 pt-3 dark:border-white/10">
                  <p class="px-2 pb-2 text-xs font-bold text-zinc-500 dark:text-zinc-300">읽기방 화면</p>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="item in wallpapers"
                      :key="item.code"
                      type="button"
                      class="rounded-xl p-2 text-left ring-1 transition"
                      :class="activeWallpaper === item.code ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 ring-transparent' : 'bg-white/55 dark:bg-white/5 ring-black/[0.04] dark:ring-white/[0.08]'"
                      @click="selectWallpaper(item.code)"
                    >
                      <span class="mb-2 block h-8 rounded-lg" :class="item.previewClass"></span>
                      <span class="block text-xs font-bold truncate">{{ item.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <section class="flex flex-col items-center justify-center min-h-[46vh] lg:min-h-0">
              <div class="companion-stage" :class="stageClass">
                <div class="ambient ambient-one"></div>
                <div class="ambient ambient-two"></div>
                <div class="speech-bubble">
                  <p class="text-[11px] font-black uppercase tracking-wide text-zinc-400">{{ companionMoodLabel }}</p>
                  <p class="mt-1 text-sm font-black leading-5 text-zinc-900 dark:text-white">{{ enhancedCompanionLine }}</p>
                </div>
                <CompanionMascot :code="activeCompanion" :state="companionState" />
                <div class="focus-ring"></div>
              </div>
              <div class="mt-3 text-center">
                <p class="text-sm sm:text-base font-bold">{{ activeCompanionMeta.name }}</p>
                <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">{{ activeCompanionMeta.short }}</p>
              </div>
            </section>

            <aside class="flex flex-col justify-end gap-4">
              <div
                v-if="showCompanions"
                class="bg-white/62 dark:bg-zinc-950/48 backdrop-blur-xl rounded-2xl p-3 ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
              >
                <p class="px-2 pb-2 text-xs font-bold text-zinc-500 dark:text-zinc-300">같이 읽을 캐릭터</p>
                <div class="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  <button
                    v-for="item in companionOptions"
                    :key="item.code"
                    type="button"
                    class="rounded-xl px-2 py-2 text-left transition-all ring-1"
                    :class="activeCompanion === item.code ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 ring-transparent' : 'bg-white/55 dark:bg-white/5 ring-black/[0.04] dark:ring-white/[0.08]'"
                    @click="selectCompanion(item.code)"
                  >
                    <span class="block text-xs font-bold truncate">{{ item.name }}</span>
                    <span class="hidden lg:block text-[11px] opacity-70 truncate">{{ item.short }}</span>
                  </button>
                </div>
              </div>

              <div class="bg-white/70 dark:bg-zinc-950/55 backdrop-blur-xl rounded-3xl p-5 sm:p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.08] shadow-apple">
                <div class="text-center mb-5">
                  <p class="text-xs font-bold text-zinc-500 dark:text-zinc-300 mb-1">READING TIMER</p>
                  <p class="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">{{ formattedTime }}</p>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-5">
                  <button class="timer-button" :disabled="isRunning" @click="startTimer">
                    <Play :size="17" />
                    시작
                  </button>
                  <button class="timer-button" :disabled="!isRunning" @click="pauseTimer">
                    <Pause :size="17" />
                    멈춤
                  </button>
                  <button class="timer-button primary" :disabled="elapsedSeconds === 0 || saving" @click="endSession">
                    <Square :size="15" />
                    종료
                  </button>
                </div>

                <label class="block mb-4">
                  <span class="flex justify-between text-xs font-bold mb-2">
                    <span>오늘 여기까지 읽었어요</span>
                    <span>{{ progress }}%</span>
                  </span>
                  <input v-model.number="progress" type="range" min="0" max="100" class="w-full accent-zinc-900 dark:accent-white" />
                </label>

                <div class="grid grid-cols-2 gap-3 mb-3">
                  <label class="block">
                    <span class="text-xs font-bold text-zinc-500 dark:text-zinc-300">읽은 페이지</span>
                    <input v-model.number="pagesRead" type="number" min="0" class="room-input mt-1" placeholder="0" />
                  </label>
                  <label class="block">
                    <span class="text-xs font-bold text-zinc-500 dark:text-zinc-300">인용구</span>
                    <input v-model="quote" type="text" class="room-input mt-1" placeholder="문장 저장" />
                  </label>
                </div>

                <label class="block">
                  <span class="text-xs font-bold text-zinc-500 dark:text-zinc-300">메모</span>
                  <textarea v-model="memo" rows="3" class="room-input mt-1 resize-none" placeholder="읽다가 떠오른 생각을 적어두세요"></textarea>
                </label>
              </div>
            </aside>
          </section>

          <div
            v-if="summaryOpen"
            class="fixed inset-0 z-[10000] bg-black/45 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <div class="w-full max-w-4xl bg-white dark:bg-zinc-950 rounded-3xl p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.08] shadow-apple-lg">
              <p class="text-sm font-bold text-zinc-500 dark:text-zinc-300 mb-1">{{ activeCompanionMeta.name }}와 함께 읽었어요</p>
              <h2 class="text-2xl font-bold mb-5">오늘의 독서 세션</h2>
              <div class="grid grid-cols-3 gap-3 mb-5">
                <div class="summary-card">
                  <p class="summary-value">{{ formatDuration(lastSummary.durationSeconds) }}</p>
                  <p class="summary-label">읽은 시간</p>
                </div>
                <div class="summary-card">
                  <p class="summary-value">{{ lastSummary.endProgress }}%</p>
                  <p class="summary-label">진행률</p>
                </div>
                <div class="summary-card">
                  <p class="summary-value">{{ lastSummary.pagesRead }}</p>
                  <p class="summary-label">페이지</p>
                </div>
              </div>
              <p v-if="lastSummary.memo || lastSummary.quote" class="text-sm text-zinc-500 dark:text-zinc-300 mb-5">
                메모와 인용구를 책 기록에 저장했습니다.
              </p>
              <div
                v-if="lastSummary.badges.length > 0"
                class="mb-5 rounded-2xl bg-lime-50 p-4 ring-1 ring-lime-200 dark:bg-lime-400/10 dark:ring-lime-400/20"
              >
                <p class="text-xs font-black text-lime-700 dark:text-lime-300">새 배지</p>
                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="badge in lastSummary.badges"
                    :key="badge.code"
                    class="rounded-xl bg-white/70 p-3 dark:bg-white/10"
                  >
                    <p class="text-sm font-black">{{ badge.title }}</p>
                    <p class="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-300">{{ badge.description }}</p>
                  </div>
                </div>
              </div>
              <ReadingShareCard
                class="mb-5"
                :title="bookTitle"
                :author="bookAuthor"
                :group-name="roomData?.group?.name"
                :companion-code="activeCompanion"
                :duration-seconds="lastSummary.durationSeconds"
                :progress="lastSummary.endProgress"
                :pages-read="lastSummary.pagesRead"
                :quote="lastSummary.quote"
              />
              <p v-if="lastSummary.shareUrl" class="mb-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                공유 링크가 만들어졌습니다. 링크를 열면 누구나 이 독서 카드를 볼 수 있습니다.
              </p>
              <div class="grid gap-2 sm:grid-cols-5">
                <button class="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold" @click="summaryOpen = false">계속 읽기</button>
                <button class="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold" @click="copyShareText">공유 문구 복사</button>
                <button class="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold disabled:opacity-50" :disabled="sharing" @click="createShareLink">
                  {{ lastSummary.shareUrl ? '링크 복사' : (sharing ? '생성 중' : '공유 링크') }}
                </button>
                <button class="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold inline-flex items-center justify-center gap-2" @click="downloadShareImage">
                  <Download :size="17" />
                  이미지 저장
                </button>
                <button class="flex-1 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold" @click="goBack">나가기</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Download, Pause, Play, Sparkles, Square } from 'lucide-vue-next'
import CompanionMascot from '~/components/reading/CompanionMascot.vue'
import ReadingShareCard from '~/components/reading/ReadingShareCard.vue'
import { useToastStore } from '~/stores/toast'
import { downloadReadingShareCard } from '~/utils/shareCardImage'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const companions = [
  { code: 'pipi', name: 'Pipi', short: '시작을 도와주는 밝은 친구' },
  { code: 'momo', name: 'Momo', short: '조용한 사서형 친구' },
  { code: 'rumi', name: 'Rumi', short: '메모와 인용을 챙기는 친구' },
  { code: 'toto', name: 'Toto', short: '타이머와 목표를 보는 친구' },
  { code: 'nori', name: 'Nori', short: '분위기를 만드는 몽환 친구' }
]

const companionProfiles: Record<string, any> = {
  pipi: {
    short: '밝게 시작을 열어주는 작은 독서 버디',
    lines: {
      idle: '첫 문장만 같이 열어볼까요?',
      focus: '좋아요. 지금 리듬을 그대로 지켜볼게요.',
      thinking: '그 문장은 반짝였어요. 잊지 않게 잡아둘게요.',
      paused: '잠깐 쉬어도 괜찮아요. 자리 지키고 있을게요.',
      cheer: '여기까지 읽은 것도 이미 좋은 기록이에요.',
      celebrate: '오늘의 읽기 조각을 예쁘게 저장했어요.'
    }
  },
  momo: {
    short: '조용한 책상 옆을 지키는 차분한 버디',
    lines: {
      idle: '조용히 앉아 있을게요. 준비되면 시작해요.',
      focus: '천천히, 깊게. 책 속으로 들어가는 중이에요.',
      thinking: '좋은 생각은 천천히 적어도 괜찮아요.',
      paused: '차 한 모금 같은 쉬는 시간이에요.',
      cheer: '흐름을 놓치지 않았어요. 이어가면 됩니다.',
      celebrate: '오늘의 독서가 차분히 쌓였어요.'
    }
  },
  rumi: {
    short: '문장과 메모를 좋아하는 감성 버디',
    lines: {
      idle: '오늘 마음에 남을 문장을 찾아볼까요?',
      focus: '문장 사이에서 빛나는 걸 같이 보고 있어요.',
      thinking: '방금 생각, 좋아요. 더 다듬어 저장해볼까요?',
      paused: '멈춘 자리에도 문장은 남아 있어요.',
      cheer: '메모 하나가 다음 리뷰의 씨앗이 될 거예요.',
      celebrate: '오늘의 문장을 예쁘게 품어뒀어요.'
    }
  },
  toto: {
    short: '타이머와 목표를 챙기는 집중 버디',
    lines: {
      idle: '타이머 준비 완료. 짧게라도 시작해볼까요?',
      focus: '집중 모드예요. 시간은 제가 보고 있을게요.',
      thinking: '기록도 목표의 일부예요. 정확히 남겨둘게요.',
      paused: '타이머는 멈췄고, 기록은 안전해요.',
      cheer: '좋아요. 이제 마무리하거나 조금 더 갈 수 있어요.',
      celebrate: '세션 완료. 오늘 목표에 한 칸 가까워졌어요.'
    }
  },
  nori: {
    short: '밤 독서와 몰입 배경을 좋아하는 버디',
    lines: {
      idle: '불빛을 낮추고 조용히 시작해볼까요?',
      focus: '책장 넘기는 소리만 남겨둘게요.',
      thinking: '밤에 떠오른 생각은 더 오래 남더라고요.',
      paused: '잠깐 기대 쉬어도 돼요. 제가 옆에 있을게요.',
      cheer: '오늘의 분위기가 기록에 잘 담기고 있어요.',
      celebrate: '밤공기 같은 독서 기록이 완성됐어요.'
    }
  }
}

const wallpapers = [
  {
    code: 'morning-desk',
    name: 'Morning Desk',
    className: 'bg-[linear-gradient(135deg,#fef3c7,#fde68a_42%,#bae6fd)] dark:bg-[linear-gradient(135deg,#18181b,#27272a_48%,#1e293b)]',
    previewClass: 'bg-[linear-gradient(135deg,#fef3c7,#fde68a_42%,#bae6fd)]'
  },
  {
    code: 'quiet-library',
    name: 'Quiet Library',
    className: 'bg-[linear-gradient(135deg,#dcfce7,#bbf7d0_44%,#e0f2fe)] dark:bg-[linear-gradient(135deg,#052e16,#14532d_46%,#0f172a)]',
    previewClass: 'bg-[linear-gradient(135deg,#dcfce7,#bbf7d0_44%,#e0f2fe)]'
  },
  {
    code: 'quote-garden',
    name: 'Quote Garden',
    className: 'bg-[linear-gradient(135deg,#fce7f3,#fbcfe8_45%,#ddd6fe)] dark:bg-[linear-gradient(135deg,#3b0764,#701a75_45%,#111827)]',
    previewClass: 'bg-[linear-gradient(135deg,#fce7f3,#fbcfe8_45%,#ddd6fe)]'
  },
  {
    code: 'focus-blue',
    name: 'Focus Blue',
    className: 'bg-[linear-gradient(135deg,#dbeafe,#bfdbfe_46%,#cffafe)] dark:bg-[linear-gradient(135deg,#082f49,#1e3a8a_46%,#111827)]',
    previewClass: 'bg-[linear-gradient(135deg,#dbeafe,#bfdbfe_46%,#cffafe)]'
  },
  {
    code: 'night-lamp',
    name: 'Night Lamp',
    className: 'bg-[linear-gradient(135deg,#ede9fe,#c4b5fd_44%,#fef3c7)] dark:bg-[linear-gradient(135deg,#18122b,#312e81_46%,#422006)]',
    previewClass: 'bg-[linear-gradient(135deg,#ede9fe,#c4b5fd_44%,#fef3c7)]'
  }
]

const loading = ref(true)
const saving = ref(false)
const sharing = ref(false)
const errorMessage = ref('')
const roomData = ref<any>(null)
const activeCompanion = ref('pipi')
const activeWallpaper = ref('morning-desk')
const showCompanions = ref(false)
const isRunning = ref(false)
const elapsedSeconds = ref(0)
const startedAt = ref<string | null>(null)
const progress = ref(0)
const startProgress = ref(0)
const pagesRead = ref(0)
const memo = ref('')
const quote = ref('')
const summaryOpen = ref(false)
const lastSummary = ref({
  durationSeconds: 0,
  endProgress: 0,
  pagesRead: 0,
  memo: '',
  quote: '',
  sessionId: '',
  shareUrl: '',
  badges: [] as any[]
})

let intervalId: ReturnType<typeof setInterval> | null = null

const bookId = computed(() => route.params.bookId as string)
const bookTitle = computed(() => roomData.value?.book?.book?.title || '독서방')
const bookAuthor = computed(() => roomData.value?.book?.book?.author || '')
const bookCover = computed(() => roomData.value?.book?.book?.cover_url || '')
const companionOptions = computed(() => companions.map((item) => ({
  ...item,
  ...(companionProfiles[item.code] || {})
})))

const activeCompanionMeta = computed(() =>
  companionOptions.value.find(c => c.code === activeCompanion.value) || companionOptions.value[0]
)

const companionState = computed(() => {
  if (summaryOpen.value) return 'celebrate'
  if (memo.value || quote.value) return 'thinking'
  if (isRunning.value) return 'focus'
  if (elapsedSeconds.value > 0) return 'paused'
  return 'idle'
})

const companionLine = computed(() => {
  if (summaryOpen.value) return '오늘의 기록을 저장했어요.'
  if (memo.value || quote.value) return '좋은 생각은 바로 잡아둘게요.'
  if (isRunning.value) return '지금은 책에 머무르는 시간이에요.'
  if (elapsedSeconds.value > 0) return '여기서 마무리해도 좋아요.'
  return '책을 펼치면 같이 읽기 시작할게요.'
})

const enhancedCompanionLine = computed(() => {
  const lines = activeCompanionMeta.value?.lines || companionProfiles.pipi.lines
  return lines[companionState.value] || lines.idle
})

const companionMoodLabel = computed(() => ({
  idle: 'ready',
  focus: 'focus',
  thinking: 'memo',
  paused: 'pause',
  cheer: 'nice',
  celebrate: 'saved'
})[companionState.value] || 'ready')

const stageClass = computed(() => `stage-${companionState.value}`)

const wallpaperClass = computed(() => {
  return wallpapers.find(item => item.code === activeWallpaper.value)?.className || wallpapers[0].className
})

const formattedTime = computed(() => formatDuration(elapsedSeconds.value))

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const loadRoom = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await $fetch('/api/pages/reading-room', {
      query: { bookId: bookId.value }
    })
    roomData.value = data
    activeCompanion.value = (data as any).settings?.active_companion_code || 'pipi'
    activeWallpaper.value = (data as any).settings?.active_wallpaper_code || 'morning-desk'
    progress.value = (data as any).progress?.progress_pct || 0
    startProgress.value = progress.value
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || '독서방 데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const startTimer = () => {
  if (isRunning.value) return
  if (!startedAt.value) {
    startedAt.value = new Date().toISOString()
    startProgress.value = progress.value
  }
  isRunning.value = true
  intervalId = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const endSession = async () => {
  if (saving.value || elapsedSeconds.value === 0) return
  pauseTimer()
  saving.value = true
  try {
    const payload = {
      groupBookId: bookId.value,
      companionCode: activeCompanion.value,
      startedAt: startedAt.value || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: elapsedSeconds.value,
      startProgress: startProgress.value,
      endProgress: progress.value,
      pagesRead: pagesRead.value || 0,
      memo: memo.value,
      quote: quote.value
    }

    const result = await $fetch<any>('/api/reading-sessions/create', {
      method: 'POST',
      body: payload
    })

    lastSummary.value = {
      durationSeconds: elapsedSeconds.value,
      endProgress: progress.value,
      pagesRead: pagesRead.value || 0,
      memo: memo.value,
      quote: quote.value,
      sessionId: result?.session?.id || '',
      shareUrl: '',
      badges: result?.badges || []
    }
    memo.value = ''
    quote.value = ''
    pagesRead.value = 0
    elapsedSeconds.value = 0
    startedAt.value = null
    startProgress.value = progress.value
    summaryOpen.value = true
  } catch (error: any) {
    toast.error(error?.data?.message || error?.message || '독서 세션 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

const selectCompanion = async (code: string) => {
  activeCompanion.value = code
  showCompanions.value = false
  try {
    await $fetch('/api/companions/settings', {
      method: 'POST',
      body: {
        companionCode: code,
        wallpaperCode: activeWallpaper.value
      }
    })
  } catch {
    toast.error('캐릭터 설정 저장에 실패했습니다.')
  }
}

const selectWallpaper = async (code: string) => {
  activeWallpaper.value = code
  try {
    await $fetch('/api/companions/settings', {
      method: 'POST',
      body: {
        companionCode: activeCompanion.value,
        wallpaperCode: code
      }
    })
  } catch {
    toast.error('읽기방 화면 저장에 실패했습니다.')
  }
}

const copyShareText = async () => {
  const lines = [
    `${bookTitle.value} 읽는 중`,
    `${activeCompanionMeta.value.name}와 ${formatDuration(lastSummary.value.durationSeconds)} 함께 읽었어요.`,
    `진행률 ${lastSummary.value.endProgress}% · ${lastSummary.value.pagesRead}p`,
    lastSummary.value.quote ? `"${lastSummary.value.quote}"` : ''
  ].filter(Boolean)

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    toast.success('공유 문구를 복사했습니다.')
  } catch {
    toast.error('공유 문구 복사에 실패했습니다.')
  }
}

const copyShareUrl = async (url: string) => {
  const absoluteUrl = new URL(url, window.location.origin).toString()
  await navigator.clipboard.writeText(absoluteUrl)
}

const createShareLink = async () => {
  if (sharing.value) return

  if (lastSummary.value.shareUrl) {
    try {
      await copyShareUrl(lastSummary.value.shareUrl)
      toast.success('공유 링크를 복사했습니다.')
    } catch {
      toast.error('공유 링크 복사에 실패했습니다.')
    }
    return
  }

  if (!lastSummary.value.sessionId) {
    toast.error('공유할 독서 세션을 찾을 수 없습니다.')
    return
  }

  sharing.value = true
  try {
    const result = await $fetch<any>('/api/reading-sessions/share', {
      method: 'POST',
      body: {
        sessionId: lastSummary.value.sessionId,
        quote: lastSummary.value.quote
      }
    })
    lastSummary.value.shareUrl = result?.url || ''
    if (lastSummary.value.shareUrl) {
      await copyShareUrl(lastSummary.value.shareUrl)
    }
    toast.success('공유 링크를 만들고 복사했습니다.')
  } catch (error: any) {
    toast.error(error?.data?.message || error?.message || '공유 링크 생성에 실패했습니다.')
  } finally {
    sharing.value = false
  }
}

const downloadShareImage = async () => {
  try {
    await downloadReadingShareCard({
      title: bookTitle.value,
      author: bookAuthor.value,
      groupName: roomData.value?.group?.name,
      companionCode: activeCompanion.value,
      companionName: activeCompanionMeta.value.name,
      durationSeconds: lastSummary.value.durationSeconds,
      progress: lastSummary.value.endProgress,
      pagesRead: lastSummary.value.pagesRead,
      quote: lastSummary.value.quote
    })
    toast.success('공유 카드 이미지를 저장했습니다.')
  } catch {
    toast.error('공유 카드 이미지 저장에 실패했습니다.')
  }
}

const goBack = () => {
  const fallback = roomData.value?.group?.group_type === 'solo'
    ? '/my-library'
    : `/group/${roomData.value?.group?.id || ''}`
  router.push((route.query.from as string) || fallback || '/')
}

watch(progress, (value) => {
  progress.value = Math.max(0, Math.min(100, Math.round(Number(value || 0))))
})

onMounted(loadRoom)
onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.companion-stage {
  position: relative;
  width: min(78vw, 390px);
  min-height: 360px;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.speech-bubble {
  position: absolute;
  top: 8px;
  left: 50%;
  z-index: 6;
  width: min(300px, 78vw);
  transform: translateX(-50%);
  border-radius: 22px;
  padding: 14px 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 50px rgba(24, 24, 27, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.52);
  animation: bubble-in 0.45s ease both;
}

.dark .speech-bubble {
  background: rgba(24, 24, 27, 0.62);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.speech-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -9px;
  width: 18px;
  height: 18px;
  transform: translateX(-50%) rotate(45deg);
  border-radius: 4px;
  background: inherit;
}

.focus-ring {
  position: absolute;
  z-index: 1;
  bottom: 44px;
  width: 56%;
  aspect-ratio: 1;
  border-radius: 999px;
  border: 1px solid rgba(24, 24, 27, 0.08);
  opacity: 0;
}

.dark .focus-ring {
  border-color: rgba(255, 255, 255, 0.12);
}

.ambient {
  position: absolute;
  z-index: 0;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.42;
  pointer-events: none;
}

.ambient-one {
  width: 112px;
  height: 112px;
  left: 24px;
  bottom: 76px;
  background: rgba(190, 242, 100, 0.44);
  animation: ambient-float 7s ease-in-out infinite;
}

.ambient-two {
  width: 86px;
  height: 86px;
  right: 34px;
  top: 112px;
  background: rgba(147, 197, 253, 0.44);
  animation: ambient-float 8s ease-in-out infinite reverse;
}

.stage-focus .focus-ring {
  animation: focus-ring 3.2s ease-in-out infinite;
  opacity: 1;
}

.stage-thinking .speech-bubble {
  animation: bubble-think 1.8s ease-in-out infinite;
}

.stage-paused .speech-bubble {
  opacity: 0.92;
}

.stage-celebrate .ambient-one,
.stage-celebrate .ambient-two {
  opacity: 0.7;
  animation-duration: 2.4s;
}

@keyframes bubble-in {
  from { transform: translateX(-50%) translateY(8px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

@keyframes bubble-think {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-3px); }
}

@keyframes focus-ring {
  0%, 100% { transform: scale(0.82); opacity: 0.18; }
  50% { transform: scale(1); opacity: 0.42; }
}

@keyframes ambient-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(0.94); }
  50% { transform: translate3d(10px, -12px, 0) scale(1.04); }
}

.timer-button {
  min-height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.72);
  color: #18181b;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.dark .timer-button {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.timer-button:disabled {
  opacity: 0.42;
}

.timer-button:not(:disabled):active {
  transform: scale(0.98);
}

.timer-button.primary {
  background: #18181b;
  color: white;
}

.dark .timer-button.primary {
  background: white;
  color: #18181b;
}

.room-input {
  width: 100%;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.78);
  color: #18181b;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.dark .room-input {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.summary-card {
  border-radius: 18px;
  padding: 14px 10px;
  background: #f4f4f5;
  text-align: center;
}

.dark .summary-card {
  background: #27272a;
}

.summary-value {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.summary-label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #71717a;
}
</style>
