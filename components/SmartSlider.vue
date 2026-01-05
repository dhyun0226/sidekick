<template>
  <div class="fixed bottom-0 left-0 right-0 z-[100] overflow-visible pointer-events-auto">
    <!-- Glassmorphism Container -->
    <div class="max-w-[480px] mx-auto bg-white dark:bg-black backdrop-blur-md border-t border-zinc-300 dark:border-zinc-800 pb-safe overflow-visible pointer-events-auto">

      <!-- Slider Area Wrapper with Padding -->
      <div class="px-4 pointer-events-auto">
        <div
          class="relative h-16 w-full cursor-pointer select-none overflow-visible overscroll-none pointer-events-auto"
          style="overscroll-behavior: none; -webkit-overflow-scrolling: auto; touch-action: none;"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseEnd"
          @mouseleave="handleMouseEnd"
          ref="sliderRef"
        >
          <!-- Chapter Backgrounds -->
          <div class="absolute inset-0 h-full opacity-30">
          <div
            v-for="(chapter, index) in chapters"
            :key="index"
            :style="{
              left: `${chapter.start}%`,
              width: `${chapter.width}%`
            }"
            class="absolute h-full border-r border-zinc-300 dark:border-zinc-700 transition-colors duration-300"
            :class="[
              currentPct >= chapter.start && currentPct < chapter.end ? 'bg-lime-400/20' : 'bg-transparent'
            ]"
          ></div>
        </div>

        <!-- Ruler Ticks (5% intervals) -->
        <div class="absolute inset-0 pb-2 pointer-events-none">
          <div
            v-for="i in 21"
            :key="i"
            class="absolute bottom-0 w-px bg-zinc-300 dark:bg-zinc-700"
            :class="(i - 1) % 2 === 0 ? 'h-5' : 'h-2.5'"
            :style="{ left: `${(i - 1) * 5}%` }"
          ></div>
        </div>

        <!-- Pacemaker Avatars (Members) -->
        <div class="absolute inset-0 pointer-events-none overflow-visible z-10">
          <div
            v-for="member in members"
            :key="member.id"
            class="absolute top-0 -translate-x-1/2 translate-y-2 flex flex-col items-center transition-all duration-500 hover:z-20 group"
            :style="{ left: `${member.progress}%` }"
          >
            <!-- Avatar Bubble -->
            <Avatar
              :src="member.avatar_url"
              :fallback="member.nickname || 'U'"
              size="xs"
              :alt="member.nickname"
              className="border border-white dark:border-zinc-800 shadow-md relative z-10"
            />
            <!-- Small Triangle pointing down -->
            <div class="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-white dark:border-b-zinc-800 -mt-0.5 drop-shadow-sm rotate-180"></div>
          </div>
        </div>

        <!-- Progress Bar (Active) -->
        <div
          class="absolute bottom-0 left-0 h-1 bg-lime-400"
          :class="{ 'transition-none': isDragging, 'transition-all duration-75 ease-out': !isDragging }"
          :style="{ width: `${currentPct}%` }"
        ></div>

        <!-- Thumb / Handle -->
        <div
          class="absolute top-1/2 -translate-y-1/4 -translate-x-1/2 w-11 h-11 flex items-center justify-center"
          :class="{ 'transition-none': isDragging }"
          :style="{ left: `${currentPct}%` }"
        >
          <div class="w-5 h-5 rounded-full bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)] ring-2 ring-white/20"></div>
        </div>

        <!-- Tooltip (Visible on Drag) -->
        <div
          v-if="isDragging"
          class="absolute -top-8 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl border border-zinc-300 dark:border-zinc-700 whitespace-nowrap pointer-events-none animate-fade-in-up"
          :style="tooltipPositionStyle"
        >
          <span class="text-lime-600 dark:text-lime-400 font-bold mr-1">
            {{ Math.round(currentPct) }}%
          </span>
          <span v-if="currentPage" class="text-zinc-500 dark:text-zinc-400 mr-1">· {{ currentPage }}p</span>
          <span v-if="currentChapterName" class="text-zinc-600 dark:text-zinc-400">{{ currentChapterName }}</span>
        </div>
        </div>
      </div>

      <!-- Action Bar (Optional, e.g. Write Button) -->
      <div class="flex justify-between items-center px-4 py-5 gap-4 pointer-events-auto">
        <div class="text-xs text-zinc-600 dark:text-zinc-500 font-mono flex-1 min-w-0">
          <span v-if="currentChapterName">{{ currentChapterName }}</span>
          <span v-else class="text-zinc-400 dark:text-zinc-600">·</span>
        </div>
        <button
          @click="$emit('write')"
          class="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-lime-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
        >
          <PenLine :size="22" />
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { PenLine } from 'lucide-vue-next'
import Avatar from './Avatar.vue'

