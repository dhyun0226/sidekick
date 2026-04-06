<template>
  <div class="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">

    <!-- Nav -->
    <nav class="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Cheer Readers" class="w-6 h-6" />
          <span class="text-sm font-bold tracking-tight">치어리더스</span>
        </div>
        <NuxtLink to="/login" class="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-full hover:opacity-80 transition">
          시작하기
        </NuxtLink>
      </div>
    </nav>

    <!-- Hero -->
    <section class="pt-32 pb-20 px-6 text-center">
      <div class="max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-lime-50 dark:bg-lime-900/20 rounded-full mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
          <span class="text-xs font-semibold text-lime-700 dark:text-lime-400">소셜 독서 플랫폼</span>
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.15] mb-6">
          함께 읽고,<br/>
          <span class="text-lime-500">기록</span>하고,<br/>
          응원하는 독서
        </h1>
        <p class="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto mb-10">
          같은 책을 읽는 사람들과 생각을 나누고,<br class="hidden sm:block" />
          나만의 독서 여정을 기록하세요.
        </p>
        <div class="flex items-center justify-center gap-3">
          <NuxtLink to="/login" class="px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-80 transition text-sm">
            무료로 시작하기
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 px-6 bg-zinc-50 dark:bg-zinc-900/30">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">독서가 더 즐거워지는 방법</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">치어리더스가 제공하는 핵심 기능</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div v-for="feat in features" :key="feat.title" class="bg-white dark:bg-zinc-900 rounded-2xl p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-4" :class="feat.bg">
              <component :is="feat.icon" :size="20" :class="feat.color" />
            </div>
            <h3 class="text-base font-bold mb-2">{{ feat.title }}</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-20 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">이렇게 사용해요</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">3단계로 시작하는 소셜 독서</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div v-for="(step, i) in steps" :key="step.title" class="text-center">
            <div class="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <span class="text-lg font-black text-zinc-400 dark:text-zinc-500">{{ i + 1 }}</span>
            </div>
            <h3 class="text-sm font-bold mb-2">{{ step.title }}</h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Screenshot placeholder -->
    <section class="py-20 px-6 bg-zinc-50 dark:bg-zinc-900/30">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">깔끔한 인터페이스</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-10">모바일과 데스크탑 모두 최적화된 경험</p>
        <div class="bg-white dark:bg-zinc-900 rounded-3xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-8 sm:p-12">
          <div class="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
            <div class="text-center">
              <Monitor :size="48" class="text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p class="text-xs text-zinc-400 dark:text-zinc-500">스크린샷 준비 중</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24 px-6 text-center">
      <div class="max-w-lg mx-auto">
        <img src="/logo.svg" alt="Cheer Readers" class="w-12 h-12 mx-auto mb-6" />
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">독서를 함께 시작하세요</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8">무료로 가입하고, 독서 모임을 만들어보세요.</p>
        <NuxtLink to="/login" class="inline-flex px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-80 transition text-sm">
          무료로 시작하기
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
import { Users, MessageCircle, CalendarDays, BookOpen, Monitor } from 'lucide-vue-next'

useHead({ title: 'Cheer Readers — 함께 읽고 기록하는 소셜 독서', titleTemplate: '' })

definePageMeta({ layout: false })

const features = [
  {
    title: '그룹 독서',
    desc: '친구, 동료와 함께 같은 책을 읽어요. 그룹을 만들고 초대 코드로 간편하게 참여할 수 있어요.',
    icon: Users,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    color: 'text-blue-500'
  },
  {
    title: '위치별 코멘트',
    desc: '책의 특정 위치에 생각을 남기고, 같은 부분을 읽은 멤버와 토론해요. 스포일러 걱정 없이.',
    icon: MessageCircle,
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    color: 'text-lime-500'
  },
  {
    title: '독서 캘린더',
    desc: '매일의 독서 활동이 캘린더에 기록돼요. 스트릭을 쌓고 연간 목표를 달성해보세요.',
    icon: CalendarDays,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    color: 'text-amber-500'
  },
  {
    title: '내 서재',
    desc: '읽은 책, 읽고 있는 책, 읽고 싶은 책을 한눈에. 리뷰와 별점으로 독서 기록을 완성해요.',
    icon: BookOpen,
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    color: 'text-purple-500'
  }
]

const steps = [
  { title: '그룹 만들기', desc: '독서 모임을 만들고 친구를 초대하거나, 혼자 읽는 내 서재를 시작하세요.' },
  { title: '함께 읽기', desc: '같은 책을 읽으며 코멘트를 남기고, 서로의 진행률을 확인해요.' },
  { title: '기록 쌓기', desc: '완독 후 리뷰를 남기고, 캘린더와 통계로 독서 여정을 돌아보세요.' }
]
</script>
