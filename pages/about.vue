<template>
  <div class="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white overflow-x-hidden">

    <!-- Nav -->
    <nav class="fixed top-0 inset-x-0 z-50 transition-all duration-300" :class="scrolled ? 'bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50' : ''">
      <div class="px-6 sm:px-10 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Cheer Readers" class="w-6 h-6" />
          <span class="text-sm font-bold tracking-tight">치어리더스</span>
        </div>
        <NuxtLink to="/login" class="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-full hover:opacity-80 transition">
          시작하기
        </NuxtLink>
      </div>
    </nav>

    <!-- Hero -->
    <section class="pt-28 pb-20 sm:pt-36 sm:pb-28 px-6 text-center relative">
      <div class="max-w-2xl mx-auto">
        <div class="hero-anim opacity-0 translate-y-6" style="animation: hero-in 0.8s ease-out 0.1s forwards">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-lime-50 dark:bg-lime-900/20 rounded-full mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
            <span class="text-xs font-semibold text-lime-700 dark:text-lime-400">소셜 독서 플랫폼</span>
          </div>
        </div>
        <h1 class="opacity-0 translate-y-6" style="animation: hero-in 0.8s ease-out 0.3s forwards">
          <span class="block text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-2">함께 읽고,</span>
          <span class="block text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-2 text-lime-500">기록하고,</span>
          <span class="block text-4xl sm:text-6xl font-bold tracking-tight leading-[1.1]">응원하는 독서</span>
        </h1>
        <p class="opacity-0 translate-y-6 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto mt-8 mb-10" style="animation: hero-in 0.8s ease-out 0.5s forwards">
          같은 책을 읽는 사람들과 생각을 나누고,<br class="hidden sm:block" />
          나만의 독서 여정을 기록하세요.
        </p>
        <div class="opacity-0 translate-y-6" style="animation: hero-in 0.8s ease-out 0.7s forwards">
          <NuxtLink to="/login" class="inline-flex px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:scale-105 active:scale-95 transition-transform text-sm shadow-lg">
            무료로 시작하기
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-16 px-6 border-y border-zinc-100 dark:border-zinc-800/50" ref="statsSection">
      <div class="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
        <div v-for="stat in stats" :key="stat.label" class="reveal opacity-0 translate-y-8">
          <p class="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums">
            {{ animatedStats[stat.key] || 0 }}{{ stat.suffix }}
          </p>
          <p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-20 reveal opacity-0 translate-y-8">
          <h2 class="text-2xl sm:text-4xl font-bold tracking-tight mb-4">독서가 더 즐거워지는 방법</h2>
          <p class="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">혼자 읽어도, 함께 읽어도 완벽한 독서 경험</p>
        </div>

        <div v-for="(feat, i) in features" :key="feat.title" class="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center mb-28 last:mb-0">
          <!-- Text -->
          <div :class="i % 2 === 1 ? 'order-1 md:order-2' : ''" class="reveal opacity-0 translate-y-8">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-5" :class="feat.bg">
              <component :is="feat.icon" :size="22" :class="feat.color" />
            </div>
            <h3 class="text-xl sm:text-2xl font-bold mb-3">{{ feat.title }}</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">{{ feat.desc }}</p>
            <ul class="space-y-2.5">
              <li v-for="(item, j) in feat.items" :key="j" class="reveal-item flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 opacity-0 translate-x-[-10px]">
                <div class="w-5 h-5 rounded-full bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center flex-shrink-0">
                  <Check :size="12" class="text-lime-500" />
                </div>
                {{ item }}
              </li>
            </ul>
          </div>
          <!-- Screenshot -->
          <div :class="i % 2 === 1 ? 'order-2 md:order-1' : ''" class="reveal opacity-0 translate-y-8 reveal-delay-200">
            <div class="bg-zinc-50 dark:bg-zinc-900 rounded-3xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 sm:p-8 aspect-[4/3] flex items-center justify-center shadow-sm hover:shadow-lg transition-shadow duration-500">
              <div class="text-center">
                <component :is="feat.icon" :size="56" class="text-zinc-200 dark:text-zinc-700 mx-auto mb-4" />
                <p class="text-sm text-zinc-400 dark:text-zinc-500 font-medium">{{ feat.title }}</p>
                <p class="text-xs text-zinc-300 dark:text-zinc-600 mt-1">스크린샷 준비 중</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/30">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-16 reveal opacity-0 translate-y-8">
          <h2 class="text-2xl sm:text-4xl font-bold tracking-tight mb-4">3단계로 시작하세요</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div v-for="(step, i) in steps" :key="step.title" class="text-center reveal opacity-0 translate-y-8" :style="`transition-delay: ${i * 150}ms`">
            <div class="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              <component :is="step.icon" :size="24" class="text-lime-500" />
            </div>
            <div class="text-xs font-bold text-lime-500 mb-2">STEP {{ i + 1 }}</div>
            <h3 class="text-base font-bold mb-2">{{ step.title }}</h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-24 px-6">
      <div class="max-w-lg mx-auto text-center">
        <div class="reveal opacity-0 translate-y-8">
          <h2 class="text-2xl sm:text-4xl font-bold tracking-tight mb-4">무료로 시작,<br/>필요하면 업그레이드</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-10">
            내 서재와 기본 기능은 무료예요.<br/>
            소셜 그룹에서 더 활발하게 활동하고 싶다면 프리미엄을 만나보세요.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-5 max-w-sm mx-auto reveal opacity-0 translate-y-8 reveal-delay-200">
          <div class="bg-zinc-50 dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 text-center hover:scale-105 transition-transform">
            <p class="text-3xl font-black mb-1">₩0</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-3">무료</p>
            <p class="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">내 서재 · 독서 캘린더<br/>기본 기능 전부</p>
          </div>
          <div class="bg-zinc-900 dark:bg-white rounded-2xl p-6 text-center text-white dark:text-zinc-900 hover:scale-105 transition-transform shadow-lg">
            <p class="text-3xl font-black mb-1">₩2,500</p>
            <p class="text-xs font-semibold opacity-70 mb-3">월간</p>
            <p class="text-[11px] opacity-60 leading-relaxed">무제한 그룹 생성<br/>소셜 그룹 완전 참여</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-28 px-6 text-center bg-zinc-50 dark:bg-zinc-900/30 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-[-50%] left-[-20%] w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-50%] right-[-20%] w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[120px]"></div>
      </div>
      <div class="max-w-lg mx-auto relative z-10 reveal opacity-0 translate-y-8">
        <img src="/logo.svg" alt="Cheer Readers" class="w-14 h-14 mx-auto mb-6" />
        <h2 class="text-2xl sm:text-4xl font-bold tracking-tight mb-4">당신의 독서를<br/>응원합니다</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-10">3초 만에 가입하고, 첫 번째 책을 등록해보세요.</p>
        <NuxtLink to="/login" class="inline-flex px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:scale-105 active:scale-95 transition-transform text-sm shadow-lg">
          Google로 시작하기
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-zinc-100 dark:border-zinc-800/50 py-8 px-6">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <img src="/logo.svg" alt="Cheer Readers" class="w-5 h-5" />
          <span class="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Cheer Readers</span>
        </div>
        <div class="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <NuxtLink to="/privacy" class="hover:text-zinc-600 dark:hover:text-zinc-300 transition">개인정보처리방침</NuxtLink>
          <NuxtLink to="/terms" class="hover:text-zinc-600 dark:hover:text-zinc-300 transition">서비스 이용약관</NuxtLink>
        </div>
        <p class="text-xs text-zinc-300 dark:text-zinc-600">&copy; {{ new Date().getFullYear() }} Cheer Readers</p>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Users, MessageCircle, CalendarDays, BookOpen, Check, UserPlus, BookMarked, BarChart3 } from 'lucide-vue-next'

