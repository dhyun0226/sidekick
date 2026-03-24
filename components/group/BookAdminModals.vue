<template>
  <div>
    <!-- Edit Dates Modal -->
    <div v-if="editDatesOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditDates')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] animate-in fade-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">독서 기간 수정</h2>
          <button @click="emit('closeEditDates')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-6">
          <!-- Book Preview (Unified Style) -->
          <div v-if="currentBook" class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="currentBook.book?.cover_url"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ currentBook.book?.title }}</h3>
              <div class="flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span class="truncate max-w-[100px]">{{ currentBook.book?.author }}</span>
                <template v-if="currentBook.book?.publisher || currentBook.total_pages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="currentBook.book?.publisher" class="truncate max-w-[80px]">{{ currentBook.book?.publisher }}</span>
                  <span v-if="currentBook.book?.publisher && currentBook.total_pages">·</span>
                  <span v-if="currentBook.total_pages">{{ currentBook.total_pages }}p</span>
                </template>
                <template v-if="currentBook.genre">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <GenreBadge :genre="currentBook.genre" size="sm" />
                </template>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase">시작일</label>
                <input
                  v-model="localStartDate"
                  type="date"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 border-none [color-scheme:light] dark:[color-scheme:dark] transition-all"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase">종료일</label>
                <input
                  v-model="localEndDate"
                  type="date"
                  :min="localStartDate"
                  class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 border-none [color-scheme:light] dark:[color-scheme:dark] transition-all"
                />
              </div>
            </div>

            <div v-if="localStartDate && localEndDate" class="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar :size="16" class="text-lime-500" />
                </div>
                <span class="text-sm font-bold text-zinc-700 dark:text-zinc-300">총 독서 기간</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-lg font-black text-lime-600 dark:text-lime-400">{{ calculateDays() }}</span>
                <span class="text-sm font-bold text-zinc-400">일</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="emit('closeEditDates')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            @click="handleSaveDates"
            class="flex-[2] bg-lime-400 text-black font-bold py-4 rounded-2xl hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            :disabled="!localStartDate || !localEndDate || isSavingDates"
          >
            <div v-if="isSavingDates" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span v-else>변경사항 저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mark Completed Modal -->
    <div v-if="markCompletedOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeMarkCompleted')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        <!-- Close Button -->
        <div class="absolute top-4 right-4 z-20">
          <button @click="emit('closeMarkCompleted')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="20" />
          </button>
        </div>

        <div class="text-center mb-8 pt-4">
          <h2 class="text-xl font-black text-zinc-900 dark:text-white mb-1.5">{{ props.isSolo ? '완독' : '종료' }} 처리하시겠습니까?</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">
            {{ props.isSolo ? '다 읽은 이 책을 책장으로 옮깁니다.' : '목표를 달성한 이 책을 서재로 옮깁니다.' }}
          </p>
        </div>
        
        <div class="space-y-6">
          <!-- Book Preview (Unified Style) -->
          <div v-if="currentBook" class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="currentBook.book?.cover_url"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center text-left">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ currentBook.book?.title }}</h3>
              <div class="flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 font-medium leading-none">
                <span class="truncate max-w-[80px]">{{ currentBook.book?.author }}</span>
                <template v-if="currentBook.book?.publisher || currentBook.total_pages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="currentBook.book?.publisher" class="truncate max-w-[60px]">{{ currentBook.book?.publisher }}</span>
                  <span v-if="currentBook.book?.publisher && currentBook.total_pages">·</span>
                  <span v-if="currentBook.total_pages">{{ currentBook.total_pages }}p</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="emit('closeMarkCompleted')"
            class="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            @click="isMarkingCompleted = true; emit('markAsCompleted')"
            :disabled="isMarkingCompleted"
            class="flex-[2] py-4 bg-lime-400 text-black font-black rounded-2xl hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <div v-if="isMarkingCompleted" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span v-else>{{ props.isSolo ? '완독 완료' : '종료 완료' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Book Modal -->
    <div v-if="deleteBookOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeDeleteBook')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] animate-in fade-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-red-600 dark:text-red-400">책 삭제</h2>
          <button @click="emit('closeDeleteBook')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-6">
          <div v-if="currentBook" class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="currentBook.book?.cover_url"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ currentBook.book?.title }}</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{{ currentBook.book?.author }}</p>
            </div>
          </div>

          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
            <p class="text-sm text-red-700 dark:text-red-400 font-bold mb-2">이 책을 삭제하시겠습니까?</p>
            <ul class="text-xs text-red-600 dark:text-red-400/80 space-y-1 opacity-90">
              <li>• 그룹 책장에서 제거됩니다.</li>
              <li>• 멤버들의 프로필 서재에서 숨겨집니다.</li>
              <li>• 기록(댓글, 리뷰)은 보존됩니다.</li>
            </ul>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="emit('closeDeleteBook')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            @click="isDeletingBook = true; emit('deleteBook')"
            :disabled="isDeletingBook"
            class="flex-[2] bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <div v-if="isDeletingBook" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span v-else>삭제</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Finished Date Modal -->
    <div v-if="editFinishedDateOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditFinishedDate')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] animate-in fade-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">{{ props.isSolo ? '완독' : '종료' }} 날짜 수정</h2>
          <button @click="emit('closeEditFinishedDate')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="24" />
          </button>
        </div>

        <div class="space-y-6">
          <div v-if="currentBook" class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="currentBook.book?.cover_url"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ currentBook.book?.title }}</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{{ currentBook.book?.author }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 ml-1 uppercase">{{ props.isSolo ? '완독' : '종료' }} 날짜</label>
            <input
              v-model="localFinishedDate"
              type="date"
              class="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 border-none [color-scheme:light] dark:[color-scheme:dark] transition-all"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button
            @click="emit('closeEditFinishedDate')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            @click="handleSaveFinishedDate"
            class="flex-[2] bg-lime-400 text-black font-bold py-4 rounded-2xl hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            :disabled="!localFinishedDate || isSavingFinishedDate"
          >
            <div v-if="isSavingFinishedDate" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span v-else>날짜 저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit TOC Modal -->
    <div v-if="editTocOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('closeEditToc')"></div>
      <div class="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div class="sticky top-0 bg-white dark:bg-zinc-900 z-10 flex justify-between items-center p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">목차 수정</h2>
          <button @click="emit('closeEditToc')" class="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X :size="24" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div v-if="currentBook" class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <img
              :src="currentBook.book?.cover_url"
              class="w-12 h-16 object-cover shadow-md bg-zinc-200 dark:bg-zinc-700"
            />
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <h3 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 truncate">{{ currentBook.book?.title }}</h3>
              <div class="flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span class="truncate max-w-[100px]">{{ currentBook.book?.author }}</span>
                <template v-if="currentBook.book?.publisher || localTotalPages">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <span v-if="currentBook.book?.publisher" class="truncate max-w-[80px]">{{ currentBook.book?.publisher }}</span>
                  <span v-if="currentBook.book?.publisher && localTotalPages">·</span>
                  <span v-if="localTotalPages">{{ localTotalPages }}p</span>
                </template>
                <template v-if="currentBook.genre">
                  <span class="text-zinc-300 dark:text-zinc-700">·</span>
                  <GenreBadge :genre="currentBook.genre" size="sm" />
                </template>
              </div>
            </div>
          </div>

          <!-- TOC Input Form -->
          <TocInputForm
            ref="tocFormRef"
            v-model:totalPages="localTotalPages"
            v-model:chapters="localChapters"
          />
        </div>

        <div class="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-3">
          <button
            @click="emit('closeEditToc')"
            class="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            취소
          </button>
          <button
            @click="handleSaveToc"
            class="flex-[2] bg-lime-400 text-black font-bold py-4 rounded-2xl hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            :disabled="!localTotalPages || localTotalPages <= 0 || isSavingToc"
          >
            <div v-if="isSavingToc" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span v-else>수정 완료</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Genre Modal -->
    <EditGenreModal
      :isOpen="editGenreOpen"
      :currentGenre="currentBook?.genre_snapshot || currentBook?.book?.official_genre || currentBook?.book?.draft_genre"
      @close="emit('closeEditGenre')"
      @save="(genre) => emit('saveEditedGenre', genre)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Calendar, CheckCircle2 } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'
import TocInputForm from '~/components/TocInputForm.vue'
import GenreBadge from '~/components/GenreBadge.vue'
import EditGenreModal from '~/components/admin/EditGenreModal.vue'

interface Props {
  editDatesOpen: boolean
  editTocOpen: boolean
  editGenreOpen: boolean
  markCompletedOpen: boolean
  deleteBookOpen: boolean
  editFinishedDateOpen: boolean
  currentBook: any | null
  commentCount: number
  isSolo?: boolean // 내 서재인 경우 true (종료 → 완독 용어 변경)
}

interface Emits {
  (e: 'closeEditDates'): void
  (e: 'closeEditToc'): void
  (e: 'closeEditGenre'): void
  (e: 'closeMarkCompleted'): void
  (e: 'closeDeleteBook'): void
  (e: 'closeEditFinishedDate'): void
  (e: 'saveEditedDates', payload: { startDate: string, endDate: string }): void
  (e: 'saveEditedToc', payload: { totalPages: number, chapters: any[] }): void
  (e: 'saveEditedGenre', genre: string): void
  (e: 'saveEditedFinishedDate', finishedDate: string): void
  (e: 'markAsCompleted'): void
  (e: 'deleteBook'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const toast = useToastStore()

const isSavingDates = ref(false)
const isSavingToc = ref(false)
const isSavingFinishedDate = ref(false)
const isMarkingCompleted = ref(false)
const isDeletingBook = ref(false)

// Edit Dates
const localStartDate = ref('')
const localEndDate = ref('')

watch(() => props.editDatesOpen, (isOpen) => {
  if (isOpen && props.currentBook) {
    localStartDate.value = props.currentBook.target_start_date || ''
    localEndDate.value = props.currentBook.target_end_date || ''
  }
  if (!isOpen) isSavingDates.value = false
})

watch(() => props.markCompletedOpen, (isOpen) => {
  if (!isOpen) isMarkingCompleted.value = false
})

watch(() => props.deleteBookOpen, (isOpen) => {
  if (!isOpen) isDeletingBook.value = false
})

const calculateDays = () => {
  if (!localStartDate.value || !localEndDate.value) return 0
  const start = new Date(localStartDate.value)
  const end = new Date(localEndDate.value)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const handleSaveDates = () => {
  if (isSavingDates.value) return
  isSavingDates.value = true
  try {
    emit('saveEditedDates', {
      startDate: localStartDate.value,
      endDate: localEndDate.value
    })
  } finally {
    isSavingDates.value = false
  }
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
      const date = new Date(finishedAt)
      localFinishedDate.value = getLocalDateString(date)
    } else {
      localFinishedDate.value = ''
    }
  }
  if (!isOpen) isSavingFinishedDate.value = false
})

const handleSaveFinishedDate = () => {
  if (isSavingFinishedDate.value) return
  isSavingFinishedDate.value = true
  try {
    emit('saveEditedFinishedDate', localFinishedDate.value)
  } finally {
    isSavingFinishedDate.value = false
  }
}

// Edit TOC
const localTotalPages = ref<number | null>(null)
const localChapters = ref<{ title: string; startPage: number }[]>([])
const tocFormRef = ref<InstanceType<typeof TocInputForm> | null>(null)

watch([() => props.editTocOpen, () => props.currentBook], ([isOpen, currentBook]) => {
  if (!isOpen) isSavingToc.value = false
  if (isOpen && currentBook) {
    // ✅ Use snapshot (사용자 입력값) first, fallback to official → draft
    localTotalPages.value = currentBook.pages_snapshot || currentBook.book?.official_pages || currentBook.book?.draft_pages || null

    if (currentBook.toc_snapshot && currentBook.toc_snapshot.length > 0) {
      // 이제 snapshot에 실제 페이지(page)가 저장되어 있으므로 그대로 사용
      localChapters.value = currentBook.toc_snapshot.map((c: any) => ({
        title: c.title,
        startPage: c.startPage || c.page || 0
      }))
    } else {
      localChapters.value = []
    }
  }
})

const handleSaveToc = () => {
  if (!tocFormRef.value || isSavingToc.value) return
  const validation = tocFormRef.value.validate()
  if (!validation.valid) {
    toast.error(validation.message || '목차 정보를 확인해주세요.')
    return
  }
  isSavingToc.value = true
  try {
    emit('saveEditedToc', {
      totalPages: localTotalPages.value!,
      chapters: localChapters.value
    })
  } finally {
    isSavingToc.value = false
  }
}
</script>

