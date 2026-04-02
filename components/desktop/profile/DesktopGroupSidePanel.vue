<template>
  <div class="space-y-3" v-if="group">
    <!-- 그룹 정보 -->
    <div class="bg-zinc-50 dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-3">
      <h4 class="text-sm font-bold text-zinc-900 dark:text-white mb-3">{{ group.name }}</h4>

      <!-- 읽고 있는 책 -->
      <template v-if="books.length > 0">
        <h5 class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">읽고 있는 책</h5>
        <div class="grid grid-cols-3 gap-2 mb-5">
          <div v-for="book in books.slice(0, 6)" :key="book.id">
            <div class="aspect-[2/3] bg-zinc-100 dark:bg-zinc-800 overflow-hidden rounded ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              <img v-if="book.cover_url" :src="book.cover_url" class="w-full h-full object-cover" />
            </div>
            <p class="text-[10px] mt-1 truncate text-zinc-400 dark:text-zinc-300">{{ book.title }}</p>
          </div>
        </div>
      </template>

      <!-- 멤버 -->
      <template v-if="members.length > 0">
        <h5 class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-3">멤버</h5>
        <div class="space-y-2">
          <div v-for="member in members.slice(0, 5)" :key="member.id" class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden flex items-center justify-center text-[10px] text-zinc-400 dark:text-zinc-300 flex-shrink-0">
              <img v-if="member.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
              <span v-else>{{ (member.nickname || 'U')[0] }}</span>
            </div>
            <span class="text-xs text-zinc-700 dark:text-zinc-300">{{ member.nickname }}</span>
            <span v-if="member.role === 'admin'" class="text-[10px] text-purple-500 dark:text-purple-400 ml-auto">그룹장</span>
          </div>
          <div v-if="members.length > 5" class="text-[11px] text-zinc-400 dark:text-zinc-300">
            외 {{ members.length - 5 }}명
          </div>
        </div>
      </template>
    </div>

    <!-- 초대 코드 -->
    <div v-if="group.invite_code" class="bg-zinc-50 dark:bg-zinc-900 rounded-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] p-3">
      <h5 class="text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider mb-2">초대 코드</h5>
      <div class="flex items-center gap-2">
        <code class="text-xs bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg flex-1 text-center text-zinc-600 dark:text-zinc-300 font-mono tracking-wider">{{ group.invite_code }}</code>
        <button
          @click="copyCode"
          class="p-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition text-zinc-400 dark:text-zinc-300"
        >
          <Copy :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Copy } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  group: any
}>()

const toast = useToastStore()
const client = useSupabaseClient()
const books = ref<any[]>([])
const members = ref<any[]>([])

const fetchGroupDetails = async () => {
  if (!props.group?.id) return

  const [booksRes, membersRes] = await Promise.all([
    client
      .from('group_books')
      .select('id, isbn, book:books (title, cover_url)')
      .eq('group_id', props.group.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    client
      .from('group_members')
      .select('id, role, user:users (id, nickname, avatar_url)')
      .eq('group_id', props.group.id)
      .is('left_at', null)
  ])

  books.value = (booksRes.data || []).map((b: any) => ({
    id: b.id,
    title: Array.isArray(b.book) ? b.book[0]?.title : b.book?.title,
    cover_url: Array.isArray(b.book) ? b.book[0]?.cover_url : b.book?.cover_url
  }))

  members.value = (membersRes.data || []).map((m: any) => {
    const user = Array.isArray(m.user) ? m.user[0] : m.user
    return {
      id: user?.id,
      nickname: user?.nickname || '알 수 없음',
      avatar_url: user?.avatar_url,
      role: m.role
    }
  })
}

watch(() => props.group?.id, () => {
  fetchGroupDetails()
}, { immediate: true })

const copyCode = () => {
  if (props.group?.invite_code) {
    navigator.clipboard.writeText(props.group.invite_code)
    toast.success('초대 코드가 복사되었습니다')
  }
}
</script>
