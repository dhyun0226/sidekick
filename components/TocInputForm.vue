<template>
  <div class="space-y-4">
    <!-- Total Pages Input -->
    <div>
      <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">전체 페이지 수</label>
      <input
        :value="totalPages"
        @input="updateTotalPages"
        @blur="validateTotalPages"
        type="number"
        min="1"
        placeholder="예: 300"
        class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
      />
    </div>

    <!-- Chapters Input -->
    <div>
      <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">챕터 설정 (선택사항)</label>
      <div class="space-y-2">
        <!-- 챕터가 없을 때 -->
        <div v-if="localChapters.length === 0" class="text-center py-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">목차가 없는 책입니다</p>
          <button
            @click="addChapter"
            class="text-sm text-lime-400 font-medium hover:underline"
          >
            + 챕터 추가
          </button>
        </div>

        <!-- 챕터가 있을 때 -->
        <template v-else>
          <div v-for="(chapter, idx) in localChapters" :key="chapter.id" class="flex gap-2">
            <input
              v-model="chapter.title"
              type="text"
              placeholder="챕터명"
              class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            <input
              v-model.number="chapter.startPage"
              type="number"
              placeholder="시작 쪽"
              :min="idx === 0 ? 1 : localChapters[idx - 1].startPage + 1"
              :max="totalPages || undefined"
              @blur="validateChapterPage(idx)"
              class="w-20 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            <button
              @click="removeChapter(idx)"
              class="text-zinc-600 dark:text-zinc-500 hover:text-red-400 px-2"
            >
              <X :size="18" />
            </button>
          </div>
          <button
            @click="addChapter"
            class="text-sm text-lime-400 font-medium hover:underline"
          >
            + 챕터 추가
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

interface Chapter {
  id: string
  title: string
  startPage: number
}

interface Props {
  totalPages: number | null
  chapters: { title: string; startPage: number }[]
}

interface Emits {
  (e: 'update:totalPages', value: number | null): void
  (e: 'update:chapters', value: { title: string; startPage: number }[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToastStore()

// 간단하고 안전한 고유 ID 생성
const generateChapterId = () => `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Local state with IDs for v-for key
const localChapters = ref<Chapter[]>(
  props.chapters.map(c => ({
    id: generateChapterId(),
    title: c.title,
    startPage: c.startPage
  }))
)

// Watch props changes
watch(() => props.chapters, (newChapters) => {
  localChapters.value = newChapters.map(c => ({
    id: generateChapterId(),
    title: c.title,
    startPage: c.startPage
  }))
}, { deep: true })

// Watch local changes and emit
watch(localChapters, (newValue) => {
  emit('update:chapters', newValue.map(c => ({
    title: c.title,
    startPage: c.startPage
  })))
}, { deep: true })

const updateTotalPages = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  emit('update:totalPages', value ? parseInt(value) : null)
}

const addChapter = () => {
  // 마지막 챕터의 다음 페이지를 기본값으로 설정
  const lastChapter = localChapters.value[localChapters.value.length - 1]
  const nextStartPage = lastChapter ? lastChapter.startPage + 1 : 1

  localChapters.value.push({
    id: generateChapterId(),
    title: `Chapter ${localChapters.value.length + 1}`,
    startPage: nextStartPage
  })
}

const removeChapter = (index: number) => {
  localChapters.value.splice(index, 1)  // 제한 없이 삭제 가능 (0개까지)
}

// Validation functions
const validateTotalPages = () => {
  if (props.totalPages !== null && props.totalPages <= 0) {
    emit('update:totalPages', 1)
    toast.error('전체 페이지는 1 이상이어야 합니다.')
  }
}

const validateChapterPage = (idx: number) => {
  const chapter = localChapters.value[idx]

  // 0 이하면 최소값으로 설정
  if (chapter.startPage <= 0) {
    chapter.startPage = idx === 0 ? 1 : localChapters.value[idx - 1].startPage + 1
    toast.error('시작 페이지는 1 이상이어야 합니다.')
    return
  }

  // 이전 챕터보다 작거나 같으면 이전 챕터 + 1로 설정
  if (idx > 0) {
    const prevChapter = localChapters.value[idx - 1]
    if (chapter.startPage <= prevChapter.startPage) {
      chapter.startPage = prevChapter.startPage + 1
      toast.error('다음 챕터는 이전 챕터보다 뒤에 있어야 합니다.')
      return
    }
  }

  // 전체 페이지를 초과하면 전체 페이지로 설정
  if (props.totalPages && chapter.startPage > props.totalPages) {
    chapter.startPage = props.totalPages
    toast.error(`전체 페이지(${props.totalPages})를 초과할 수 없습니다.`)
  }
}

// Expose validation function for parent components
const validate = (): { valid: boolean; message?: string } => {
  // 1. 전체 페이지 수 검사
  if (!props.totalPages || props.totalPages <= 0) {
    return { valid: false, message: '전체 페이지는 1 이상이어야 합니다.' }
  }

  // 2. 챕터가 0개면 OK (목차 없는 책)
  if (localChapters.value.length === 0) {
    return { valid: true }
  }

  // 3. 챕터가 있으면 검사
  for (let i = 0; i < localChapters.value.length; i++) {
    const chapter = localChapters.value[i]

    // 챕터명이 비어있으면 안됨
    if (!chapter.title.trim()) {
      return { valid: false, message: `${i + 1}번째 챕터의 제목을 입력해주세요.` }
    }

    // 페이지 번호가 0보다 커야 함
    if (chapter.startPage <= 0) {
      return { valid: false, message: `"${chapter.title}" 시작 페이지는 1 이상이어야 합니다.` }
    }

    // 페이지 번호가 전체 페이지 수 이하여야 함
    if (chapter.startPage > props.totalPages) {
      return { valid: false, message: `"${chapter.title}" 시작 페이지(${chapter.startPage})가 전체 페이지(${props.totalPages})를 초과합니다.` }
    }

    // 다음 챕터의 시작 페이지가 이전 챕터보다 커야 함
    if (i > 0) {
      const prevChapter = localChapters.value[i - 1]
      if (chapter.startPage <= prevChapter.startPage) {
        return { valid: false, message: `"${chapter.title}" 시작 페이지(${chapter.startPage})는 이전 챕터(${prevChapter.startPage})보다 커야 합니다.` }
      }
    }
  }

  return { valid: true }
}

defineExpose({ validate })
</script>
