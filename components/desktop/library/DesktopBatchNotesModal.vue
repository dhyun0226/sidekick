<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-apple"
      leave-active-class="transition-opacity duration-150 ease-apple"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center" @click.self="tryClose">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/25 backdrop-blur-md" @click="tryClose"></div>

        <!-- Modal - Full size -->
        <div
          class="relative w-[90vw] max-w-[1100px] h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-8 py-5 shrink-0">
            <div>
              <h2 class="text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-white">일괄 입력</h2>
              <p class="text-[12px] text-zinc-400 mt-1 font-light">여러 메모를 한번에 작성하세요</p>
            </div>
            <div class="flex items-center gap-4">
              <!-- Mode Toggle -->
              <div v-if="totalPages" class="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5">
                <button
                  @click="inputMode = 'percent'"
                  class="px-3 py-1 text-desktop-caption font-semibold rounded-full transition-all duration-200 ease-apple"
                  :class="inputMode === 'percent'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
                    : 'text-zinc-400'"
                >%</button>
                <button
                  @click="inputMode = 'page'"
                  class="px-3 py-1 text-desktop-caption font-semibold rounded-full transition-all duration-200 ease-apple"
                  :class="inputMode === 'page'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-apple-sm'
                    : 'text-zinc-400'"
                >p</button>
              </div>
              <!-- Close -->
              <button
                @click="tryClose"
                class="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X :size="15" />
              </button>
            </div>
          </div>

          <!-- Spreadsheet -->
          <div v-if="!saveCompleted" class="flex-1 overflow-y-auto px-8">
            <table class="w-full">
              <thead class="sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <tr class="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                  <th class="text-left pb-3 w-10">#</th>
                  <th class="text-left pb-3 w-28">{{ inputMode === 'page' ? '페이지' : '위치(%)' }}</th>
                  <th class="text-left pb-3 w-[35%]">인용 구절</th>
                  <th class="text-left pb-3">메모</th>
                  <th class="w-10 pb-3"></th>
                </tr>
                <tr><td colspan="5"><div class="h-px bg-zinc-100 dark:bg-zinc-800"></div></td></tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in rows"
                  :key="idx"
                  class="group"
                >
                  <td class="py-3 align-top">
                    <span class="text-[11px] text-zinc-300 dark:text-zinc-600 font-medium">{{ idx + 1 }}</span>
                  </td>
                  <td class="py-3 pr-3 align-top">
                    <input
                      :ref="el => setCellRef(el, idx, 'position')"
                      type="number"
                      v-model.number="row.position"
                      :placeholder="inputMode === 'page' ? 'p' : '%'"
                      class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-desktop-body text-zinc-900 dark:text-white text-center transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-zinc-100 dark:focus:bg-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                      @keydown="handleKeydown($event, idx, 'position')"
                    />
                  </td>
                  <td class="py-3 pr-3 align-top">
                    <textarea
                      :ref="el => setCellRef(el, idx, 'anchor')"
                      v-model="row.anchor"
                      placeholder="인상 깊은 구절..."
                      rows="1"
                      class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-desktop-body italic text-zinc-600 dark:text-zinc-400 resize-none transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-zinc-100 dark:focus:bg-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 placeholder:not-italic"
                      @keydown="handleKeydown($event, idx, 'anchor')"
                      @input="autoResize($event)"
                    ></textarea>
                  </td>
                  <td class="py-3 pr-3 align-top">
                    <textarea
                      :ref="el => setCellRef(el, idx, 'content')"
                      v-model="row.content"
                      placeholder="느낀 점을 적어보세요..."
                      rows="1"
                      class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-desktop-body text-zinc-900 dark:text-white resize-none transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-zinc-100 dark:focus:bg-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                      @keydown="handleKeydown($event, idx, 'content')"
                      @input="autoResize($event)"
                    ></textarea>
                  </td>
                  <td class="py-3 align-top">
                    <button
                      @click="removeRow(idx)"
                      class="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-400 transition-all rounded-lg"
                      title="행 삭제 (Cmd+Backspace)"
                    >
                      <Minus :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Add Row -->
            <button
              @click="addRow"
              class="mt-1 mb-4 flex items-center gap-1.5 px-3 py-2 text-desktop-caption text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg"
            >
              <Plus :size="14" />
              <span>행 추가</span>
              <span class="text-[10px] text-zinc-300 dark:text-zinc-600 ml-1">Tab으로 자동 추가</span>
            </button>
          </div>

          <!-- Save Completed Screen -->
          <div v-if="saveCompleted" class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="w-14 h-14 mx-auto mb-5 rounded-full bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center">
                <Check :size="24" class="text-lime-500" />
              </div>
              <h3 class="text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
                {{ totalToSave }}개 노트 저장 완료
              </h3>
              <p class="text-[13px] text-zinc-400 font-light">타임라인에서 확인할 수 있어요</p>
            </div>
          </div>

          <!-- Saving Progress -->
          <div v-if="saving && !saveCompleted" class="px-8 py-3 shrink-0">
            <div class="flex items-center gap-3">
              <div class="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full bg-lime-400 rounded-full transition-all duration-300 ease-apple" :style="{ width: `${saveProgress}%` }"></div>
              </div>
              <span class="text-[11px] text-zinc-400 tabular-nums">{{ savedCount }}/{{ totalToSave }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-8 py-4 shrink-0 border-t border-zinc-100 dark:border-zinc-800/60">
            <span class="text-desktop-caption text-zinc-400">
              {{ saveCompleted ? '모든 노트가 저장되었습니다' : `${validRowCount}개 노트 작성됨` }}
            </span>
            <div class="flex items-center gap-3">
              <button
                v-if="!saveCompleted"
                @click="tryClose"
                class="px-4 py-2 text-desktop-callout text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                취소
              </button>
              <button
                v-if="saveCompleted"
                @click="emit('close')"
                class="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 text-desktop-callout"
              >
                닫기
              </button>
              <button
                v-else
                @click="handleSave"
                :disabled="validRowCount === 0 || saving"
                class="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 text-desktop-callout disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span v-if="!saving">저장하기</span>
                <span v-else>저장 중...</span>
                <kbd v-if="!saving" class="text-[10px] text-zinc-500 dark:text-zinc-400">⌘↵</kbd>
              </button>
            </div>
          </div>
        </div>

        <!-- Unsaved Changes Confirm -->
        <Transition
          enter-active-class="transition-opacity duration-150"
          leave-active-class="transition-opacity duration-100"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div v-if="showDiscardConfirm" class="absolute inset-0 z-10 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/20" @click="showDiscardConfirm = false"></div>
            <div class="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-6 w-[340px] text-center" @click.stop>
              <h3 class="text-[15px] font-semibold text-zinc-900 dark:text-white mb-1.5">작성 중인 내용이 있어요</h3>
              <p class="text-[13px] text-zinc-400 font-light mb-5">닫으면 작성한 내용이 사라집니다.</p>
              <div class="flex gap-2.5">
                <button
                  @click="showDiscardConfirm = false"
                  class="flex-1 px-4 py-2.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  계속 작성
                </button>
                <button
                  @click="showDiscardConfirm = false; emit('close')"
                  class="flex-1 px-4 py-2.5 text-[13px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Plus, Minus, X, Check } from 'lucide-vue-next'

interface BatchRow {
  position: number | null
  anchor: string
  content: string
}

const props = defineProps<{
  isOpen: boolean
  totalPages?: number
  preferredMode?: 'percent' | 'page'
}>()

const emit = defineEmits<{
  close: []
  save: [notes: Array<{ positionPct: number; anchorText: string; content: string }>]
}>()

const inputMode = ref<'percent' | 'page'>(props.preferredMode || 'percent')
const saving = ref(false)
const savedCount = ref(0)
const totalToSave = ref(0)
const saveCompleted = ref(false)
const showDiscardConfirm = ref(false)

const rows = ref<BatchRow[]>([
  { position: null, anchor: '', content: '' },
  { position: null, anchor: '', content: '' },
  { position: null, anchor: '', content: '' },
])

// Cell refs for keyboard navigation
const cellRefs = ref<Record<string, HTMLElement | null>>({})

const setCellRef = (el: any, rowIdx: number, col: string) => {
  if (el) cellRefs.value[`${rowIdx}-${col}`] = el
}

const validRows = computed(() =>
  rows.value.filter(r => r.content.trim() || r.anchor.trim())
)

const validRowCount = computed(() => validRows.value.length)

const isDirty = computed(() =>
  rows.value.some(r => r.content.trim() || r.anchor.trim() || r.position !== null)
)

const saveProgress = computed(() =>
  totalToSave.value > 0 ? (savedCount.value / totalToSave.value) * 100 : 0
)

const tryClose = () => {
  if (isDirty.value && !saving.value && !saveCompleted.value) {
    showDiscardConfirm.value = true
  } else {
    emit('close')
  }
}

const addRow = () => {
  rows.value.push({ position: null, anchor: '', content: '' })
  nextTick(() => {
    const lastIdx = rows.value.length - 1
    cellRefs.value[`${lastIdx}-position`]?.focus()
  })
}

const removeRow = (idx: number) => {
  if (rows.value.length <= 1) return
  rows.value.splice(idx, 1)
}

const columns = ['position', 'anchor', 'content'] as const

const handleKeydown = (e: KeyboardEvent, rowIdx: number, col: string) => {
  const colIdx = columns.indexOf(col as any)

  // Cmd/Ctrl + Enter: save
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    handleSave()
    return
  }

  // Cmd/Ctrl + Backspace: delete row
  if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    removeRow(rowIdx)
    return
  }

  // Tab / Shift+Tab: cell navigation
  if (e.key === 'Tab') {
    e.preventDefault()
    if (e.shiftKey) {
      // Previous cell
      if (colIdx > 0) {
        cellRefs.value[`${rowIdx}-${columns[colIdx - 1]}`]?.focus()
      } else if (rowIdx > 0) {
        cellRefs.value[`${rowIdx - 1}-${columns[columns.length - 1]}`]?.focus()
      }
    } else {
      // Next cell
      if (colIdx < columns.length - 1) {
        cellRefs.value[`${rowIdx}-${columns[colIdx + 1]}`]?.focus()
      } else if (rowIdx < rows.value.length - 1) {
        cellRefs.value[`${rowIdx + 1}-${columns[0]}`]?.focus()
      } else {
        // Last cell of last row → add new row
        addRow()
      }
    }
    return
  }

  // Enter: same column, next row
  if (e.key === 'Enter' && !e.shiftKey && col === 'position') {
    e.preventDefault()
    if (rowIdx < rows.value.length - 1) {
      cellRefs.value[`${rowIdx + 1}-${col}`]?.focus()
    } else {
      addRow()
    }
  }
}

