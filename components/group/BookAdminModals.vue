<template>
  <div>
    <!-- Edit Dates Modal -->
    <div v-if="editDatesOpen" class="fixed inset-0 z-[100010] flex items-center justify-center">
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
            <div class="overflow-hidden rounded-xl">
              <input
                v-model="localStartDate"
                type="date"
                class="w-full min-w-0 box-border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">종료일</label>
            <div class="overflow-hidden rounded-xl">
              <input
                v-model="localEndDate"
                type="date"
                :min="localStartDate"
                class="w-full min-w-0 box-border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
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
    <div v-if="markCompletedOpen" class="fixed inset-0 z-[100010] flex items-center justify-center">
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
            <div class="flex items-center gap-2 mt-1">
              <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
              <GenreBadge v-if="currentBook.book?.official_genre || currentBook.book?.draft_genre" :genre="currentBook.book?.official_genre || currentBook.book?.draft_genre" size="sm" />
            </div>
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
    <div v-if="deleteBookOpen" class="fixed inset-0 z-[100010] flex items-center justify-center">
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
            <div class="flex items-center gap-2 mt-1">
              <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
              <GenreBadge v-if="currentBook.book?.official_genre || currentBook.book?.draft_genre" :genre="currentBook.book?.official_genre || currentBook.book?.draft_genre" size="sm" />
            </div>
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
    <div v-if="editFinishedDateOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditFinishedDate')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-zinc-300 dark:border-zinc-800">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">완주 날짜 수정</h2>
          <button @click="emit('closeEditFinishedDate')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-4">
          <div v-if="currentBook" class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-4">
            <p class="font-bold text-zinc-800 dark:text-zinc-200">{{ currentBook.book?.title }}</p>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-sm text-zinc-600 dark:text-zinc-400">{{ currentBook.book?.author }}</p>
              <GenreBadge v-if="currentBook.book?.official_genre || currentBook.book?.draft_genre" :genre="currentBook.book?.official_genre || currentBook.book?.draft_genre" size="sm" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">완주 날짜</label>
            <div class="overflow-hidden rounded-xl">
              <input
                v-model="localFinishedDate"
                type="date"
                class="w-full min-w-0 box-border bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
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
    <div v-if="editTocOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditToc')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white dark:bg-zinc-900 z-10 flex justify-between items-center p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">📑 목차 수정</h2>
          <button @click="emit('closeEditToc')" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex-shrink-0">
            <X :size="24" />
          </button>
        </div>

        <div class="p-6 pt-4 space-y-4">
          <div v-if="currentBook" class="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
            <p class="font-bold text-zinc-800 dark:text-zinc-200 text-sm break-words">{{ currentBook.book?.title }}</p>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-xs text-zinc-600 dark:text-zinc-400 break-words">{{ currentBook.book?.author }}</p>
              <GenreBadge v-if="currentBook.book?.official_genre || currentBook.book?.draft_genre" :genre="currentBook.book?.official_genre || currentBook.book?.draft_genre" size="sm" />
            </div>
          </div>

          <!-- TOC Input Form (공통 컴포넌트) -->
          <TocInputForm
            ref="tocFormRef"
            v-model:totalPages="localTotalPages"
            v-model:chapters="localChapters"
          />
          <div class="flex gap-3 pt-2">
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocInputForm from '~/components/TocInputForm.vue'

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

// Helper function to get local date string (YYYY-MM-DD) without timezone conversion
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Edit Finished Date
const localFinishedDate = ref('')

watch(() => props.editFinishedDateOpen, (isOpen) => {
  if (isOpen && props.currentBook) {
    const finishedAt = props.currentBook.finished_at
    if (finishedAt) {
      // Convert timestamp to YYYY-MM-DD format for date input
      const date = new Date(finishedAt)
      localFinishedDate.value = getLocalDateString(date)
    } else {
      localFinishedDate.value = ''
    }
  }
})

const handleSaveFinishedDate = () => {
  emit('saveEditedFinishedDate', localFinishedDate.value)
}

// Edit TOC
const localTotalPages = ref<number | null>(null)
const localChapters = ref<{ title: string; startPage: number }[]>([])

// TocInputForm ref for validation
const tocFormRef = ref<InstanceType<typeof TocInputForm> | null>(null)

watch([() => props.editTocOpen, () => props.currentBook], ([isOpen, currentBook]) => {
  if (isOpen && currentBook) {
    localTotalPages.value = currentBook.book?.total_pages || null

    if (currentBook.toc_snapshot && currentBook.toc_snapshot.length > 0) {
      const totalPages = localTotalPages.value || 100
      localChapters.value = currentBook.toc_snapshot.map((c: any) => ({
        title: c.title,
        startPage: Math.round((c.start / 100) * totalPages)
      }))
    } else {
      localChapters.value = []
    }
  }
})

const handleSaveToc = () => {
  // Validate using TocInputForm
  if (!tocFormRef.value) return

  const validation = tocFormRef.value.validate()
  if (!validation.valid) {
    toast.error(validation.message || '목차 정보를 확인해주세요.')
    return
  }

  // Validation passed, emit save event
  emit('saveEditedToc', {
    totalPages: localTotalPages.value!,
    chapters: localChapters.value
  })
}
</script>
