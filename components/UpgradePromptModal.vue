<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-center justify-center p-6" @keydown.esc="$emit('close')" tabindex="-1">
        <!-- Backdrop with Deep Blur -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

        <!-- Premium Modal Container -->
        <div class="relative w-full max-w-[380px] bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-300">
          
          <!-- Decorative Light Effect -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-lime-400/20 dark:bg-lime-400/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <!-- Close Button -->
          <button @click="$emit('close')" class="absolute top-5 right-5 z-20 p-2 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-90">
            <X :size="18" stroke-width="2.5" />
          </button>

          <!-- Top Section: Icon & Badges -->
          <div class="pt-12 pb-6 px-8 text-center relative">
            <div class="w-20 h-20 bg-gradient-to-tr from-lime-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-lime-400/20 rotate-3">
              <component :is="featureIcon" :size="40" class="text-white drop-shadow-sm" stroke-width="2.5" />
            </div>
            
            <div class="inline-flex items-center gap-1.5 bg-lime-50 dark:bg-lime-900/20 px-3 py-1 rounded-full mb-3">
              <Sparkles :size="12" class="text-lime-600 dark:text-lime-400" />
              <span class="text-[11px] font-black text-lime-700 dark:text-lime-400 uppercase tracking-widest">Premium Membership</span>
            </div>
            
            <h3 class="text-2xl font-semibold text-zinc-900 dark:text-white leading-tight mb-2 tracking-tight whitespace-pre-line">
              {{ featureTitle }}
            </h3>
            <p class="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
              {{ featureMessage }}
            </p>
          </div>

          <!-- Mid Section: Benefits -->
          <div class="px-8 pb-8 space-y-3">
            <div v-for="benefit in benefits" :key="benefit" class="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 group transition-colors hover:border-lime-200">
              <div class="w-6 h-6 rounded-full bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm text-lime-500 flex-shrink-0 group-hover:bg-lime-500 group-hover:text-white transition-colors">
                <Check :size="14" stroke-width="3" />
              </div>
              <span class="text-sm font-bold text-zinc-700 dark:text-zinc-300">{{ benefit }}</span>
            </div>
          </div>

          <!-- Bottom Section: Pricing & Action -->
          <div class="p-8 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800/50">
            <div class="flex items-center justify-between mb-6">
              <div class="text-left">
                <p class="text-[11px] font-bold text-zinc-400 uppercase mb-0.5">베이직 플랜</p>
                <p class="text-lg font-black text-zinc-900 dark:text-white leading-none">₩2,500 <span class="text-xs font-normal text-zinc-500">/ 월</span></p>
              </div>
              <div class="text-right">
                <div class="bg-lime-400 text-[11px] font-black px-2 py-1 rounded-lg text-black animate-pulse-gentle shadow-sm shadow-lime-400/30">
                  BEST VALUE
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <button
                @click="goToSubscription"
                class="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/5 flex items-center justify-center gap-2"
              >
                멤버십 시작하기
              </button>
              <p class="text-[11px] text-zinc-400 text-center font-medium">언제든지 해지할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Users, BookOpen, TrendingUp, Lock, Sparkles, X } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  feature: 'groups' | 'books' | 'insights' | 'general'
  currentCount?: number
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])
const router = useRouter()

// 기능별 설정 (정책 변경 반영)
const featureConfig = {
  groups: {
    icon: Users,
    title: '그룹은 최대 2개까지\n참여 가능합니다',
    message: '프리미엄 회원이 되면 제한 없이 더 많은 그룹에서 함께 읽을 수 있어요.',
    benefits: ['무제한 그룹 참가 가능', '그룹당 등록 가능한 책 무제한', '모든 독서 데이터 무제한 보관']
  },
  books: {
    icon: BookOpen,
    title: '그룹에서 책을 추가하려면\n프리미엄이 필요합니다',
    message: '프리미엄 회원이 되면 소셜 그룹에서도 자유롭게 책을 추가하고 함께 읽을 수 있어요.',
    benefits: ['소셜 그룹에서 책 추가 가능', '무제한 책 추가', '완독 기록 영구 보존']
  },
  insights: {
    icon: TrendingUp,
    title: '나만의 독서 통계,\n더 자세히 알고 싶다면',
    message: '고급 통계 기능으로 나의 독서 습관을 완벽하게 분석하고 관리해 보세요.',
    benefits: ['연간 독서 목표 정밀 관리', '상세 활동 히트맵 제공', '장르별/기간별 독서 리포트']
  },
  general: {
    icon: Lock,
    title: '치어리더스 프리미엄\n전용 기능입니다',
    message: '지금 업그레이드하고 치어리더스의 모든 기능을 제한 없이 누려보세요.',
    benefits: ['모든 프리미엄 기능 무제한', '새로운 기능 우선 이용권', '전용 고객 지원']
  }
}

const config = computed(() => featureConfig[props.feature])
const featureIcon = computed(() => config.value.icon)
const featureTitle = computed(() => config.value.title)
const featureMessage = computed(() => config.value.message)
const benefits = computed(() => config.value.benefits)

const goToSubscription = () => {
  emit('close')
  router.push('/subscription')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@keyframes pulse-gentle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

.animate-pulse-gentle {
  animation: pulse-gentle 2s infinite ease-in-out;
}
</style>