useHead({ title: 'Cheer Readers — 함께 읽고 기록하는 소셜 독서', titleTemplate: '' })
definePageMeta({ layout: false })

// Nav scroll effect
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 20 }

// Stats counter animation
const statsSection = ref<HTMLElement | null>(null)
const animatedStats = reactive<Record<string, number>>({ readers: 0, books: 0, comments: 0 })
const stats = [
  { key: 'readers', label: '독서 기록', target: 500, suffix: '+' },
  { key: 'books', label: '등록된 책', target: 120, suffix: '+' },
  { key: 'comments', label: '코멘트 & 리뷰', target: 2400, suffix: '+' }
]
let statsAnimated = false

const animateCounter = (key: string, target: number) => {
  const duration = 1500
  const steps = 40
  const increment = target / steps
  let current = 0
  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      animatedStats[key] = target
      clearInterval(timer)
    } else {
      animatedStats[key] = Math.floor(current)
    }
  }, duration / steps)
}

// Scroll reveal
let revealObserver: IntersectionObserver | null = null

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')

        // Stats counter
        if (entry.target === statsSection.value && !statsAnimated) {
          statsAnimated = true
          stats.forEach(s => animateCounter(s.key, s.target))
        }

        // Staggered list items
        const items = entry.target.querySelectorAll('.reveal-item')
        items.forEach((item, i) => {
          setTimeout(() => item.classList.add('revealed'), i * 100)
        })

        revealObserver?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.15 })

  document.querySelectorAll('.reveal').forEach(el => revealObserver?.observe(el))
  if (statsSection.value) revealObserver.observe(statsSection.value)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  revealObserver?.disconnect()
})