interface Chapter {
  title: string
  start: number // 0-100
  end: number   // 0-100
}

const props = defineProps<{
  toc?: Chapter[]
  modelValue: number
  totalPages?: number
  members?: Array<{ id: string; nickname: string; avatar_url?: string; progress: number }>
}>()

const emit = defineEmits(['update:modelValue', 'change', 'write', 'dragging'])

const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const localPct = ref(props.modelValue)
const lastPct = ref(props.modelValue) // Track last value for haptic feedback
let dragTimeout: NodeJS.Timeout | null = null // Safety timeout to prevent stuck state

// 🔥 Critical Fix: Sync localPct with external modelValue changes (e.g., from jumpToChapter)
watch(() => props.modelValue, (newVal) => {
  if (!isDragging.value) {
    localPct.value = newVal
  }
})

// Mock TOC if not provided
const defaultToc: Chapter[] = [
  { title: 'Intro', start: 0, end: 10 },
  { title: 'Chapter 1', start: 10, end: 40 },
  { title: 'Chapter 2', start: 40, end: 80 },
  { title: 'Epilogue', start: 80, end: 100 },
]

const chapters = computed(() => {
  const list = props.toc || defaultToc
  return list.map(c => ({
    ...c,
    width: c.end - c.start
  }))
})

const members = computed(() => props.members || [])

const currentPct = computed(() => isDragging.value ? localPct.value : props.modelValue)

const currentPage = computed(() => {
  if (!props.totalPages) return null
  // 페이지는 1부터 시작 (0페이지 방지)
  return Math.max(1, Math.round((currentPct.value / 100) * props.totalPages))
})

const currentChapterName = computed(() => {
  const pct = currentPct.value

  // toc가 없으면 빈 문자열
  if (!props.toc || props.toc.length === 0) {
    return ''
  }

  // Find chapter where pct is within range
  const found = chapters.value.find((c, index) => {
    const isLast = index === chapters.value.length - 1
    // For last chapter, include the end point
    if (isLast) {
      return pct >= c.start && pct <= c.end
    } else {
      return pct >= c.start && pct < c.end
    }
  })

  // 목차 범위 밖이면 빈 문자열 (서문/후기 등)
  return found ? found.title : ''
})

// Dynamic tooltip positioning to prevent clipping at edges
const tooltipPositionStyle = computed(() => {
  const pct = currentPct.value

  if (pct < 10) {
    // Left edge: anchor to left side, no transform
    return {
      left: `${pct}%`,
      transform: 'translateX(0)',
      right: 'auto'
    }
  } else if (pct > 50) {
    // Right edge: anchor to right side instead of left
    return {
      right: `${100 - pct}%`,
      transform: 'translateX(0)',
      left: 'auto'
    }
  } else {
    // Middle: centered
    return {
      left: `${pct}%`,
      transform: 'translateX(-50%)',
      right: 'auto'
    }
  }
})

// Haptic feedback function
const triggerHaptic = () => {
  // Note: Vibration API is NOT supported on iOS (iPhone/iPad)
  // Only works on Android devices (both browser and PWA)
  if ('vibrate' in navigator) {
    // Stronger haptic: 25ms vibration for better tactile feedback
    // Pattern could be used for more complex feedback: [duration, pause, duration]
    navigator.vibrate(25) // Medium haptic feedback (25ms)
  }
}

