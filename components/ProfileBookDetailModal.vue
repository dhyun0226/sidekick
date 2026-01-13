<template>
  <div v-if="isOpen && book" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md" @click="$emit('close')"></div>
    <div class="relative min-h-screen flex items-start justify-center p-4">
      <div class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8 overflow-hidden text-left">

        <!-- Header -->
        <div class="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between px-4 pt-4 pb-3">
            <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-widest">책 상세</h3>
            <button @click="$emit('close')" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <X :size="20" class="text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          <div class="px-4 pb-6 flex gap-4">
            <div class="w-20 h-28 overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
              <img :src="book.cover_url" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col pt-0.5">
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight mb-2 tracking-tight">{{ book.title }}</h2>
              <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{{ book.author }}</p>

              <div class="flex flex-wrap items-center gap-2">
                <GenreBadge v-if="book.genre" :genre="book.genre" />
                <div v-if="book.myRating" class="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-500/10 rounded-full border border-yellow-100 dark:border-yellow-500/20">
                  <Star :size="10" fill="currentColor" class="text-yellow-500" />
                  <span class="text-[10px] font-black text-yellow-700 dark:text-yellow-500">{{ book.myRating }}</span>
                </div>
                <Badge v-if="book.finished_at" variant="lime" size="sm">
                  {{ formatCompletionDate(book.finished_at) }} 완독
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div class="flex px-4">
            <button
              @click="tab = 'all'"
              class="flex-1 py-3 text-sm font-bold transition-colors relative"
              :class="tab === 'all' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
            >
              전체
              <div v-if="tab === 'all'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
            </button>
            <button
              @click="tab = 'review'"
              class="flex-1 py-3 text-sm font-bold transition-colors relative"
              :class="tab === 'review' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
            >
              리뷰
              <div v-if="tab === 'review'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
            </button>
            <button
              @click="tab = 'comments'"
              class="flex-1 py-3 text-sm font-bold transition-colors relative"
              :class="tab === 'comments' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'"
            >
              코멘트
              <div v-if="tab === 'comments'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400"></div>
            </button>
          </div>
        </div>

        <!-- Content Area -->
        <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/20">
          <div v-if="loading" class="py-12 flex flex-col items-center justify-center space-y-3">
            <LoadingSpinner size="md" />
            <p class="text-xs text-zinc-400 font-medium">기록 불러오는 중...</p>
          </div>

          <template v-else>
            <!-- All / Comments Tab -->
            <div v-if="tab !== 'review'" class="space-y-4">
              <div
                v-for="item in filteredTimeline"
                :key="item.id"
                @click="$emit('navigate', item)"
                class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all cursor-pointer hover:border-lime-400 shadow-sm"
              >
                <!-- Card Header: Group & Meta -->
                <div class="flex items-start justify-between mb-3 text-left">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 mb-0.5">
                      <span class="text-xs font-bold truncate">{{ item.groupName }}</span>
                      <span class="text-zinc-300 dark:text-zinc-700">·</span>
                      <span class="text-[10px] text-zinc-400 font-medium whitespace-nowrap">{{ formatDateTime(item.created_at) }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <template v-if="item.type === 'review'">
                      <RatingBadge :rating="item.rating" size="sm" />
                    </template>
                    <Badge v-else variant="lime" size="sm">
                      {{ Math.round(item.position_pct) }}%
                    </Badge>
                    <Badge v-if="item.isReply" variant="secondary" size="sm" class="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-none">
                      답글
                    </Badge>
                  </div>
                </div>

                <!-- Reply Context -->
                <div v-if="item.isReply && item.parentData" class="mb-3 overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <div class="bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-3 text-left">
                    <div class="flex items-center gap-2 mb-2">
                      <Avatar
                        :src="item.parentData.avatar_url"
                        :fallback="item.parentData.nickname?.charAt(0) || 'U'"
                        size="xs"
                        className="w-4 h-4 shadow-xs"
                      />
                      <p class="text-[11px] font-bold text-zinc-400">{{ item.parentData.nickname }}님의 기록</p>
                    </div>
                    <!-- Larger & Bordered Anchor -->
                    <div v-if="item.parentData.anchor_text" class="mb-2 pl-2 border-l-2 border-zinc-300 dark:border-zinc-600">
                      <p class="text-[13px] text-zinc-500 dark:text-zinc-400 italic line-clamp-1 font-serif">
                        {{ item.parentData.anchor_text }}
                      </p>
                    </div>
                    <p class="text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {{ item.parentData.content }}
                    </p>
                  </div>
                </div>

                <!-- Quote -->
                <div v-if="item.anchor_text" class="mb-3 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 text-left">
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed font-serif">
                    {{ item.anchor_text }}
                  </p>
                </div>

                <!-- Content -->
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed text-left">
                  {{ item.content }}
                </p>
              </div>

              <!-- Empty State -->
              <div v-if="filteredTimeline.length === 0" class="py-12 text-center">
                <div class="text-3xl mb-3 opacity-20">📝</div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">기록이 없습니다</h3>
                <p class="text-xs text-zinc-500">이 책에 대한 생각을 확인해보세요</p>
              </div>
            </div>

            <!-- Review Tab -->
            <div v-else class="space-y-4">
              <div
                v-for="item in bookReviews"
                :key="item.id"
                @click="$emit('navigate', item)"
                class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all cursor-pointer hover:border-lime-400 shadow-sm"
              >
                <div class="flex items-center justify-between mb-3 text-[13px]">
                  <div class="flex items-center gap-2">
                    <span class="text-zinc-500 dark:text-zinc-400 font-medium">{{ item.groupName }}</span>
                    <span class="text-zinc-300 dark:text-zinc-700">·</span>
                    <span class="text-zinc-500 dark:text-zinc-400">{{ formatDateTime(item.created_at) }}</span>
                  </div>
                  <RatingBadge :rating="item.rating" size="sm" />
                </div>
                <p class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {{ item.content }}
                </p>
              </div>
              <div v-if="bookReviews.length === 0" class="py-12 text-center">
                <div class="text-3xl mb-3 opacity-20">⭐</div>
                <h3 class="text-sm font-bold text-zinc-900 dark:text-white mb-1">리뷰가 없습니다</h3>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, User, CornerDownRight, Star } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'