const features = [
  {
    title: '그룹 독서',
    desc: '친구, 동료, 가족과 함께 같은 책을 읽어요. 그룹을 만들고 초대 코드 하나로 간편하게 참여할 수 있어요.',
    icon: Users,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    color: 'text-blue-500',
    items: ['초대 코드로 간편한 그룹 참여', '멤버별 진행률 실시간 확인', '혼자 읽는 내 서재도 지원']
  },
  {
    title: '위치별 코멘트',
    desc: '책의 특정 위치에 생각을 남기고, 같은 부분을 읽은 멤버와 토론해요. 아직 안 읽은 부분의 코멘트는 자동으로 가려져요.',
    icon: MessageCircle,
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    color: 'text-lime-500',
    items: ['읽은 위치에 코멘트 남기기', '스포일러 자동 방지', '인용구 하이라이트']
  },
  {
    title: '독서 캘린더',
    desc: '매일의 독서 활동이 캘린더에 기록돼요. 책 커버가 날짜에 채워지는 걸 보면 뿌듯해질 거예요.',
    icon: CalendarDays,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    color: 'text-amber-500',
    items: ['월간/연간 독서 캘린더', '독서 스트릭 추적', '연간 독서 목표 설정']
  },
  {
    title: '내 서재 & 프로필',
    desc: '읽은 책, 읽고 있는 책, 읽고 싶은 책을 한눈에. 리뷰와 별점으로 독서 기록을 완성하세요.',
    icon: BookOpen,
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    color: 'text-purple-500',
    items: ['완독 서재 & 위시리스트', '별점 리뷰', '독서 통계 & 인사이트']
  }
]

const steps = [
  { title: '그룹 만들기', desc: '독서 모임을 만들고 초대 코드를 공유하세요. 혼자 읽고 싶다면 내 서재에서 시작해도 좋아요.', icon: UserPlus },
  { title: '함께 읽기', desc: '같은 책을 읽으며 코멘트를 남기고, 서로의 진행률을 확인하며 응원해요.', icon: BookMarked },
  { title: '기록 쌓기', desc: '완독 후 리뷰를 남기고, 캘린더와 통계로 나의 독서 여정을 돌아보세요.', icon: BarChart3 }
]
</script>

<style scoped>
@keyframes hero-in {
  to { opacity: 1; transform: translateY(0); }
}

.reveal {
  transition: opacity 0.7s ease-out, transform 0.7s ease-out;
}
.reveal.revealed {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
.reveal-delay-200 {
  transition-delay: 200ms;
}

.reveal-item {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.reveal-item.revealed {
  opacity: 1 !important;
  transform: translateX(0) !important;
}
</style>