const autoResize = (e: Event) => {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const handleSave = async () => {
  const toSave = validRows.value.map(r => {
    let pct = r.position || 0
    if (inputMode.value === 'page' && props.totalPages && r.position) {
      pct = Math.round((r.position / props.totalPages) * 100)
    }
    pct = Math.min(100, Math.max(0, pct))

    return {
      positionPct: pct,
      anchorText: r.anchor.trim(),
      content: r.content.trim()
    }
  })

  if (toSave.length === 0) return

  saving.value = true
  savedCount.value = 0
  totalToSave.value = toSave.length

  emit('save', toSave)
}

// 부모에서 저장 진행 시 호출
const incrementSaved = () => {
  savedCount.value++
}

const finishSave = () => {
  saving.value = false
  saveCompleted.value = true
}

// Reset state when modal closes
const resetState = () => {
  rows.value = [
    { position: null, anchor: '', content: '' },
    { position: null, anchor: '', content: '' },
    { position: null, anchor: '', content: '' },
  ]
  saving.value = false
  savedCount.value = 0
  totalToSave.value = 0
  saveCompleted.value = false
  showDiscardConfirm.value = false
}

// Global keyboard shortcut
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return
  if (e.key === 'Escape') {
    tryClose()
  }
}

// Auto-reset when modal closes, auto-focus first cell when opens
watch(() => props.isOpen, (open) => {
  if (open) {
    nextTick(() => {
      cellRefs.value['0-position']?.focus()
    })
  } else {
    resetState()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

defineExpose({ resetState, saving, savedCount, totalToSave, incrementSaved, finishSave })
</script>
