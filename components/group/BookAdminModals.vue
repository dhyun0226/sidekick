<template>
  <div>
    <!-- Edit Dates Modal -->
    <div v-if="editDatesOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditDates')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">독서 기간 수정</h2>
          <button @click="emit('closeEditDates')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">시작일</label>
            <input
              v-model="localStartDate"
              type="date"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">종료일</label>
            <input
              v-model="localEndDate"
              type="date"
              :min="localStartDate"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div v-if="localStartDate && localEndDate" class="p-3 bg-lime-400/10 border border-lime-400/30 rounded-lg">
            <p class="text-sm text-lime-400 text-center">
              💡 {{ calculateDays() }}일 독서 계획
            </p>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="emit('closeEditDates')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="handleSaveDates"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
            :disabled="!localStartDate || !localEndDate"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- Mark Completed Modal -->
    <div v-if="markCompletedOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeMarkCompleted')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">✅ 완주 처리</h2>
          <button @click="emit('closeMarkCompleted')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">정말 이 책을 완주 처리하시겠습니까?</p>
          <div v-if="currentBook" class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
            <p class="font-bold text-zinc-800 dark:text-zinc-200">{{ currentBook.book?.title }}</p>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
          </div>
          <p class="text-sm text-zinc-600 dark:text-zinc-500">완주 처리하면 히스토리로 이동하며, 새로운 책을 시작할 수 있습니다.</p>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="emit('closeMarkCompleted')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="emit('markAsCompleted')"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
          >
            완주 처리
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Book Modal -->
    <div v-if="deleteBookOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeDeleteBook')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-red-400">⚠️ 책 삭제 확인</h2>
          <button @click="emit('closeDeleteBook')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-zinc-700 dark:text-zinc-300">정말 이 책을 삭제하시겠습니까?</p>
          <div v-if="currentBook" class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
            <p class="font-bold text-zinc-800 dark:text-zinc-200">{{ currentBook.book?.title }}</p>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
          </div>
          <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p class="text-sm text-red-400 font-medium mb-2">다음 데이터가 함께 삭제됩니다:</p>
            <ul class="text-sm text-red-400 space-y-1">
              <li>• 모든 멤버의 독서 진행도</li>
              <li>• 이 책의 모든 댓글 ({{ commentCount }}개)</li>
              <li>• 이 책의 모든 반응</li>
            </ul>
          </div>
          <p class="text-sm text-zinc-600 dark:text-zinc-500 font-bold">⚠️ 이 작업은 되돌릴 수 없습니다</p>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="emit('closeDeleteBook')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="emit('deleteBook')"
            class="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Finished Date Modal -->
    <div v-if="editFinishedDateOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditFinishedDate')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">완주 날짜 수정</h2>
          <button @click="emit('closeEditFinishedDate')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <div v-if="currentBook" class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-4">
            <p class="font-bold text-zinc-800 dark:text-zinc-200">{{ currentBook.book?.title }}</p>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">완주 날짜</label>
            <input
              v-model="localFinishedDate"
              type="date"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="emit('closeEditFinishedDate')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="handleSaveFinishedDate"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
            :disabled="!localFinishedDate"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- Edit TOC Modal -->
    <div v-if="editTocOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditToc')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 m-4 shadow-2xl border border-zinc-300 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">📑 목차 수정</h2>
          <button @click="emit('closeEditToc')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <div v-if="currentBook" class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-4">
            <p class="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{{ currentBook.book?.title }}</p>
            <p class="text-xs text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">전체 페이지 수</label>
            <input
              v-model.number="localTotalPages"
              type="number"
              min="1"
              @input="validateTotalPages"
              @blur="validateTotalPages"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">챕터 설정</label>
            <div class="space-y-2">
              <div v-for="(chapter, idx) in localChapters" :key="chapter.id" class="flex gap-2">
                <input
                  v-model="chapter.title"
                  type="text"
                  placeholder="챕터명"
                  required
                  class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <input
                  v-model.number="chapter.startPage"
                  type="number"
                  placeholder="시작 쪽"
                  :min="idx === 0 ? 1 : localChapters[idx - 1].startPage + 1"
                  :max="localTotalPages || undefined"
                  @input="validateChapterPage(idx)"
                  @blur="validateChapterPage(idx)"
                  class="w-20 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <button
                  @click="removeChapter(idx)"
                  class="text-zinc-600 dark:text-zinc-500 hover:text-red-400 px-2"
                  :disabled="localChapters.length === 1"
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
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="emit('closeEditToc')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            @click="handleSaveToc"
            class="flex-1 bg-lime-400 text-black font-bold py-3 rounded-xl hover:bg-lime-300 transition-colors"
            :disabled="!localTotalPages || localTotalPages <= 0"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

interface Props {
  editDatesOpen: boolean
  editTocOpen: boolean
  markCompletedOpen: boolean
  deleteBookOpen: boolean
  editFinishedDateOpen: boolean
  currentBook: any | null
  commentCount: number
}

