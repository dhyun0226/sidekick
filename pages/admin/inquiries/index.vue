<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-zinc-900 dark:text-white">문의 관리</h2>
        <p class="text-sm text-zinc-500 mt-1">고객 문의를 확인하고 답변합니다</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          @click="currentStatus = tab.value"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="currentStatus === tab.value
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
            :class="currentStatus === tab.value ? 'bg-white/20 dark:bg-black/20' : 'bg-zinc-200 dark:bg-zinc-700'">
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="inquiries.length === 0" class="text-center py-12 text-zinc-400">
      문의가 없습니다
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="inq in inquiries"
        :key="inq.id"
        class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold" :class="statusColor(inq.status)">
                {{ statusLabel(inq.status) }}
              </span>
              <span class="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {{ categoryLabel(inq.category) }}
              </span>
              <span class="text-[10px] text-zinc-400">{{ formatDate(inq.created_at) }}</span>
            </div>
            <h4 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">{{ inq.title }}</h4>
            <p class="text-xs text-zinc-500 line-clamp-2">{{ inq.content }}</p>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <div v-if="inq.user" class="text-right">
              <p class="text-xs font-bold text-zinc-700 dark:text-zinc-300">{{ inq.user.nickname || '알 수 없음' }}</p>
              <p class="text-[10px] text-zinc-400">{{ tierLabel(inq.user.subscription_tier) }}</p>
            </div>
            <button
              @click="openReply(inq)"
              class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
              :class="inq.status === 'pending'
                ? 'bg-lime-400 text-black hover:bg-lime-300'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
            >
              {{ inq.status === 'pending' ? '답변하기' : '상세' }}
            </button>
          </div>
        </div>

        <!-- Existing Reply -->
        <div v-if="inq.admin_reply" class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <p class="text-[10px] font-bold text-lime-600 dark:text-lime-400 mb-1">관리자 답변 · {{ formatDate(inq.replied_at) }}</p>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{{ inq.admin_reply }}</p>
        </div>
      </div>
    </div>

    <!-- Reply Modal -->
    <Teleport to="body">
      <div v-if="replyTarget" class="fixed inset-0 z-[100010] flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="replyTarget = null"></div>
        <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden">
          <div class="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">문의 답변</h3>
            <button @click="replyTarget = null" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <X :size="20" />
            </button>
          </div>

          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <p class="text-[10px] font-bold text-zinc-400 mb-1">{{ categoryLabel(replyTarget.category) }} · {{ formatDate(replyTarget.created_at) }}</p>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">{{ replyTarget.title }}</p>
            </div>

            <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <p class="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{{ replyTarget.content }}</p>
            </div>

            <div v-if="replyTarget.user" class="flex items-center gap-2 text-xs text-zinc-500">
              <span class="font-bold">{{ replyTarget.user.nickname }}</span>
              <span>·</span>
              <span>{{ replyTarget.user.email }}</span>
              <span>·</span>
              <span class="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">{{ tierLabel(replyTarget.user.subscription_tier) }}</span>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-zinc-400 mb-2">답변</label>
              <textarea
                v-model="replyContent"
                rows="5"
                placeholder="답변을 작성하세요"
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 text-zinc-900 dark:text-white placeholder-zinc-400 resize-none"
              ></textarea>
            </div>

            <div class="flex gap-3">
              <button
                @click="submitReply('replied')"
                :disabled="!replyContent.trim() || replying"
                class="flex-1 py-3 bg-lime-400 text-black rounded-xl text-sm font-bold hover:bg-lime-300 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <div v-if="replying" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                답변 보내기
              </button>
              <button
                @click="submitReply('closed')"
                :disabled="replying"
                class="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                종료
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToastStore()
const loading = ref(false)
const inquiries = ref<any[]>([])
const currentStatus = ref('all')
const replyTarget = ref<any>(null)
const replyContent = ref('')
const replying = ref(false)

const statusTabs = computed(() => [
  { value: 'all', label: '전체', count: inquiries.value.length },
  { value: 'pending', label: '대기', count: inquiries.value.filter(i => i.status === 'pending').length },
  { value: 'replied', label: '답변', count: inquiries.value.filter(i => i.status === 'replied').length },
  { value: 'closed', label: '종료', count: inquiries.value.filter(i => i.status === 'closed').length }
])

const categories = [
  { value: 'payment', label: '결제' },
  { value: 'bug', label: '버그' },
  { value: 'feature', label: '기능 제안' },
  { value: 'account', label: '계정' },
  { value: 'other', label: '기타' }
]

onMounted(() => fetchInquiries())
watch(currentStatus, () => fetchInquiries())

const fetchInquiries = async () => {
  loading.value = true
  try {
    const { inquiries: data } = await $fetch('/api/admin/inquiries/list', {
      query: { status: currentStatus.value }
    })
    inquiries.value = data
  } catch {
    toast.error('문의 목록 로드에 실패했습니다')
  } finally {
    loading.value = false
  }
}

const openReply = (inq: any) => {
  replyTarget.value = inq
  replyContent.value = inq.admin_reply || ''
}

const submitReply = async (status: string) => {
  if (!replyTarget.value) return
  replying.value = true
  try {
    await $fetch('/api/admin/inquiries/reply', {
      method: 'POST',
      body: {
        inquiryId: replyTarget.value.id,
        reply: replyContent.value.trim(),
        status
      }
    })
    toast.success(status === 'closed' ? '문의가 종료되었습니다' : '답변이 등록되었습니다')
    replyTarget.value = null
    replyContent.value = ''
    await fetchInquiries()
  } catch {
    toast.error('답변 등록에 실패했습니다')
  } finally {
    replying.value = false
  }
}

const tierLabel = (t: string) => ({ free: '무료', premium: '프리미엄', admin: '관리자' }[t] || t)
const statusLabel = (s: string) => ({ pending: '대기 중', replied: '답변 완료', closed: '종료' }[s] || s)
const statusColor = (s: string) => ({
  pending: 'text-amber-500',
  replied: 'text-lime-600 dark:text-lime-400',
  closed: 'text-zinc-400'
}[s] || 'text-zinc-400')
const categoryLabel = (c: string) => categories.find(cat => cat.value === c)?.label || c

const formatDate = (d: string) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear().toString().slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>
