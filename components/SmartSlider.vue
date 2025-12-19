<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 overflow-visible">
    <!-- Glassmorphism Container -->
    <div class="max-w-[480px] mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-zinc-300 dark:border-zinc-800 pb-safe overflow-visible">

      <!-- Slider Area -->
      <div
        class="relative h-16 w-full cursor-pointer touch-none select-none overflow-visible"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerUp"
        ref="sliderRef"
      >
        <!-- Chapter Backgrounds -->
        <div class="absolute inset-0 flex h-full opacity-30">
          <div
            v-for="(chapter, index) in chapters"
            :key="index"
            :style="{ width: `${chapter.width}%` }"
            class="h-full border-r border-zinc-300 dark:border-zinc-700 last:border-r-0 transition-colors duration-300"
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
          class="absolute bottom-0 left-0 h-1 bg-lime-400 transition-all duration-75 ease-out"
          :style="{ width: `${currentPct}%` }"
        ></div>

        <!-- Thumb / Handle -->
        <div
          class="absolute top-1/2 -translate-y-1/4 -translate-x-1/2 w-11 h-11 flex items-center justify-center"
          :style="{ left: `${currentPct}%` }"
        >
          <div class="w-5 h-5 rounded-full bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)] ring-2 ring-white/20"></div>
        </div>

        <!-- Tooltip (Visible on Drag) -->
        <div
          v-if="isDragging"
          class="absolute -top-12 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl border border-zinc-300 dark:border-zinc-700 whitespace-nowrap pointer-events-none animate-fade-in-up"
          :style="tooltipPositionStyle"
        >
          <span class="text-lime-600 dark:text-lime-400 font-bold mr-1">
            {{ currentPage ? `${currentPage}p` : `${Math.round(currentPct)}%` }}
          </span>
          <span v-if="currentPage" class="text-zinc-500 dark:text-zinc-400 mr-2">({{ Math.round(currentPct) }}%)</span>
          {{ currentChapterName }}
        </div>

      </div>

      <!-- Action Bar (Optional, e.g. Write Button) -->
      <div class="flex justify-between items-center px-4 py-3">
        <div class="text-xs text-zinc-600 dark:text-zinc-500 font-mono">
          {{ currentChapterName }}
        </div>
        <button
          @click="$emit('write')"
          class="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-lime-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          <PenLine :size="20" />
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const emit = defineEmits(['update:modelValue', 'change', 'write'])

const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const localPct = ref(props.modelValue)
const lastPct = ref(props.modelValue) // Track last value for haptic feedback

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
  return Math.round((currentPct.value / 100) * props.totalPages)
})

const currentChapterName = computed(() => {
  const pct = currentPct.value

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

  // If no chapter found and we're before the first chapter, show first chapter name
  if (!found && chapters.value.length > 0) {
    if (pct < chapters.value[0].start) {
      return chapters.value[0].title
    }
  }

  return found ? found.title : 'End'
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
  } else if (pct > 90) {
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
  // Check if Vibration API is available (mobile devices)
  if ('vibrate' in navigator) {
    navigator.vibrate(10) // Light haptic feedback (10ms)
  }
}

const updatePosition = (event: PointerEvent) => {
  if (!sliderRef.value) return

  const rect = sliderRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
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

const handlePointerDown = (event: PointerEvent) => {
  // 브라우저 기본 동작 방지 (뒤로가기 제스처 등)
  event.preventDefault()
  event.stopPropagation()

  isDragging.value = true
  sliderRef.value?.setPointerCapture(event.pointerId)
  updatePosition(event)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return

  // 브라우저 기본 동작 방지
  event.preventDefault()
  event.stopPropagation()

  updatePosition(event)
}

const handlePointerUp = (event: PointerEvent) => {
  if (!isDragging.value) return

  // 브라우저 기본 동작 방지
  event.preventDefault()
  event.stopPropagation()

  isDragging.value = false
  sliderRef.value?.releasePointerCapture(event.pointerId)
  emit('change', localPct.value)
}
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>