interface Emits {
  (e: 'closeEditDates'): void
  (e: 'closeEditToc'): void
  (e: 'closeMarkCompleted'): void
  (e: 'closeDeleteBook'): void
  (e: 'closeEditFinishedDate'): void
  (e: 'saveEditedDates', payload: { startDate: string, endDate: string }): void
  (e: 'saveEditedToc', payload: { totalPages: number, chapters: any[] }): void
  (e: 'saveEditedFinishedDate', finishedDate: string): void
  (e: 'markAsCompleted'): void
  (e: 'deleteBook'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toast = useToastStore()

// Edit Dates
const localStartDate = ref('')
const localEndDate = ref('')

watch(() => props.editDatesOpen, (isOpen) => {
  if (isOpen && props.currentBook) {
    localStartDate.value = props.currentBook.target_start_date || ''
    localEndDate.value = props.currentBook.target_end_date || ''
  }
})

const calculateDays = () => {
  if (!localStartDate.value || !localEndDate.value) return 0
  const start = new Date(localStartDate.value)
  const end = new Date(localEndDate.value)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const handleSaveDates = () => {
  emit('saveEditedDates', {
    startDate: localStartDate.value,
    endDate: localEndDate.value
  })
}

// Edit Finished Date
const localFinishedDate = ref('')

watch(() => props.editFinishedDateOpen, (isOpen) => {
  if (isOpen && props.currentBook) {
    const finishedAt = props.currentBook.finished_at
    if (finishedAt) {
      // Convert timestamp to YYYY-MM-DD format for date input
      const date = new Date(finishedAt)
      localFinishedDate.value = date.toISOString().split('T')[0]
    } else {
      localFinishedDate.value = ''
    }
  }
})

const handleSaveFinishedDate = () => {
  emit('saveEditedFinishedDate', localFinishedDate.value)
}

// Edit TOC
// 간단하고 안전한 고유 ID 생성
const generateChapterId = () => `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const localTotalPages = ref<number | null>(null)
const localChapters = ref<{ id: string; title: string; startPage: number }[]>([{
  id: generateChapterId(),
  title: 'Chapter 1',
  startPage: 1
}])

watch([() => props.editTocOpen, () => props.currentBook], ([isOpen, currentBook]) => {
  if (isOpen && currentBook) {
    localTotalPages.value = currentBook.book?.total_pages || null

    if (currentBook.toc_snapshot && currentBook.toc_snapshot.length > 0) {
      const totalPages = localTotalPages.value || 100
      localChapters.value = currentBook.toc_snapshot.map((c: any) => ({
        id: generateChapterId(),
        title: c.title,
        startPage: Math.round((c.start / 100) * totalPages)
      }))
    } else {
      localChapters.value = [{
        id: generateChapterId(),
        title: 'Chapter 1',
        startPage: 1
      }]
    }
  }
})

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
  if (localChapters.value.length > 1) {
    localChapters.value.splice(index, 1)
  }
}

// Validation functions
const validateTotalPages = () => {
  if (localTotalPages.value !== null && localTotalPages.value <= 0) {
    localTotalPages.value = 1
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
  if (localTotalPages.value && chapter.startPage > localTotalPages.value) {
    chapter.startPage = localTotalPages.value
    toast.error(`전체 페이지(${localTotalPages.value})를 초과할 수 없습니다.`)
  }
}

const handleSaveToc = () => {
  // 유효성 검사
  const totalPages = localTotalPages.value!

  // 1. 전체 페이지 수 검사
  if (!totalPages || totalPages <= 0) {
    toast.error('전체 페이지는 1 이상이어야 합니다.')
    return
  }

  // 2. 챕터별 검사
  for (let i = 0; i < localChapters.value.length; i++) {
    const chapter = localChapters.value[i]

    // 챕터명이 비어있으면 안됨
    if (!chapter.title.trim()) {
      toast.error(`${i + 1}번째 챕터의 제목을 입력해주세요.`)
      return
    }

    // 페이지 번호가 0보다 커야 함
    if (chapter.startPage <= 0) {
      toast.error(`"${chapter.title}" 시작 페이지는 1 이상이어야 합니다.`)
      return
    }

    // 페이지 번호가 전체 페이지 수 이하여야 함
    if (chapter.startPage > totalPages) {
      toast.error(`"${chapter.title}" 시작 페이지(${chapter.startPage})가 전체 페이지(${totalPages})를 초과합니다.`)
      return
    }

    // 다음 챕터의 시작 페이지가 이전 챕터보다 커야 함
    if (i > 0) {
      const prevChapter = localChapters.value[i - 1]
      if (chapter.startPage <= prevChapter.startPage) {
        toast.error(`"${chapter.title}" 시작 페이지(${chapter.startPage})는 이전 챕터(${prevChapter.startPage})보다 커야 합니다.`)
        return
      }
    }
  }

  // 유효성 검사 통과 (ID는 제외하고 전송)
  emit('saveEditedToc', {
    totalPages: localTotalPages.value!,
    chapters: localChapters.value.map(c => ({
      title: c.title,
      startPage: c.startPage
    }))
  })
}
</script>
