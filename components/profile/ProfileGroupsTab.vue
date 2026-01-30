<template>
  <div class="space-y-4">
    <!-- Header with info -->
    <div v-if="!isPremium" class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
      <p class="text-sm text-amber-900 dark:text-amber-200">
        <span class="font-bold">무료 플랜</span>은 2개 그룹만 사용할 수 있습니다.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Groups List -->
    <div v-else-if="groups.length > 0" class="space-y-3">
      <div
        v-for="group in groups"
        :key="group.id"
        @click="navigateToGroup(group.id)"
        class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:border-lime-400 dark:hover:border-lime-500 transition-all cursor-pointer"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-bold text-zinc-900 dark:text-white mb-1">{{ group.name }}</h3>
            <div class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span class="flex items-center gap-1">
                <Users :size="14" />
                멤버 {{ group.member_count }}명
              </span>
              <span v-if="group.book_count" class="flex items-center gap-1">
                <BookOpen :size="14" />
                책 {{ group.book_count }}권
              </span>
              <span v-if="group.is_owner" class="px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 rounded-full text-[10px] font-bold">
                내가 만듦
              </span>
            </div>
          </div>
          <ChevronRight :size="20" class="text-zinc-400 flex-shrink-0 mt-1" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users :size="32" class="text-zinc-400" />
      </div>
      <p class="text-zinc-600 dark:text-zinc-400 mb-4">참여 중인 그룹이 없습니다</p>
      <button
        @click="router.push('/')"
        class="px-6 py-2 bg-lime-400 hover:bg-lime-500 text-black font-bold rounded-xl transition-colors"
      >
        그룹 둘러보기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users, BookOpen, ChevronRight } from 'lucide-vue-next'
import { useUserStore } from '~/stores/user'
import { useSubscription } from '~/composables/useSubscription'

const router = useRouter()
const userStore = useUserStore()
const client = useSupabaseClient()
const { isPremium } = useSubscription()

const emit = defineEmits(['refresh-stats'])

const loading = ref(true)
const groups = ref<any[]>([])

const fetchGroups = async () => {
  const userId = userStore.profile?.id
  if (!userId) return

  loading.value = true

  try {
    // Fetch groups where user is a member
    const { data: memberData, error: memberError } = await client
      .from('group_members')
      .select(`
        group_id,
        groups!inner (
          id,
          name,
          created_at,
          created_by,
          deleted_at
        )
      `)
      .eq('user_id', userId)
      .is('left_at', null)
      .is('groups.deleted_at', null)

    if (memberError) throw memberError

    // Get member counts and book counts for each group
    const groupIds = memberData?.map((m: any) => m.groups.id) || []

    const [{ data: memberCounts }, { data: bookCounts }] = await Promise.all([
      client
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)
        .is('left_at', null),
      client
        .from('group_books')
        .select('group_id')
        .in('group_id', groupIds)
    ])

    // Count members and books per group
    const memberCountMap = new Map<string, number>()
    const bookCountMap = new Map<string, number>()

    memberCounts?.forEach((m: any) => {
      memberCountMap.set(m.group_id, (memberCountMap.get(m.group_id) || 0) + 1)
    })

    bookCounts?.forEach((b: any) => {
      bookCountMap.set(b.group_id, (bookCountMap.get(b.group_id) || 0) + 1)
    })

    // Format groups data
    groups.value = memberData?.map((m: any) => ({
      id: m.groups.id,
      name: m.groups.name,
      created_at: m.groups.created_at,
      is_owner: m.groups.created_by === userId,
      member_count: memberCountMap.get(m.groups.id) || 0,
      book_count: bookCountMap.get(m.groups.id) || 0
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []

  } catch (error) {
    console.error('[ProfileGroupsTab] Error fetching groups:', error)
  } finally {
    loading.value = false
  }
}

const navigateToGroup = (groupId: string) => {
  router.push(`/group/${groupId}`)
}

onMounted(() => {
  fetchGroups()
})
</script>
