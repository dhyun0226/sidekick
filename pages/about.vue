<template>
  <div class="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white">

    <!-- Nav -->
    <nav class="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/50">
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
    <section class="pt-32 pb-24 px-6 text-center">
      <div class="max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-lime-50 dark:bg-lime-900/20 rounded-full mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
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
        <NuxtLink to="/login" class="inline-flex px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-80 transition text-sm">
          무료로 시작하기
        </NuxtLink>
      </div>
    </section>

    <!-- Features -->
    <section class="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/30">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">독서가 더 즐거워지는 방법</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">혼자 읽어도, 함께 읽어도 완벽한 독서 경험</p>
        </div>

        <!-- Feature 1: 그룹 독서 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Users :size="20" class="text-blue-500" />
            </div>
            <h3 class="text-xl font-bold mb-3">그룹 독서</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              친구, 동료, 가족과 함께 같은 책을 읽어요. 그룹을 만들고 초대 코드 하나로 간편하게 참여할 수 있어요.
            </p>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                초대 코드로 간편한 그룹 참여
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                멤버별 진행률 실시간 확인
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                혼자 읽는 내 서재도 지원
              </li>
            </ul>
          </div>
          <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 aspect-[4/3] flex items-center justify-center">
            <div class="text-center">
              <Users :size="48" class="text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p class="text-xs text-zinc-400 dark:text-zinc-500">그룹 독서 화면</p>
              <p class="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">스크린샷 준비 중</p>
            </div>
          </div>
        </div>

        <!-- Feature 2: 위치별 코멘트 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div class="order-2 md:order-1 bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 aspect-[4/3] flex items-center justify-center">
            <div class="text-center">
              <MessageCircle :size="48" class="text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p class="text-xs text-zinc-400 dark:text-zinc-500">코멘트 화면</p>
              <p class="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">스크린샷 준비 중</p>
            </div>
          </div>
          <div class="order-1 md:order-2">
            <div class="w-10 h-10 rounded-xl bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center mb-4">
              <MessageCircle :size="20" class="text-lime-500" />
            </div>
            <h3 class="text-xl font-bold mb-3">위치별 코멘트</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              책의 특정 위치에 생각을 남기고, 같은 부분을 읽은 멤버와 토론해요. 아직 안 읽은 부분의 코멘트는 자동으로 가려져요.
            </p>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                읽은 위치에 코멘트 남기기
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                스포일러 자동 방지
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                인용구 하이라이트
              </li>
            </ul>
          </div>
        </div>

        <!-- Feature 3: 독서 캘린더 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
              <CalendarDays :size="20" class="text-amber-500" />
            </div>
            <h3 class="text-xl font-bold mb-3">독서 캘린더</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              매일의 독서 활동이 캘린더에 기록돼요. 책 커버가 날짜에 채워지는 걸 보면 뿌듯해질 거예요.
            </p>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                월간/연간 독서 캘린더
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                독서 스트릭 추적
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                연간 독서 목표 설정
              </li>
            </ul>
          </div>
          <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 aspect-[4/3] flex items-center justify-center">
            <div class="text-center">
              <CalendarDays :size="48" class="text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p class="text-xs text-zinc-400 dark:text-zinc-500">캘린더 화면</p>
              <p class="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">스크린샷 준비 중</p>
            </div>
          </div>
        </div>

        <!-- Feature 4: 내 서재 & 프로필 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div class="order-2 md:order-1 bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 aspect-[4/3] flex items-center justify-center">
            <div class="text-center">
              <BookOpen :size="48" class="text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p class="text-xs text-zinc-400 dark:text-zinc-500">프로필 & 서재 화면</p>
              <p class="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">스크린샷 준비 중</p>
            </div>
          </div>
          <div class="order-1 md:order-2">
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
              <BookOpen :size="20" class="text-purple-500" />
            </div>
            <h3 class="text-xl font-bold mb-3">내 서재 & 프로필</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              읽은 책, 읽고 있는 책, 읽고 싶은 책을 한눈에. 리뷰와 별점으로 독서 기록을 완성하고, 프로필에서 나의 독서 여정을 돌아보세요.
            </p>
            <ul class="space-y-2">
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                완독 서재 & 위시리스트
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                별점 리뷰
              </li>
              <li class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check :size="14" class="text-lime-500 flex-shrink-0" />
                독서 통계 & 인사이트
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-24 px-6">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">3단계로 시작하세요</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div v-for="(step, i) in steps" :key="step.title" class="text-center">
            <div class="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-5">
              <span class="text-xl font-black text-zinc-300 dark:text-zinc-600">{{ i + 1 }}</span>
            </div>
            <h3 class="text-sm font-bold mb-2">{{ step.title }}</h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing hint -->
    <section class="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/30">
      <div class="max-w-lg mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">무료로 시작, 필요하면 업그레이드</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
          내 서재와 기본 기능은 무료예요.<br/>
          소셜 그룹에서 더 활발하게 활동하고 싶다면 프리미엄을 만나보세요.
        </p>
        <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-5 text-center">
            <p class="text-2xl font-black mb-1">₩0</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">무료</p>
            <p class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">내 서재 · 독서 캘린더<br/>기본 기능 전부</p>
          </div>
          <div class="bg-zinc-900 dark:bg-white rounded-2xl p-5 text-center text-white dark:text-zinc-900">
            <p class="text-2xl font-black mb-1">₩2,500</p>
            <p class="text-xs font-medium opacity-70">월간</p>
            <p class="text-[11px] opacity-60 mt-2">무제한 그룹 생성<br/>소셜 그룹 완전 참여</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-28 px-6 text-center">
      <div class="max-w-lg mx-auto">
        <img src="/logo.svg" alt="Cheer Readers" class="w-12 h-12 mx-auto mb-6" />
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-4">독서를 함께 시작하세요</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-8">3초 만에 가입하고, 첫 번째 책을 등록해보세요.</p>
        <NuxtLink to="/login" class="inline-flex px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-full hover:opacity-80 transition text-sm">
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
import { Users, MessageCircle, CalendarDays, BookOpen, Check } from 'lucide-vue-next'

useHead({ title: 'Cheer Readers — 함께 읽고 기록하는 소셜 독서', titleTemplate: '' })

definePageMeta({ layout: false })

const steps = [
  { title: '그룹 만들기', desc: '독서 모임을 만들고 초대 코드를 공유하세요. 혼자 읽고 싶다면 내 서재에서 시작해도 좋아요.' },
  { title: '함께 읽기', desc: '같은 책을 읽으며 코멘트를 남기고, 서로의 진행률을 확인하며 응원해요.' },
  { title: '기록 쌓기', desc: '완독 후 리뷰를 남기고, 캘린더와 통계로 나의 독서 여정을 돌아보세요.' }
]
</script>