import GenreBadge from './GenreBadge.vue'
import RatingBadge from './RatingBadge.vue'
import Badge from './Badge.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import Avatar from './Avatar.vue'

const props = defineProps<{
  isOpen: boolean
  book: any | null
}>()

const emit = defineEmits(['close', 'navigate'])

const client = useSupabaseClient()
const userStore = useUserStore()
const tab = ref<'all' | 'review' | 'comments'>('all')
const loading = ref(false)
const bookTimeline = ref<any[]>([])

// Fetch book-specific activities when modal opens
const fetchBookActivities = async () => {
  if (!props.book?.groupBookId) return
  
  loading.value = true
  bookTimeline.value = []
  
  try {
    const { data: { user: authUser } } = await client.auth.getUser()
    if (!authUser) return

    const [ { data: comments }, { data: reviews } ] = await Promise.all([
      client.from('comments').select('id, content, anchor_text, position_pct, created_at, parent_id, parent:parent_id (content, anchor_text, user:users (nickname, avatar_url)), group_book:group_books (id, group:groups (name, id))').eq('user_id', authUser.id).eq('group_book_id', props.book.groupBookId).order('created_at', { ascending: false }),
      client.from('reviews').select('id, content, rating, created_at, group_book_id, group_book:group_books (id, group:groups (name, id))').eq('user_id', authUser.id).eq('group_book_id', props.book.groupBookId).order('created_at', { ascending: false })
    ])

    const nc = (comments || []).map((c: any) => {
      const p = Array.isArray(c.parent) ? c.parent[0] : c.parent
      let pd = null
      if (p) {
        const pu = Array.isArray(p.user) ? p.user[0] : p.user
        pd = { 
          nickname: pu?.nickname || '알 수 없는 사용자', 
          avatar_url: pu?.avatar_url,
          content: p.content, 
          anchor_text: p.anchor_text 
        }
      }
      return { type: 'comment', id: c.id, created_at: c.created_at, content: c.content, anchor_text: c.anchor_text, position_pct: c.position_pct, isReply: !!c.parent_id, parentData: pd, groupName: c.group_book?.group?.name, groupBookId: c.group_book?.id, groupId: c.group_book?.group?.id }
    })

    const nr = (reviews || []).map((r: any) => ({ type: 'review', id: r.id, created_at: r.created_at, content: r.content, rating: r.rating, groupName: r.group_book?.group?.name, groupBookId: r.group_book?.id, groupId: r.group_book?.group?.id }))

    bookTimeline.value = [...nc, ...nr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (err) {
    console.error('[BookDetailModal] Fetch error:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, (val) => {
  if (val) {
    tab.value = 'all'
    fetchBookActivities()
  }
})

const filteredTimeline = computed(() => {
  if (tab.value === 'all') return bookTimeline.value
  if (tab.value === 'comments') return bookTimeline.value.filter(i => i.type === 'comment')
  return []
})

const bookReviews = computed(() => bookTimeline.value.filter(i => i.type === 'review'))

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatCompletionDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>