<template>
  <div class="fixed bottom-0 left-0 right-0 z-[9998] overflow-visible">
    <!-- Glassmorphism Container (Minimal) -->
    <div class="max-w-[480px] mx-auto pb-safe overflow-visible">
      <!-- Gradient Fade from Content -->
      <div class="h-12 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"></div>

      <div class="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-white/5 px-6 pt-2 pb-8 sm:pb-6 relative">
        
        <!-- Chapter Name & Write Button Row -->
        <div class="flex justify-between items-end mb-6 px-1">
          <div class="flex flex-col min-w-0 pr-4">
            <span class="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">지금 읽는 곳</span>
            <span class="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate leading-tight">
              {{ currentChapterName || '읽기 시작' }}
            </span>
          </div>
          
          <button
            @click="$emit('write')"
            class="flex items-center gap-2 pl-3 pr-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zinc-500/20"
          >
            <PenLine :size="14" />
            <span class="text-xs font-bold">기록</span>
          </button>
        </div>

        <!-- Interactive Slider Area -->
        <div class="relative h-12 w-full flex items-center">
          <!-- Native Input (Hidden Logic) -->
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            v-model.number="localPct"
            @input="handleInput"
            @change="handleChange"
            @touchstart="handleTouchStart"
            @mousedown="handleMouseDown"
            class="absolute -top-4 left-0 right-0 w-full h-20 opacity-0 cursor-pointer z-30"
            style="touch-action: none;"
          />

          <!-- Track Background -->
          <div class="absolute w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <!-- Chapter Segments (Subtle) -->
            <div
              v-for="(chapter, index) in chapters"
              :key="index"
              :style="{ left: `${chapter.start}%`, width: `${chapter.width}%` }"
              class="absolute h-full border-r border-white dark:border-zinc-900/50 opacity-100"
            ></div>
          </div>

          <!-- Progress Bar -->
          <div
            class="absolute left-0 h-2 bg-zinc-900 dark:bg-white rounded-full pointer-events-none transition-all duration-75 ease-out"
            :style="{ width: `${currentPct}%` }"
          ></div>

          <!-- Member Avatars (Floating above) -->
          <div class="absolute inset-0 pointer-events-none z-10">
            <div
              v-for="member in members"
              :key="member.id"
              class="absolute top-1/2 -translate-y-1/2 -ml-3 transition-all duration-500"
              :style="{ left: `${member.progress}%` }"
            >
              <div class="relative -top-8 flex flex-col items-center">
                <Avatar
                  :src="member.avatar_url"
                  :fallback="member.nickname || 'U'"
                  size="xs"
                  :alt="member.nickname"
                  className="w-6 h-6 border-2 border-white dark:border-zinc-900 shadow-sm"
                />
                <!-- Indicator Line -->
                <div class="h-2 w-px bg-zinc-300 dark:bg-zinc-700 mt-1"></div>
              </div>
            </div>
          </div>

          <!-- Handle (Minimal Circle) -->
          <div
            class="absolute top-1/2 -translate-y-1/2 -ml-3 z-20 pointer-events-none transition-all duration-75 ease-out"
            :style="{ left: `${currentPct}%` }"
          >
            <div 
              class="w-6 h-6 bg-white dark:bg-zinc-900 border-[1.5px] border-zinc-200 dark:border-zinc-700 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center transform transition-transform"
              :class="{ 'scale-125 border-zinc-900 dark:border-white': isDragging }"
            >
              <div class="w-1.5 h-1.5 bg-zinc-900 dark:bg-white rounded-full"></div>
            </div>
          </div>

          <!-- Floating Tooltip (Only when dragging) -->
          <div
            v-if="isDragging"
            class="absolute -top-16 left-0 -ml-8 bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-2xl shadow-xl flex flex-col items-center min-w-[64px] animate-in fade-in slide-in-from-bottom-2 duration-200"
            :style="{ left: `${currentPct}%` }"
          >
            <span class="text-sm font-black font-mono leading-none">{{ Math.round(currentPct) }}%</span>
            <span v-if="currentPage" class="text-[10px] font-medium opacity-80 leading-none mt-1">p.{{ currentPage }}</span>
            <!-- Arrow -->
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-white rotate-45"></div>
          </div>
        </div>

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

const emit = defineEmits(['update:modelValue', 'change', 'write', 'dragging'])

const rangeInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const localPct = ref(props.modelValue)
const lastPct = ref(props.modelValue)

// Sync localPct with external modelValue changes
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

const currentPct = computed(() => localPct.value)

const currentPage = computed(() => {
  if (!props.totalPages) return null
  return Math.max(1, Math.round((currentPct.value / 100) * props.totalPages))
})

const currentChapterName = computed(() => {
  const pct = currentPct.value

  if (!props.toc || props.toc.length === 0) {
    return ''
  }

  const found = chapters.value.find((c, index) => {
    const isLast = index === chapters.value.length - 1
    if (isLast) {
      return pct >= c.start && pct <= c.end
    } else {
      return pct >= c.start && pct < c.end
    }
  })

  return found ? found.title : ''
})

// Dynamic tooltip positioning to prevent clipping at edges
const tooltipPositionStyle = computed(() => {
  const pct = currentPct.value

  if (pct < 10) {
    return {
      left: `${pct}%`,
      transform: 'translateX(0)',
      right: 'auto'
    }
  } else if (pct > 50) {
    return {
      right: `${100 - pct}%`,
      transform: 'translateX(0)',
      left: 'auto'
    }
  } else {
    return {
      left: `${pct}%`,
      transform: 'translateX(-50%)',
      right: 'auto'
    }
  }
})

// Haptic feedback function
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(25)
  }
}

// Handle touch/mouse start - mark as dragging
const handleTouchStart = () => {
  isDragging.value = true
  emit('dragging', true) // Tell parent to block Timeline

  // 🔥 핵심: body 스크롤 완전 차단 (iOS 모멘텀 스크롤 방지)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  }
}

const handleMouseDown = () => {
  isDragging.value = true
  emit('dragging', true) // Tell parent to block Timeline

  // Desktop도 동일하게 차단
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

// Handle input event (fires during drag)
const handleInput = () => {
  // Trigger haptic on value change
  if (localPct.value !== lastPct.value) {
    triggerHaptic()
    lastPct.value = localPct.value
  }

  // Emit update during drag for real-time scroll
  // Parent should throttle this to prevent excessive data loading
  emit('update:modelValue', localPct.value)
}

// Handle change event (fires when drag ends)
const handleChange = () => {
  isDragging.value = false
  emit('dragging', false) // Tell parent to unblock Timeline

  // 🔥 body 스크롤 복구
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }

  // Now emit final value - Timeline will scroll
  emit('update:modelValue', localPct.value)
  emit('change', localPct.value)
}
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

/* Hide native range input slider appearance */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
}

/* Remove default track */
input[type="range"]::-webkit-slider-track {
  background: transparent;
  border: none;
}

input[type="range"]::-moz-range-track {
  background: transparent;
  border: none;
}

/* Remove default thumb */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 44px;
  height: 64px;
  background: transparent;
  cursor: pointer;
  border: none;
}

input[type="range"]::-moz-range-thumb {
  width: 44px;
  height: 64px;
  background: transparent;
  cursor: pointer;
  border: none;
}
</style>
