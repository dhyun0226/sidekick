<template>
  <div class="fixed bottom-0 left-0 right-0 z-50">
    <!-- Glassmorphism Container -->
    <div class="max-w-[480px] mx-auto bg-black/80 backdrop-blur-md border-t border-zinc-800 pb-safe">
      
      <!-- Slider Area -->
      <div 
        class="relative h-16 w-full cursor-pointer touch-none select-none"
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
            class="h-full border-r border-zinc-700 last:border-r-0 transition-colors duration-300"
            :class="[
              currentPct >= chapter.start && currentPct < chapter.end ? 'bg-lime-400/20' : 'bg-transparent'
            ]"
          ></div>
        </div>

        <!-- Ruler Ticks -->
        <div class="absolute inset-0 flex items-end justify-between px-4 pb-2 pointer-events-none">
          <div 
            v-for="i in 20" 
            :key="i" 
            class="w-px bg-zinc-700"
            :class="i % 5 === 0 ? 'h-3' : 'h-1.5'"
          ></div>
        </div>

        <!-- Progress Bar (Active) -->
        <div 
          class="absolute bottom-0 left-0 h-1 bg-lime-400 transition-all duration-75 ease-out"
          :style="{ width: `${currentPct}%` }"
        ></div>

        <!-- Thumb / Handle -->
        <div 
          class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center"
          :style="{ left: `${currentPct}%` }"
        >
          <div class="w-5 h-5 rounded-full bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)] ring-2 ring-white/20"></div>
        </div>

        <!-- Tooltip (Visible on Drag) -->
        <div 
          v-if="isDragging"
          class="absolute -top-12 -translate-x-1/2 bg-zinc-800 text-zinc-100 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl border border-zinc-700 whitespace-nowrap pointer-events-none animate-fade-in-up"
          :style="{ left: `${currentPct}%` }"
        >
          <span class="text-lime-400 mr-1">{{ Math.round(currentPct) }}%</span>
          {{ currentChapterName }}
        </div>

      </div>
      
      <!-- Action Bar (Optional, e.g. Write Button) -->
      <div class="flex justify-between items-center px-4 py-3">
        <div class="text-xs text-zinc-500 font-mono">
          {{ currentChapterName }}
        </div>
        <button 
          @click="$emit('write')"
          class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lime-400 hover:bg-zinc-700 transition-colors"
        >
          <PenLine :size="20" />
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PenLine } from 'lucide-vue-next'

interface Chapter {
  title: string
  start: number // 0-100
  end: number   // 0-100
}

const props = defineProps<{
  toc?: Chapter[]
  modelValue: number
}>()

const emit = defineEmits(['update:modelValue', 'change', 'write'])

const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const localPct = ref(props.modelValue)

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

const currentPct = computed(() => isDragging.value ? localPct.value : props.modelValue)

const currentChapterName = computed(() => {
  const pct = currentPct.value
  const found = chapters.value.find(c => pct >= c.start && pct < c.end)
  return found ? found.title : 'End'
})

const updatePosition = (event: PointerEvent) => {
  if (!sliderRef.value) return
  
  const rect = sliderRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
  const pct = (x / rect.width) * 100
  
  localPct.value = pct
  emit('update:modelValue', pct)
}

const handlePointerDown = (event: PointerEvent) => {
  isDragging.value = true
  sliderRef.value?.setPointerCapture(event.pointerId)
  updatePosition(event)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return
  updatePosition(event)
}

const handlePointerUp = (event: PointerEvent) => {
  if (!isDragging.value) return
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
