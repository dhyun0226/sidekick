<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
    @click.self="close"
  >
    <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-white">목차 수정</h2>
          <p class="text-sm text-zinc-500 mt-1">
            {{ book?.title }}
            <span v-if="tocType === 'official'" class="ml-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
              승인 완료
            </span>
            <span v-else class="ml-2 text-xs bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 px-2 py-0.5 rounded">
              승인 대기
            </span>
          </p>
        </div>
        <button
          @click="close"
          class="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
        >
          <X :size="20" class="text-zinc-500" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Total Pages Input -->
        <div class="mb-6">
          <label class="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
            전체 페이지 수
          </label>
          <input
            v-model.number="totalPages"
            type="number"
            min="1"
            class="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            placeholder="예: 300"
          />
        </div>

        <!-- Chapters List -->
        <div class="space-y-3 mb-4">
          <div
            v-for="(chapter, idx) in editedToc"
            :key="idx"
            class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <!-- Chapter Number -->
              <div class="flex-shrink-0 w-8 h-8 bg-lime-100 dark:bg-lime-900/20 rounded-lg flex items-center justify-center text-sm font-bold text-lime-700 dark:text-lime-400">
                {{ idx + 1 }}
              </div>

              <!-- Inputs -->
              <div class="flex-1 space-y-3">
                <!-- Title -->
                <input
                  v-model="chapter.title"
                  type="text"
                  class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                  placeholder="챕터 제목"
                />

                <!-- Page Range -->
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <label class="block text-xs text-zinc-500 mb-1">시작 페이지</label>
                    <input
                      v-model.number="chapter.startPage"
                      type="number"
                      min="1"
                      :max="totalPages"
                      class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                      @input="updatePercentages"
                    />
                  </div>
                  <div class="flex-1">
                    <label class="block text-xs text-zinc-500 mb-1">종료 페이지 (자동 계산)</label>
                    <input
                      :value="getEndPage(idx)"
                      type="number"
                      disabled
                      class="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div class="flex-shrink-0 pt-6">
                    <span class="text-xs text-zinc-500">
                      {{ chapter.start.toFixed(1) }}% ~ {{ chapter.end.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>

              <!-- Delete Button -->
              <button
                @click="removeChapter(idx)"
                class="flex-shrink-0 mt-1 w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors group"
              >
                <Trash2 :size="16" class="text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add Chapter Button -->
        <button
          @click="addChapter"
          class="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-lime-400 dark:hover:border-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/10 transition-colors flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-lime-600 dark:hover:text-lime-400 font-medium"
        >
          <Plus :size="20" />
          챕터 추가
        </button>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          @click="close"
          class="flex-1 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-medium transition-colors"
        >
          취소
        </button>
        <button
          @click="save"
          :disabled="saving || !isValid"
          class="flex-1 py-3 rounded-xl bg-lime-400 hover:bg-lime-500 text-black font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ saving ? '저장 중...' : '저장하기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Plus, Trash2 } from 'lucide-vue-next'

interface Chapter {
  title: string
  start: number
  end: number
  startPage: number
}

interface Props {
  show: boolean
  book: any
  tocType: 'draft' | 'official'
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'save'])

const totalPages = ref(300)
const editedToc = ref<Chapter[]>([])
const saving = ref(false)

// Initialize when modal opens
watch(() => props.show, (show) => {
  if (show && props.book) {
    totalPages.value = props.book.total_pages || 300

    // Parse the appropriate TOC based on tocType
    const tocSource = props.tocType === 'official' ? props.book.official_toc : props.book.draft_toc
    const toc = parseToc(tocSource)
    editedToc.value = toc.map((chapter: any) => ({
      title: chapter.title,
      start: chapter.start,
      end: chapter.end,
      startPage: Math.round((chapter.start / 100) * totalPages.value)
    }))
  }
})

const parseToc = (tocJson: string) => {
  try {
    return JSON.parse(tocJson)
  } catch {
    return []
  }
}

const getEndPage = (idx: number) => {
  if (idx === editedToc.value.length - 1) {
    return totalPages.value
  }
  return editedToc.value[idx + 1]?.startPage || totalPages.value
}

const updatePercentages = () => {
  editedToc.value.forEach((chapter, idx) => {
    const startPage = chapter.startPage || 1
    const endPage = getEndPage(idx)

    chapter.start = (startPage / totalPages.value) * 100
    chapter.end = (endPage / totalPages.value) * 100
  })
}

const addChapter = () => {
  const lastChapter = editedToc.value[editedToc.value.length - 1]
  const newStartPage = lastChapter ? getEndPage(editedToc.value.length - 1) : 1

  editedToc.value.push({
    title: '',
    start: (newStartPage / totalPages.value) * 100,
    end: 100,
    startPage: newStartPage
  })

  updatePercentages()
}

const removeChapter = (idx: number) => {
  editedToc.value.splice(idx, 1)
  updatePercentages()
}

const isValid = computed(() => {
  if (editedToc.value.length === 0) return false
  if (!totalPages.value || totalPages.value < 1) return false

  return editedToc.value.every((chapter) => {
    return chapter.title.trim() !== '' && chapter.startPage > 0
  })
})

const save = async () => {
  if (!isValid.value) return

  saving.value = true

  try {
    // Convert to final TOC format (without startPage)
    const finalToc = editedToc.value.map(({ title, start, end }) => ({
      title,
      start,
      end
    }))

    emit('save', {
      isbn: props.book.isbn,
      totalPages: totalPages.value,
      toc: finalToc
    })
  } finally {
    saving.value = false
  }
}

const close = () => {
  if (!saving.value) {
    emit('close')
  }
}
</script>
