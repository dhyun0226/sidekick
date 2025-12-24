<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="$emit('close')"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
          <!-- Gradient Header -->
          <div class="bg-gradient-to-br from-lime-400 via-lime-500 to-emerald-500 p-8 text-center relative overflow-hidden">
            <div class="absolute inset-0 opacity-10"></div>
            <div class="relative z-10">
              <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <component :is="featureIcon" :size="32" class="text-white" />
              </div>
              <h3 class="text-2xl font-bold text-white mb-2">{{ featureTitle }}</h3>
              <div class="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span class="text-sm font-bold text-white">PREMIUM</span>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <p class="text-zinc-700 dark:text-zinc-300 text-center mb-6 leading-relaxed">
              {{ featureMessage }}
            </p>

            <!-- Benefits List -->
            <div class="space-y-3 mb-6">
              <div v-for="benefit in benefits" :key="benefit" class="flex items-center gap-3">
                <Check :size="20" class="text-lime-500 flex-shrink-0" />
                <span class="text-sm text-zinc-700 dark:text-zinc-300">{{ benefit }}</span>
              </div>
            </div>

            <!-- Pricing Preview -->
            <div class="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 mb-6 text-center">
              <div class="text-xs text-zinc-500 mb-1">월 단위</div>
              <div class="text-2xl font-bold text-zinc-900 dark:text-white">
                ₩2,500<span class="text-sm font-normal text-zinc-500">/월</span>
              </div>
              <div class="text-xs text-lime-600 dark:text-lime-400 mt-1">
                연간 구독 시 37% 할인 (월 ₩1,583)
              </div>
            </div>

            <!-- Actions -->
            <div class="space-y-2">
              <button
                @click="goToSubscription"
                class="w-full py-4 bg-gradient-to-r from-lime-400 to-lime-500 text-black font-bold rounded-xl hover:from-lime-300 hover:to-lime-400 transition-all shadow-lg hover:shadow-lime-400/30 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Sparkles :size="20" />
                프리미엄으로 업그레이드
              </button>
              <button
                @click="$emit('close')"
                class="w-full py-3 text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Users, BookOpen, TrendingUp, Lock, Sparkles } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  feature: 'groups' | 'books' | 'insights' | 'general'
  currentCount?: number
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])
const router = useRouter()

// 기능별 설정
const featureConfig = {
  groups: {
    icon: Users,
    title: '더 많은 그룹을 만들고 싶으신가요?',
    message: `현재 ${props.currentCount || 0}/2개 그룹을 사용 중입니다. 프리미엄으로 업그레이드하면 무제한 그룹을 만들 수 있어요!`,
    benefits: ['무제한 그룹 생성', '무제한 책 추가', '고급 통계 분석']
  },
  books: {
    icon: BookOpen,
    title: '더 많은 책을 추가하고 싶으신가요?',
    message: '프리미엄 회원은 무제한으로 책을 추가할 수 있습니다.',
    benefits: ['그룹당 무제한 책', '모든 그룹 무제한 생성', '독서 통계 분석']
  },
  insights: {
    icon: TrendingUp,
    title: '고급 통계를 확인해보세요',
    message: '프리미엄 회원만 연간 독서 목표, 히트맵, 상세 분석을 이용할 수 있습니다.',
    benefits: ['연간 독서 목표 설정', '히트맵으로 습관 추적', '월별 상세 분석']
  },
  general: {
    icon: Lock,
    title: '프리미엄 기능입니다',
    message: '이 기능은 프리미엄 회원 전용입니다.',
    benefits: ['모든 프리미엄 기능 이용', '광고 없는 경험', '우선 지원']
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
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
