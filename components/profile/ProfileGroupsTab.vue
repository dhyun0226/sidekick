<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- Active Groups -->
      <div v-if="activeGroups.length > 0">
        <h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">활성 그룹</h3>
        <div class="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-apple divide-y divide-zinc-100 dark:divide-zinc-800">
          <div
            v-for="group in activeGroups"
            :key="group.id"
            class="px-4 py-3"
          >
            <!-- Row 1: Name + Badges -->
            <div class="flex items-center justify-between mb-2 cursor-pointer" @click="navigateToGroup(group.id)">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-semibold text-sm text-zinc-900 dark:text-white truncate">{{ group.name }}</span>
                <Badge v-if="group.role === 'admin'" variant="purple" size="sm">그룹장</Badge>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <Badge size="sm">
                  <template #icon><User :size="10" /></template>
                  {{ group.member_count }}
                </Badge>
                <Badge size="sm">
                  <template #icon><BookOpen :size="10" /></template>
                  {{ group.book_count }}
                </Badge>
                <ChevronRight :size="14" class="text-zinc-300 dark:text-zinc-500" />
              </div>
            </div>

            <!-- Row 2: Actions -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                @click="openBookManageModal(group)"
                class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
              >
                <Library :size="11" />
                책 관리
              </button>
              <button
                @click="copyInviteCode(group)"
                class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <Copy :size="11" />
                코드 복사
              </button>
              <template v-if="group.role === 'admin'">
                <button
                  @click="regenerateInviteCode(group)"
                  class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                >
                  <RefreshCw :size="11" />
                  재생성
                </button>
                <button
                  @click="openRenameModal(group)"
                  class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  <Pencil :size="11" />
                  이름
                </button>
                <button
                  @click="confirmArchiveGroup(group)"
                  class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                >
                  <Archive :size="11" />
                  종료
                </button>
              </template>
              <button
                @click="confirmLeaveGroup(group)"
                class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <LogOut :size="11" />
                나가기
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Archived Groups -->
      <div v-if="archivedGroups.length > 0">
        <h3 class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">지난 그룹</h3>
        <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-apple divide-y divide-zinc-200 dark:divide-zinc-800">
          <div
            v-for="group in archivedGroups"
            :key="group.id"
            class="px-4 py-3 opacity-60"
          >
            <!-- Row 1: Name + Badges -->
            <div class="flex items-center justify-between mb-2 cursor-pointer" @click="navigateToGroup(group.id)">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-medium text-sm text-zinc-600 dark:text-zinc-400 truncate">{{ group.name }}</span>
                <Badge v-if="group.deleted_at" variant="default" size="sm">종료됨</Badge>
                <Badge v-else-if="group.left_at" variant="default" size="sm">나감</Badge>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <Badge size="sm">
                  <template #icon><BookOpen :size="10" /></template>
                  {{ group.book_count }}
                </Badge>
                <ChevronRight :size="14" class="text-zinc-300 dark:text-zinc-500" />
              </div>
            </div>

            <!-- Row 2: Actions -->
            <div class="flex items-center gap-1.5">
              <button
                @click="openBookManageModal(group)"
                class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
              >
                <Library :size="11" />
                책 관리
              </button>
              <button
                @click="confirmLeaveGroup(group)"
                class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <Trash2 :size="11" />
                목록에서 제거
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="groups.length === 0" class="text-center py-12">
        <Users :size="32" class="text-zinc-300 dark:text-zinc-500 mx-auto mb-3" />
        <p class="text-[15px] font-medium text-zinc-900 dark:text-white mb-1">참여 중인 그룹이 없어요</p>
        <p class="text-[13px] text-zinc-400">그룹에 참여하거나 새로운 그룹을 만들어보세요</p>
      </div>
    </template>

    <!-- Rename Modal -->
    <TextInputModal
      :isOpen="renameModalOpen"
      title="그룹 이름 변경"
      :placeholder="selectedGroup?.name"
      :initialValue="selectedGroup?.name"
      confirmText="변경"
      @confirm="handleRename"
      @cancel="renameModalOpen = false"
    />

    <!-- Leave Confirm Modal -->
    <ConfirmModal
      :isOpen="leaveModalOpen"
      variant="danger"
      :title="getLeaveModalTitle()"
      :message="getLeaveModalMessage()"
      :description="getLeaveModalDescription()"
      :confirm-text="selectedGroup?.deleted_at || selectedGroup?.left_at ? '제거' : '나가기'"
      cancel-text="취소"
      @confirm="handleLeaveGroup"
      @cancel="leaveModalOpen = false"
    />

    <!-- Archive Confirm Modal -->
    <ConfirmModal
      :isOpen="archiveModalOpen"
      variant="warning"
      title="그룹 종료"
      :message="`'${selectedGroup?.name}'을(를) 종료할까요?`"
      description="그룹을 종료하면 모든 멤버가 더 이상 활동할 수 없습니다. 지금까지의 기록은 모두 유지됩니다."
      confirm-text="종료"
      cancel-text="취소"
      @confirm="handleArchiveGroup"
      @cancel="archiveModalOpen = false"
    />

    <!-- Book Management Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="bookManageModalOpen" class="fixed inset-0 z-50 flex items-end justify-center">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50" @click="closeBookManageModal"></div>

          <!-- Modal Content -->
          <div class="relative bg-white dark:bg-zinc-900 rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
            <!-- Header -->
            <div class="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-zinc-900 dark:text-white">책 관리</h3>
                <p class="text-xs text-zinc-500">{{ bookManageGroup?.name }}</p>
              </div>
              <button @click="closeBookManageModal" class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X :size="20" class="text-zinc-500" />
              </button>
            </div>

            <!-- Book List -->
            <div class="overflow-y-auto max-h-[60vh] p-4">
              <!-- Loading -->
              <div v-if="bookManageLoading" class="flex justify-center py-8">
                <div class="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
              </div>

              <!-- Empty -->
              <div v-else-if="bookManageBooks.length === 0" class="text-center py-12">
                <p class="text-zinc-400 text-sm">이 그룹에서 읽은 책이 없습니다</p>
              </div>

              <!-- Books -->
              <div v-else class="space-y-3">
                <div
                  v-for="book in bookManageBooks"
                  :key="book.id"
                  class="flex items-center gap-3 p-3 rounded-2xl transition-colors"
                  :class="[
                    book.hidden
                      ? 'bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] opacity-60'
                      : 'bg-white dark:bg-zinc-800 ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
                    book.isDeleted ? 'ring-1 ring-red-200 dark:ring-red-900' : ''
                  ]"
                >
                  <!-- Cover -->
                  <div class="w-12 h-16 flex-shrink-0 overflow-hidden rounded shadow-apple relative">
                    <img :src="book.cover_url" class="w-full h-full object-cover" />
                    <div v-if="book.isDeleted" class="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span class="text-[8px] font-semibold text-white bg-red-500 px-1 rounded">삭제됨</span>
                    </div>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-zinc-900 dark:text-white truncate">{{ book.title }}</p>
                    <p class="text-[11px] text-zinc-500 truncate">
                      {{ book.author }}
                      <template v-if="book.publisher">
                        <span class="text-zinc-300 dark:text-zinc-500"> · </span>{{ book.publisher }}
                      </template>
                      <template v-if="book.total_pages">
                        <span class="text-zinc-300 dark:text-zinc-500"> · </span>{{ book.total_pages }}p
                      </template>
                    </p>
                    <div class="flex items-center gap-1 mt-1.5 flex-wrap">
                      <GenreBadge v-if="book.genre" :genre="book.genre" size="sm" />
                      <Badge v-if="book.finished_at" variant="lime" size="sm">완독</Badge>
                      <Badge v-else size="sm">{{ book.progress_pct }}%</Badge>
                    </div>
                  </div>

                  <!-- Buttons -->
                  <div class="flex items-center gap-1">
                    <!-- Restore Button (admin only, deleted books) -->
                    <button
                      v-if="book.isDeleted && bookManageGroup?.role === 'admin'"
                      @click="restoreBook(book)"
                      class="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="복구"
                    >
                      <RotateCcw :size="18" />
                    </button>

                    <!-- Hide/Show Toggle -->
                    <button
                      @click="toggleBookHidden(book)"
                      class="p-2 rounded-lg transition-colors"
                      :class="book.hidden
                        ? 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        : 'text-lime-600 hover:bg-lime-50 dark:hover:bg-lime-900/20'"
                      :title="book.hidden ? '서재에 표시' : '서재에서 숨기기'"
                    >
                      <EyeOff v-if="book.hidden" :size="18" />
                      <Eye v-else :size="18" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 p-4">
              <p class="text-[11px] text-zinc-400 text-center">
                숨긴 책은 프로필 서재에서 보이지 않습니다
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Users, BookOpen, ChevronRight, Copy, RefreshCw, Pencil, Archive, LogOut, Trash2, Library, Eye, EyeOff, X, RotateCcw } from 'lucide-vue-next'
import GenreBadge from '~/components/GenreBadge.vue'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import ConfirmModal from '~/components/ConfirmModal.vue'
import TextInputModal from '~/components/TextInputModal.vue'
import Badge from '~/components/Badge.vue'

