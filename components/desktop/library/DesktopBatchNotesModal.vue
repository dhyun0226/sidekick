<template>
  <DesktopModal :is-open="isOpen" title="한번에 입력하기" size="lg" @close="$emit('close')">
    <!-- Header Toggle -->
    <div class="px-6 pt-4 pb-2 flex items-center justify-between">
      <p class="text-desktop-caption text-zinc-500">여러 메모를 한번에 작성하세요</p>
      <div v-if="totalPages" class="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
        <button
          @click="inputMode = 'percent'"
          class="px-2.5 py-1 text-desktop-caption font-semibold rounded-md transition-all"
          :class="inputMode === 'percent'
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500'"
        >%</button>
        <button
          @click="inputMode = 'page'"
          class="px-2.5 py-1 text-desktop-caption font-semibold rounded-md transition-all"
          :class="inputMode === 'page'
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-500'"
        >p</button>
      </div>
    </div>

    <!-- Spreadsheet Table -->
    <div class="px-6 pb-4">
      <table class="w-full border-collapse">
        <thead>
          <tr class="text-desktop-caption text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
            <th class="text-left py-2 w-8">#</th>
            <th class="text-left py-2 w-24">{{ inputMode === 'page' ? '페이지' : '퍼센트(%)' }}</th>
            <th class="text-left py-2">인용문</th>
            <th class="text-left py-2">메모</th>
            <th class="w-8"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in rows"
            :key="idx"
            class="border-b border-zinc-100 dark:border-zinc-800 group"
          >
            <td class="py-2 text-desktop-caption text-zinc-400">{{ idx + 1 }}</td>
            <td class="py-2 pr-2">
              <input
                :ref="el => setCellRef(el, idx, 'position')"
                type="number"
                v-model.number="row.position"
                :placeholder="inputMode === 'page' ? 'p' : '%'"
                class="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-lime-400 focus:bg-zinc-50 dark:focus:bg-zinc-800 rounded text-desktop-body text-center transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                @keydown="handleKeydown($event, idx, 'position')"
              />
            </td>
            <td class="py-2 pr-2">
              <textarea
                :ref="el => setCellRef(el, idx, 'anchor')"
                v-model="row.anchor"
                placeholder="인상 깊은 구절"
                rows="1"
                class="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-lime-400 focus:bg-zinc-50 dark:focus:bg-zinc-800 rounded text-desktop-body resize-none transition-all"
                @keydown="handleKeydown($event, idx, 'anchor')"
                @input="autoResize($event)"
              ></textarea>
            </td>
            <td class="py-2 pr-2">
              <textarea
                :ref="el => setCellRef(el, idx, 'content')"
                v-model="row.content"
                placeholder="느낀 점"
                rows="1"
                class="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-lime-400 focus:bg-zinc-50 dark:focus:bg-zinc-800 rounded text-desktop-body resize-none transition-all"
                @keydown="handleKeydown($event, idx, 'content')"
                @input="autoResize($event)"
              ></textarea>
            </td>
            <td class="py-2">
              <button
                @click="removeRow(idx)"
                class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all rounded"
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
        class="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-desktop-caption text-zinc-500 hover:text-lime-600 transition-colors"
      >
        <Plus :size="14" />
        <span>행 추가</span>
      </button>
    </div>

    <!-- Saving Progress -->
    <div v-if="saving" class="px-6 pb-4">
      <div class="flex items-center gap-3">
        <div class="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div class="h-full bg-lime-500 rounded-full transition-all duration-300" :style="{ width: `${saveProgress}%` }"></div>
        </div>
        <span class="text-desktop-caption text-zinc-500">{{ savedCount }}/{{ totalToSave }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <span class="text-desktop-caption text-zinc-500">
          {{ validRowCount }}개 노트
        </span>
        <div class="flex gap-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-desktop-callout text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            @click="handleSave"
            :disabled="validRowCount === 0 || saving"
            class="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors text-desktop-callout disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="!saving">저장</span>
            <span v-else>저장 중...</span>
            <kbd v-if="!saving" class="hidden sm:inline text-[10px] bg-zinc-700 dark:bg-zinc-300 px-1.5 py-0.5 rounded">⌘↵</kbd>
          </button>
        </div>
      </div>
    </template>
  </DesktopModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Plus, Minus } from 'lucide-vue-next'
import DesktopModal from '~/components/desktop/shared/DesktopModal.vue'

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

const saveProgress = computed(() =>
  totalToSave.value > 0 ? (savedCount.value / totalToSave.value) * 100 : 0
)

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
}

// Global keyboard shortcut
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return
  if (e.key === 'Escape') {
    emit('close')
  }
}

// Auto-reset when modal closes
watch(() => props.isOpen, (open) => {
  if (!open) {
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
