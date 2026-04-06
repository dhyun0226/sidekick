<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100010] flex items-center justify-center px-4" @keydown.esc="$emit('close')" tabindex="-1">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-apple-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 class="text-lg font-black text-zinc-900 dark:text-white">
              {{ currentView === 'list' ? '고객 지원' : currentView === 'form' ? '문의하기' : '문의 상세' }}
            </h3>
            <button @click="$emit('close')" class="p-2 text-zinc-400 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X :size="20" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <!-- List View -->
            <div v-if="currentView === 'list'" class="p-6 space-y-4">
              <button
                @click="currentView = 'form'"
                class="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Plus :size="16" />
                새 문의 작성
              </button>

              <div v-if="loading" class="flex justify-center py-8">
                <div class="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <div v-else-if="inquiries.length === 0" class="text-center py-8">
                <MessageCircle :size="32" class="mx-auto text-zinc-300 dark:text-zinc-500 mb-3" />
                <p class="text-sm text-zinc-400 dark:text-zinc-300">문의 내역이 없습니다</p>
              </div>

              <div v-else class="space-y-2">
                <button
                  v-for="inq in inquiries"
                  :key="inq.id"
                  @click="selectInquiry(inq)"
                  class="w-full text-left bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[11px] font-bold" :class="statusColor(inq.status)">
                      {{ statusLabel(inq.status) }}
                    </span>
                    <span class="text-[11px] text-zinc-400 dark:text-zinc-300">{{ formatDate(inq.created_at) }}</span>
                  </div>
                  <p class="text-sm font-bold text-zinc-900 dark:text-white truncate">{{ inq.title }}</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ categoryLabel(inq.category) }}</p>
                </button>
              </div>
            </div>

            <!-- Form View -->
            <div v-else-if="currentView === 'form'" class="p-6 space-y-5">
              <div>
                <label class="block text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase mb-2">카테고리</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="cat in categories"
                    :key="cat.value"
                    @click="form.category = cat.value"
                    class="py-2.5 text-xs font-bold rounded-xl border transition-all"
                    :class="form.category === cat.value
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300'"
                  >
                    {{ cat.label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase mb-2">제목</label>
                <input
                  v-model="form.title"
                  type="text"
                  maxlength="100"
                  placeholder="문의 제목을 입력하세요"
                  class="w-full bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-zinc-900 dark:text-white placeholder-zinc-400"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase mb-2">내용</label>
                <textarea
                  v-model="form.content"
                  rows="5"
                  maxlength="2000"
                  placeholder="문의 내용을 자세히 적어주세요"
                  class="w-full bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 resize-none"
                ></textarea>
                <p class="text-[11px] text-zinc-400 dark:text-zinc-300 text-right mt-1">{{ form.content.length }} / 2000</p>
              </div>

              <div class="flex gap-3">
                <button
                  @click="currentView = 'list'"
                  class="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  취소
                </button>
                <button
                  @click="submitInquiry"
                  :disabled="!isFormValid || submitting"
                  class="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <div v-if="submitting" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  {{ submitting ? '전송 중...' : '문의 보내기' }}
                </button>
              </div>
            </div>

            <!-- Detail View -->
            <div v-else-if="currentView === 'detail' && selectedInquiry" class="p-6 space-y-5">
              <button @click="currentView = 'list'" class="flex items-center gap-1 text-xs font-bold text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors">
                <ChevronLeft :size="14" />
                목록으로
              </button>

              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[11px] font-bold" :class="statusColor(selectedInquiry.status)">
                    {{ statusLabel(selectedInquiry.status) }}
                  </span>
                  <span class="text-[11px] text-zinc-400 dark:text-zinc-300">{{ categoryLabel(selectedInquiry.category) }}</span>
                </div>
                <h4 class="text-base font-bold text-zinc-900 dark:text-white">{{ selectedInquiry.title }}</h4>
                <p class="text-[11px] text-zinc-400 dark:text-zinc-300 mt-1">{{ formatDate(selectedInquiry.created_at) }}</p>
              </div>

              <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800/50">
                <p class="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{{ selectedInquiry.content }}</p>
              </div>

              <div v-if="selectedInquiry.admin_reply" class="space-y-2">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 bg-lime-400 rounded-full flex items-center justify-center">
                    <MessageCircle :size="10" class="text-black" />
                  </div>
                  <span class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">관리자 답변</span>
                  <span class="text-[11px] text-zinc-400 dark:text-zinc-300">{{ formatDate(selectedInquiry.replied_at) }}</span>
                </div>
                <div class="bg-lime-50 dark:bg-lime-900/30 rounded-xl p-4 border border-lime-100 dark:border-lime-700/30">
                  <p class="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{{ selectedInquiry.admin_reply }}</p>
                </div>
              </div>

              <div v-else class="text-center py-4">
                <p class="text-xs text-zinc-400 dark:text-zinc-300">아직 답변이 등록되지 않았습니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Plus, MessageCircle, ChevronLeft } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close'])
const toast = useToastStore()

const currentView = ref<'list' | 'form' | 'detail'>('list')
const loading = ref(false)
const submitting = ref(false)
const inquiries = ref<any[]>([])
const selectedInquiry = ref<any>(null)

const form = ref({ category: '', title: '', content: '' })

const categories = [
  { value: 'payment', label: '결제' },
  { value: 'bug', label: '버그' },
  { value: 'feature', label: '기능 제안' },
  { value: 'account', label: '계정' },
  { value: 'other', label: '기타' }
]

const isFormValid = computed(() =>
  form.value.category && form.value.title.trim().length > 0 && form.value.content.trim().length > 0
)

watch(() => props.isOpen, async (open) => {
  if (open) {
    currentView.value = 'list'
    form.value = { category: '', title: '', content: '' }
    await fetchInquiries()
  }
})

const fetchInquiries = async () => {
  loading.value = true
  try {
    const { inquiries: data } = await $fetch('/api/inquiries/list')
    inquiries.value = data
  } catch {
    toast.error('문의 목록을 불러오지 못했습니다')
  } finally {
    loading.value = false
  }
}

const submitInquiry = async () => {
  if (!isFormValid.value || submitting.value) return
  submitting.value = true
  try {
    await $fetch('/api/inquiries/create', {
      method: 'POST',
      body: {
        category: form.value.category,
        title: form.value.title.trim(),
        content: form.value.content.trim()
      }
    })
    toast.success('문의가 등록되었습니다')
    form.value = { category: '', title: '', content: '' }
    currentView.value = 'list'
    await fetchInquiries()
  } catch {
    toast.error('문의 등록에 실패했습니다')
  } finally {
    submitting.value = false
  }
}

const selectInquiry = (inq: any) => {
  selectedInquiry.value = inq
  currentView.value = 'detail'
}

const statusLabel = (s: string) => ({ pending: '대기 중', replied: '답변 완료', closed: '종료' }[s] || s)
const statusColor = (s: string) => ({
  pending: 'text-amber-500',
  replied: 'text-lime-600 dark:text-lime-400',
  closed: 'text-zinc-400 dark:text-zinc-300'
}[s] || 'text-zinc-400 dark:text-zinc-300')

const categoryLabel = (c: string) => categories.find(cat => cat.value === c)?.label || c

const formatDate = (d: string) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear().toString().slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
