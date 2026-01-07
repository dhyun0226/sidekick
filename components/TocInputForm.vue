<template>
  <div class="space-y-6">
    <!-- Total Pages Input -->
    <div>
      <div class="flex justify-between items-end mb-2">
        <label class="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          전체 페이지 수 <span class="text-red-500">*</span>
        </label>
        <span v-if="totalPages" class="text-[10px] text-lime-600 dark:text-lime-400 font-bold bg-lime-50 dark:bg-lime-900/20 px-1.5 py-0.5 rounded">
          입력 완료
        </span>
      </div>
      <div class="relative">
        <input
          :value="totalPages"
          @input="updateTotalPages"
          @blur="validateTotalPages"
          type="number"
          min="1"
          placeholder="책의 마지막 페이지 번호를 적어주세요"
          class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3.5 pr-16 focus:outline-none focus:ring-2 focus:ring-lime-400 border-none transition-all no-spinner outline-none"
        />
        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold pointer-events-none whitespace-nowrap">쪽까지</span>
      </div>
    </div>

    <!-- Chapters Input -->
    <div>
      <div class="flex justify-between items-center mb-3">
        <label class="text-sm font-bold text-zinc-700 dark:text-zinc-300">챕터 설정 (선택)</label>
        <span class="text-[10px] text-zinc-400 font-medium">진행도를 더 정교하게 관리할 수 있어요</span>
      </div>
      
      <div class="space-y-3">
        <!-- 챕터가 없을 때 -->
        <div v-if="localChapters.length === 0" class="flex flex-col items-center justify-center py-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700/50 group transition-colors hover:border-zinc-300 dark:hover:border-zinc-600">
          <div class="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm mb-3">
            <ListTree :size="20" class="text-zinc-300 group-hover:text-lime-400 transition-colors" />
          </div>
          <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-4 font-medium">챕터를 나누어 읽어볼까요?</p>
          <button
            @click="addChapter"
            type="button"
            class="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95"
          >
            + 첫 챕터 추가하기
          </button>
        </div>

        <!-- 챕터가 있을 때 -->
        <template v-else>
          <div class="max-h-[340px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            <div v-for="(chapter, idx) in localChapters" :key="chapter.id" class="flex items-center gap-1.5 group animate-in slide-in-from-left-2 duration-200 px-0.5">
              
              <!-- Left: Index + Title Box (Flexible) -->
              <div class="flex-1 min-w-0 flex items-center h-11 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-1 transition-all focus-within:ring-2 focus-within:ring-inset focus-within:ring-lime-400">
                <div class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] font-black text-zinc-400 bg-white dark:bg-zinc-700 rounded-lg shadow-sm flex-shrink-0 ml-1">
                  {{ (idx + 1).toString().padStart(2, '0') }}
                </div>
                <input
                  v-model="chapter.title"
                  type="text"
                  placeholder="챕터 제목"
                  class="min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                />
              </div>

              <!-- Right: Page Input Box (Compact on Mobile) -->
              <div class="flex items-center gap-1 px-2 sm:px-3 h-11 bg-zinc-100 dark:bg-zinc-800 rounded-xl transition-all focus-within:ring-2 focus-within:ring-inset focus-within:ring-lime-400 min-w-[85px] sm:min-w-[110px] justify-center flex-shrink-0">
                <input
                  v-model.number="chapter.startPage"
                  type="number"
                  placeholder="0"
                  @blur="validateChapterPage(idx)"
                  class="w-10 sm:w-12 bg-transparent border-none focus:ring-0 text-sm font-black text-center p-0 text-lime-600 dark:text-lime-400 no-spinner outline-none"
                />
                <span class="text-[11px] sm:text-[12px] text-zinc-400 font-bold pointer-events-none whitespace-nowrap">쪽부터</span>
              </div>
              
              <!-- Delete Button -->
              <button
                @click="removeChapter(idx)"
                type="button"
                class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex-shrink-0"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
          
          <button
            @click="addChapter"
            type="button"
            class="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-lime-500 hover:border-lime-200 dark:hover:border-lime-900/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus :size="14" />
            챕터 추가
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Trash2, ListTree, Plus } from 'lucide-vue-next'
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

// Watch props changes (only update if content actually changed)
watch(() => props.chapters, (newChapters) => {
  // Compare content (ignore IDs)
  const currentContent = localChapters.value.map(c => ({ title: c.title, startPage: c.startPage }))
  const newContent = newChapters.map(c => ({ title: c.title, startPage: c.startPage }))

  // Only update if content is different
  if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
    localChapters.value = newChapters.map(c => ({
      id: generateChapterId(),
      title: c.title,
      startPage: c.startPage
    }))
  }
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
  const lastChapter = localChapters.value[localChapters.value.length - 1]
  const nextStartPage = lastChapter ? lastChapter.startPage + 1 : 1

  localChapters.value.push({
    id: generateChapterId(),
    title: `챕터 ${localChapters.value.length + 1}`,
    startPage: nextStartPage
  })
}

const removeChapter = (index: number) => {
  localChapters.value.splice(index, 1)
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

  if (chapter.startPage <= 0) {
    chapter.startPage = idx === 0 ? 1 : localChapters.value[idx - 1].startPage + 1
    toast.error('시작 페이지는 1 이상이어야 합니다.')
    return
  }

  if (idx > 0) {
    const prevChapter = localChapters.value[idx - 1]
    if (chapter.startPage <= prevChapter.startPage) {
      chapter.startPage = prevChapter.startPage + 1
      toast.error('다음 챕터는 이전 챕터보다 뒤에 있어야 합니다.')
      return
    }
  }

  if (props.totalPages && chapter.startPage > props.totalPages) {
    chapter.startPage = props.totalPages
    toast.error(`전체 페이지(${props.totalPages})를 초과할 수 없습니다.`)
  }
}

const validate = (): { valid: boolean; message?: string } => {
  if (!props.totalPages || props.totalPages <= 0) {
    return { valid: false, message: '전체 페이지는 1 이상이어야 합니다.' }
  }

  if (localChapters.value.length === 0) {
    return { valid: true }
  }

  for (let i = 0; i < localChapters.value.length; i++) {
    const chapter = localChapters.value[i]
    if (!chapter.title.trim()) {
      return { valid: false, message: `${i + 1}번째 챕터의 제목을 입력해주세요.` }
    }
    if (chapter.startPage <= 0) {
      return { valid: false, message: `"${chapter.title}" 시작 페이지는 1 이상이어야 합니다.` }
    }
    if (props.totalPages && chapter.startPage > props.totalPages) {
      return { valid: false, message: `"${chapter.title}" 시작 페이지가 전체 페이지를 초과합니다.` }
    }
    if (i > 0) {
      const prevChapter = localChapters.value[i - 1]
      if (chapter.startPage <= prevChapter.startPage) {
        return { valid: false, message: `"${chapter.title}" 시작 페이지는 이전 챕터보다 커야 합니다.` }
      }
    }
  }

  return { valid: true }
}

defineExpose({ validate })
</script>

<style scoped>
/* 숫자 입력창 화살표 제거 */
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3f3f46;
}
</style>