const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()

const emit = defineEmits(['refresh-stats', 'refresh-library'])

const loading = ref(true)
const groups = ref<any[]>([])

// Computed
// 활성 그룹: 종료되지 않았고(deleted_at null), 내가 나가지 않은(left_at null) 그룹
const activeGroups = computed(() => groups.value.filter(g => !g.deleted_at && !g.left_at))
// 지난 그룹: 종료된 그룹(deleted_at) 또는 내가 나간 그룹(left_at)
const archivedGroups = computed(() => groups.value.filter(g => g.deleted_at || g.left_at))

// Modal states
const selectedGroup = ref<any>(null)
const leaveModalOpen = ref(false)
const archiveModalOpen = ref(false)
const renameModalOpen = ref(false)

// Book management modal
const bookManageModalOpen = ref(false)
const bookManageGroup = ref<any>(null)
const bookManageBooks = ref<any[]>([])
const bookManageLoading = ref(false)

const fetchGroups = async () => {
  const userId = userStore.profile?.id
  if (!userId) return

  loading.value = true

  try {
    const { data: memberData, error: memberError } = await client
      .from('group_members')
      .select(`
        group_id,
        role,
        left_at,
        groups!inner (
          id,
          name,
          group_type,
          created_at,
          created_by,
          deleted_at,
          invite_code
        )
      `)
      .eq('user_id', userId)
      .neq('groups.group_type', 'solo')

    if (memberError) throw memberError

    const groupIds = memberData?.map((m: any) => m.groups.id) || []

    if (groupIds.length === 0) {
      groups.value = []
      return
    }

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

    const memberCountMap = new Map<string, number>()
    const bookCountMap = new Map<string, number>()

    memberCounts?.forEach((m: any) => {
      memberCountMap.set(m.group_id, (memberCountMap.get(m.group_id) || 0) + 1)
    })

    bookCounts?.forEach((b: any) => {
      bookCountMap.set(b.group_id, (bookCountMap.get(b.group_id) || 0) + 1)
    })

    groups.value = memberData?.map((m: any) => ({
      id: m.groups.id,
      name: m.groups.name,
      group_type: m.groups.group_type,
      created_at: m.groups.created_at,
      deleted_at: m.groups.deleted_at,
      left_at: m.left_at,
      invite_code: m.groups.invite_code,
      is_owner: m.groups.created_by === userId,
      role: m.role,
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

const copyInviteCode = async (group: any) => {
  try {
    await navigator.clipboard.writeText(group.invite_code)
    toast.success('초대 코드가 복사되었습니다')
  } catch {
    toast.error('복사에 실패했습니다')
  }
}

const regenerateInviteCode = async (group: any) => {
  try {
    // 8자리 코드 생성 (DB 함수와 동일한 형식)
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    let newCode = generateCode()
    let attempts = 0

    // 중복 체크 (최대 10번 시도)
    while (attempts < 10) {
      const { data: existing } = await client
        .from('groups')
        .select('id')
        .eq('invite_code', newCode)
        .neq('id', group.id)
        .maybeSingle()

      if (!existing) break
      newCode = generateCode()
      attempts++
    }

    const { error } = await client
      .from('groups')
      .update({ invite_code: newCode })
      .eq('id', group.id)

    if (error) throw error

    group.invite_code = newCode
    toast.success('초대 코드가 재생성되었습니다')
  } catch {
    toast.error('재생성에 실패했습니다')
  }
}

const openRenameModal = (group: any) => {
  selectedGroup.value = group
  renameModalOpen.value = true
}

const handleRename = async (newName: string) => {
  if (!selectedGroup.value || !newName.trim()) return

  try {
    const { error } = await client
      .from('groups')
      .update({ name: newName.trim() })
      .eq('id', selectedGroup.value.id)

    if (error) throw error

    selectedGroup.value.name = newName.trim()
    await fetchGroups()
    toast.success('그룹 이름이 변경되었습니다')
  } catch {
    toast.error('변경에 실패했습니다')
  } finally {
    renameModalOpen.value = false
    selectedGroup.value = null
  }
}

const confirmArchiveGroup = (group: any) => {
  selectedGroup.value = group
  archiveModalOpen.value = true
}

const handleArchiveGroup = async () => {
  if (!selectedGroup.value) return

  try {
    const groupId = selectedGroup.value.id

    // 1. 그룹 종료
    const { error } = await client
      .from('groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId)

    if (error) throw error

    // 2. 중단된 책(완독 안 한 책) 자동 숨김 처리
    // 해당 그룹의 group_books 조회
    const { data: groupBooks } = await client
      .from('group_books')
      .select('id')
      .eq('group_id', groupId)

    if (groupBooks && groupBooks.length > 0) {
      const groupBookIds = groupBooks.map(gb => gb.id)

      // 완독 안 한 책(finished_at이 null)만 숨김 처리
      await client
        .from('user_reading_progress')
        .update({ hidden: true })
        .in('group_book_id', groupBookIds)
        .is('finished_at', null)
    }

    await fetchGroups()
    emit('refresh-stats')
    emit('refresh-library')
    toast.success('그룹이 종료되었습니다')
  } catch {
    toast.error('종료에 실패했습니다')
  } finally {
    archiveModalOpen.value = false
    selectedGroup.value = null
  }
}

const confirmLeaveGroup = (group: any) => {
  selectedGroup.value = group
  leaveModalOpen.value = true
}

// Modal content helpers
const getLeaveModalTitle = () => {
  if (!selectedGroup.value) return ''
  if (selectedGroup.value.deleted_at || selectedGroup.value.left_at) {
    return '목록에서 제거'
  }
  return '그룹 나가기'
}

const getLeaveModalMessage = () => {
  if (!selectedGroup.value) return ''
  const name = selectedGroup.value.name
  if (selectedGroup.value.deleted_at || selectedGroup.value.left_at) {
    return `'${name}'을(를) 목록에서 제거할까요?`
  }
  return `'${name}'에서 나갈까요?`
}

const getLeaveModalDescription = () => {
  if (!selectedGroup.value) return ''

  // Case 1: Removing ended group (deleted_at exists)
  if (selectedGroup.value.deleted_at) {
    return '종료된 그룹을 목록에서 제거합니다. 이 그룹의 독서 기록이 서재에서 사라지며, 종료된 그룹은 다시 참여할 수 없습니다.'
  }

  // Case 2: Removing left group (left_at exists but not deleted_at)
  if (selectedGroup.value.left_at) {
    return '그룹을 목록에서 제거합니다. 이 그룹의 독서 기록이 서재에서 사라지지만, 초대 코드로 다시 참여하면 기록이 복원됩니다.'
  }

  // Case 3: Leaving active group
  return '그룹에서 탈퇴하면 지난 그룹 목록으로 이동합니다. 독서 기록은 서재에서 계속 볼 수 있으며, 다시 참여하면 이어서 활동할 수 있습니다.'
}

const handleLeaveGroup = async () => {
  if (!selectedGroup.value) return

  const userId = userStore.profile?.id
  if (!userId) {
    toast.error('사용자 정보를 찾을 수 없습니다')
    return
  }

  try {
    // Case 1 & 2: Removing from "지난 그룹" (either ended or left group)
    if (selectedGroup.value.deleted_at || selectedGroup.value.left_at) {
      const { error } = await client
        .from('group_members')
        .delete()
        .eq('group_id', selectedGroup.value.id)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('목록에서 제거되었습니다')
    } else {
      // Case 3: Leaving active group → set left_at (goes to 지난 그룹)
      const { error } = await client
        .from('group_members')
        .update({ left_at: new Date().toISOString() })
        .eq('group_id', selectedGroup.value.id)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('그룹에서 나갔습니다')
    }

    await fetchGroups()
    emit('refresh-stats')
  } catch (error) {
    console.error('Leave group error:', error)
    toast.error('처리에 실패했습니다')
  } finally {
    leaveModalOpen.value = false
    selectedGroup.value = null
  }
}

// Book management functions
const openBookManageModal = async (group: any) => {
  bookManageGroup.value = group
  bookManageModalOpen.value = true
  bookManageLoading.value = true

  try {
    const userId = userStore.profile?.id
    if (!userId) return

    // Fetch all books in this group that I have reading progress for
    const { data, error } = await client
      .from('user_reading_progress')
      .select(`
        id,
        hidden,
        progress_pct,
        finished_at,
        group_book:group_books!inner (
          id,
          isbn,
          status,
          deleted_at,
          pages_snapshot,
          genre_snapshot,
          book:books (
            title,
            author,
            publisher,
            cover_url,
            official_pages,
            draft_pages,
            official_genre,
            draft_genre
          )
        )
      `)
      .eq('user_id', userId)
      .eq('group_book.group_id', group.id)

    if (error) throw error

    bookManageBooks.value = data?.map((p: any) => ({
      id: p.id,
      group_book_id: p.group_book.id,
      isbn: p.group_book.isbn,
      title: p.group_book.book?.title,
      author: p.group_book.book?.author,
      publisher: p.group_book.book?.publisher,
      cover_url: p.group_book.book?.cover_url,
      total_pages: p.group_book.pages_snapshot || p.group_book.book?.official_pages || p.group_book.book?.draft_pages,
      genre: p.group_book.genre_snapshot || p.group_book.book?.official_genre || p.group_book.book?.draft_genre,
      status: p.group_book.status,
      isDeleted: p.group_book.deleted_at != null,
      hidden: p.hidden,
      progress_pct: p.progress_pct,
      finished_at: p.finished_at
    })) || []
  } catch (error) {
    console.error('[BookManage] Error fetching books:', error)
    toast.error('책 목록을 불러오지 못했습니다')
  } finally {
    bookManageLoading.value = false
  }
}

const toggleBookHidden = async (book: any) => {
  try {
    const newHidden = !book.hidden
    const { error } = await client
      .from('user_reading_progress')
      .update({ hidden: newHidden })
      .eq('id', book.id)

    if (error) throw error

    book.hidden = newHidden
    toast.success(newHidden ? '서재에서 숨겼습니다' : '서재에 표시합니다')
    emit('refresh-library')
  } catch (error) {
    console.error('[BookManage] Error toggling hidden:', error)
    toast.error('변경에 실패했습니다')
  }
}

const restoreBook = async (book: any) => {
  try {
    // 1. 책 복구 (deleted_at = null)
    const { error: restoreError } = await client
      .from('group_books')
      .update({ deleted_at: null })
      .eq('id', book.group_book_id)

    if (restoreError) throw restoreError

    // 2. 모든 멤버의 서재에서 숨김 해제
    const { error: hiddenError } = await client
      .from('user_reading_progress')
      .update({ hidden: false })
      .eq('group_book_id', book.group_book_id)

    if (hiddenError) throw hiddenError

    // 로컬 상태 업데이트
    book.isDeleted = false
    book.hidden = false

    toast.success('책이 복구되었습니다')
    emit('refresh-library')
  } catch (error) {
    console.error('[BookManage] Error restoring book:', error)
    toast.error('복구에 실패했습니다')
  }
}

const closeBookManageModal = () => {
  bookManageModalOpen.value = false
  bookManageGroup.value = null
  bookManageBooks.value = []
}

onMounted(() => {
  fetchGroups()
})
</script>
