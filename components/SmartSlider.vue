<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 overflow-visible">
    <!-- Glassmorphism Container -->
    <div class="max-w-[480px] mx-auto bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-zinc-300 dark:border-zinc-800 pb-safe overflow-visible">

      <!-- Slider Area Wrapper with Padding -->
      <div class="px-4 py-4">
        <!-- Native Range Input (hidden, controls logic) -->
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          v-model.number="localPct"
          @input="handleInput"
          @change="handleChange"
          ref="rangeInput"
          class="absolute opacity-0 w-full h-16 cursor-pointer"
          style="top: 0; left: 0; z-index: 20;"
        />

        <!-- Visual Slider (styled) -->
        <div class="relative h-16 w-full pointer-events-none">
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
              class="absolute top-0 -translate-x-1/2 translate-y-2 flex flex-col items-center transition-all duration-500"
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
      <div class="flex justify-between items-center px-4 py-5 gap-4">
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

// Handle input event (fires during drag)
const handleInput = () => {
  // Detect drag start
  if (!isDragging.value) {
    isDragging.value = true
  }

  // Trigger haptic on value change
  if (localPct.value !== lastPct.value) {
    triggerHaptic()
    lastPct.value = localPct.value
  }

  // Emit to parent (triggers Timeline scroll in real-time)
  emit('update:modelValue', localPct.value)
}

// Handle change event (fires when drag ends)
const handleChange = () => {
  isDragging.value = false
  emit('change', localPct.value)
}

// Track mouse/touch events for isDragging state
if (typeof window !== 'undefined') {
  let dragCheckTimer: NodeJS.Timeout | null = null

  const resetDragging = () => {
    if (dragCheckTimer) clearTimeout(dragCheckTimer)
    dragCheckTimer = setTimeout(() => {
      isDragging.value = false
    }, 100)
  }

  // These events help track drag state more accurately
  if (rangeInput.value) {
    rangeInput.value.addEventListener('mousedown', () => {
      isDragging.value = true
    })
    rangeInput.value.addEventListener('touchstart', () => {
      isDragging.value = true
    })
    rangeInput.value.addEventListener('mouseup', resetDragging)
    rangeInput.value.addEventListener('touchend', resetDragging)
  }
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