const updatePosition = (clientX: number) => {
  if (!sliderRef.value) return

  const rect = sliderRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
  const pct = (x / rect.width) * 100

  // Snap to integer (0, 1, 2, ..., 100)
  const roundedPct = Math.round(pct)

  // Trigger haptic feedback when value changes
  if (roundedPct !== lastPct.value) {
    triggerHaptic()
    lastPct.value = roundedPct
  }

  localPct.value = roundedPct
  emit('update:modelValue', roundedPct)
}

// 🔥 Global touch handlers - bound to window to prevent event loss during scroll
const handleGlobalTouchMove = (event: TouchEvent) => {
  if (!isDragging.value || event.touches.length !== 1) return

  event.preventDefault()
  const touch = event.touches[0]
  updatePosition(touch.clientX)
}

const handleGlobalTouchEnd = (event: TouchEvent) => {
  if (!isDragging.value) return

  // Restore body scroll
  document.body.style.overflow = ''
  document.body.style.touchAction = ''

  // Remove global listeners
  window.removeEventListener('touchmove', handleGlobalTouchMove)
  window.removeEventListener('touchend', handleGlobalTouchEnd)
  window.removeEventListener('touchcancel', handleGlobalTouchEnd)

  // Clear safety timeout
  if (dragTimeout) {
    clearTimeout(dragTimeout)
    dragTimeout = null
  }

  const wasDragging = isDragging.value
  isDragging.value = false
  emit('dragging', false)

  if (wasDragging) {
    emit('change', localPct.value)
  }
}

// 🔥 Touch Events (PWA에서 가장 안정적)
const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length !== 1) return

  event.preventDefault()

  // Block body scroll during drag
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'

  // Clear any existing safety timeout
  if (dragTimeout) {
    clearTimeout(dragTimeout)
    dragTimeout = null
  }

  isDragging.value = true
  emit('dragging', true)

  const touch = event.touches[0]
  updatePosition(touch.clientX)

  // 🔥 CRITICAL: Bind to window to prevent event loss during timeline scroll!
  window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
  window.addEventListener('touchend', handleGlobalTouchEnd, { passive: false })
  window.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: false })

  // Safety timeout: auto-reset if touchend doesn't fire within 5 seconds
  dragTimeout = setTimeout(() => {
    if (isDragging.value) {
      console.warn('[SmartSlider] Auto-resetting stuck drag state')

      // Cleanup
      window.removeEventListener('touchmove', handleGlobalTouchMove)
      window.removeEventListener('touchend', handleGlobalTouchEnd)
      window.removeEventListener('touchcancel', handleGlobalTouchEnd)

      isDragging.value = false
      emit('dragging', false)
      emit('change', localPct.value)

      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    dragTimeout = null
  }, 5000)
}

const handleTouchMove = (event: TouchEvent) => {
  // Local handler - not used during drag (window handlers take over)
  event.preventDefault()
}

const handleTouchEnd = (event: TouchEvent) => {
  // Local handler - not used during drag (window handlers take over)
}

// 🖱️ Mouse Events (데스크톱 지원)
const handleMouseDown = (event: MouseEvent) => {
  event.preventDefault()

  isDragging.value = true
  updatePosition(event.clientX)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  event.preventDefault()

  updatePosition(event.clientX)
}

const handleMouseEnd = (event: MouseEvent) => {
  if (!isDragging.value) return

  event.preventDefault()

  const wasDragging = isDragging.value
  isDragging.value = false

  if (wasDragging) {
    emit('change', localPct.value)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (dragTimeout) {
    clearTimeout(dragTimeout)
    dragTimeout = null
  }

  // Remove global listeners
  window.removeEventListener('touchmove', handleGlobalTouchMove)
  window.removeEventListener('touchend', handleGlobalTouchEnd)
  window.removeEventListener('touchcancel', handleGlobalTouchEnd)

  // Restore scroll in case component unmounts during drag
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
})
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>
