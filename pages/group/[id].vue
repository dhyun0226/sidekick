<template>
  <div class="relative min-h-[100dvh] bg-gray-50 dark:bg-background pb-32">
    <!-- 1. Fixed Navigation Bar (Always visible) -->
    <NavigationBar
      :title="bookTitle || groupName"
      :is-scrolled="isScrolled"
      @back="router.push('/')"
      @open-drawer="modals.drawer = true"
    />

    <!-- 2. Hero Section (Immersive Book Info) -->
    <BookHeroSection
      :book="selectedBook ? {
        coverUrl: bookCover,
        title: bookTitle,
        author: bookAuthor,
        status: selectedBook.status,
        round: currentBookRound,
        finishedAt: selectedBook.finished_at
      } : null"
      :days-remaining="daysRemaining"
      :member-count="members.length"
    />

    <!-- Timeline Content (Flows naturally) -->
    <div class="px-safe max-w-[480px] mx-auto min-h-[50vh]">
      <!-- 책이 없을 때 Empty State (기존 유지) -->
      <div v-if="!selectedBook" class="flex flex-col items-center justify-center pt-32 px-4">
        <div class="w-24 h-24 bg-gradient-to-br from-lime-100 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span class="text-5xl">📚</span>
        </div>
        <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">함께 읽을 책을 정해주세요</h2>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8 max-w-xs leading-relaxed">
          오른쪽 상단 메뉴에서<br />"새 책 시작하기"를 눌러보세요!
        </p>
        <button
          @click="modals.drawer = true"
          class="px-6 py-3 bg-lime-400 text-black font-bold rounded-xl hover:bg-lime-300 transition-all shadow-lg hover:shadow-lime-400/30 flex items-center gap-2"
        >
          <Menu :size="20" />
          메뉴 열기
        </button>
      </div>

      <!-- 책이 있을 때 Timeline 표시 -->
      <Timeline
        v-else
        :comments="comments"
        :viewProgress="viewProgress"
        :currentUserId="currentUserId"
        @modalOpen="modals.comment = true"
        @modalClose="modals.comment = false"
        @writeComment="handleWriteFromModal"
      />
    </div>

    <!-- Smart Slider (읽는 중이거나 완독한 책) -->
    <SmartSlider
      v-if="selectedBook && !modals.comment"
      v-model="viewProgress"
      :toc="toc"
      :totalPages="selectedBook.book?.total_pages"
      :members="selectedBook.status === 'reading' ? sliderMembers : []"
      @change="handleSliderChange"
      @write="handleWrite"
    />

    <!-- Comment Input Overlay -->
    <CommentInputOverlay
      :is-open="modals.commentInput"
      :chapter-name="currentChapterName"
      :position="viewProgress"
      :initial-anchor-text="newAnchorText"
      :anchor-text-locked="anchorTextLocked"
      @close="closeCommentInput"
      @submit="handleCommentSubmit"
    />

    <!-- Side Drawer -->
    <GroupDrawer
      :is-open="modals.drawer"
      :group-name="groupName"
      :current-book="currentBook"
      :selected-book-id="selectedBookId"
      :reading-books="readingBooks"
      :history-books="historyBooks"
      :sorted-members-with-progress="sortedMembersWithProgress"
      :is-admin="isAdmin"
      :current-user-id="currentUserId"
      :invite-code="group?.invite_code || ''"
      :toc="toc"
      :view-progress="viewProgress"
      @close="modals.drawer = false"
      @select-book="selectBook"
      @jump-to-chapter="jumpToChapter"
      @edit-dates="openEditDatesModal"
      @edit-toc="openEditTocModal"
      @mark-completed="openMarkCompletedModal"
      @delete-book="openDeleteBookModal"
      @open-reviews="openReviews"
      @copy-invite-code="copyInviteCode"
      @copy-invite-link="copyInviteLink"
      @save-group-name="saveGroupName"
      @open-search-modal="modals.search = true"
      @leave-group="leaveGroup"
      @delete-group="deleteGroup"
      @change-member-role="handleChangeMemberRole"
      @kick-member="handleKickMember"
    />

    <!-- Book Search Modal -->
    <BookSearchModal
      :isOpen="modals.search"
      @close="modals.search = false"
      @confirm="handleBookAdd"
    />

    <!-- Review Modal -->
    <ReviewModal
      :isOpen="modals.review"
      :initialRating="reviewInitialData.rating"
      :initialContent="reviewInitialData.content"
      :isEditing="isEditingReview"
      @close="modals.review = false"
      @submit="handleReviewSubmit"
    />

    <!-- Reviews Modal (All Member Reviews) -->
    <ReviewsModal
      :isOpen="modals.reviews"
      :bookTitle="reviewsBookTitle"
      :reviews="reviews"
      @close="modals.reviews = false; reviews = []"
    />

    <!-- Group Stats Modal -->
    <GroupStatsModal
      :isOpen="modals.groupStats"
      :groupId="groupId"
      :groupName="groupName"
      @close="modals.groupStats = false"
    />

    <!-- Book Admin Modals -->
    <BookAdminModals
      :edit-dates-open="modals.editDates"
      :edit-toc-open="modals.editToc"
      :mark-completed-open="modals.markCompleted"
      :delete-book-open="modals.deleteBook"
      :current-book="modals.editingBook"
      :comment-count="commentCount"
      @close-edit-dates="modals.editDates = false; modals.editingBook = null"
      @close-edit-toc="modals.editToc = false; modals.editingBook = null"
      @close-mark-completed="modals.markCompleted = false; modals.editingBook = null"
      @close-delete-book="modals.deleteBook = false; modals.editingBook = null"
      @save-edited-dates="saveEditedDates"
      @save-edited-toc="saveEditedToc"
      @mark-as-completed="markAsCompleted"
      @delete-book="deleteBook"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import Timeline from '~/components/Timeline.vue'
import SmartSlider from '~/components/SmartSlider.vue'
import BookSearchModal from '~/components/BookSearchModal.vue'
import ReviewModal from '~/components/ReviewModal.vue'
import ReviewsModal from '~/components/group/ReviewsModal.vue'
import NavigationBar from '~/components/group/NavigationBar.vue'
import BookHeroSection from '~/components/group/BookHeroSection.vue'
import CommentInputOverlay from '~/components/group/CommentInputOverlay.vue'
import BookAdminModals from '~/components/group/BookAdminModals.vue'
import GroupDrawer from '~/components/group/drawer/GroupDrawer.vue'
import { Menu, Search, Plus, Settings, Share2, ChevronLeft, ChevronRight, ChevronDown, LogOut, MoreVertical, UserCheck, UserX, Edit2, Send, X, BarChart3, Copy, User } from 'lucide-vue-next'
import GroupStatsModal from '~/components/GroupStatsModal.vue'

// 인증 미들웨어 적용
definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const client = useSupabaseClient()
const { getBookRound } = useBookRound()
const { formatDateRange, getDaysRemaining, getTotalDays, getDaysSinceStart } = useDateUtils()

// ===== Core Data & State =====
const groupId = route.params.id as string
const viewProgress = ref(0)
const currentUserId = computed(() => userStore.profile?.id)

// ===== Composables =====
// Books management
const {
  currentBook,
  readingBooks,
  historyBooks,
  selectedBookId,
  selectedBook,
  allBooks,
  fetchBooks,
  addBook,
  updateDates,
  updateToc,
  markCompleted: markBookCompleted,
  deleteBook: deleteBookFromGroup
} = useGroupBooks(groupId)

// Reading progress
const {
  memberProgress,
  updateOptimistic,
  saveProgress,
  loadProgress,
  loadMemberProgress
} = useReadingProgress(computed(() => selectedBookId.value), currentUserId)

// Comments
const {
  comments,
  fetchComments,
  submitComment,
  addComment
} = useGroupComments(currentUserId.value)

// Modal states - consolidated into single reactive object (must be before useRealtimeSubscriptions)
const modals = reactive({
  drawer: false,
  search: false,
  review: false,
  reviews: false,
  comment: false,
  groupStats: false,
  commentInput: false,
  editDates: false,
  editToc: false,
  markCompleted: false,
  deleteBook: false,
  editingBook: null as any  // 편집 중인 책 (selectedBookId와 독립적)
})

// Realtime subscriptions
const {
  setupCommentSubscription,
  setupProgressSubscription,
  cleanup: cleanupSubscriptions
} = useRealtimeSubscriptions(
  selectedBookId,
  computed(() => modals.drawer),
  currentUserId,
  (comment) => addComment(comment),
  (progress) => {
    const index = memberProgress.value.findIndex(p => p.user_id === progress.user_id)
    if (index >= 0) {
      memberProgress.value[index] = progress
    } else {
      memberProgress.value.push(progress)
    }
  }
)

// ===== Additional State =====
const reviewInitialData = ref({ rating: 0, content: '' })
const isEditingReview = ref(false)
const reviews = ref<any[]>([])
const reviewsBookTitle = ref('')
const newAnchorText = ref('')
const anchorTextLocked = ref(false)
const activeMemberMenu = ref<string | null>(null)
const showMemberProgress = ref(false)
const group = ref<any>(null)
const currentBookRound = ref<number | null>(null)
const members = ref<any[]>([])
const editingGroupName = ref('')
const isScrolled = ref(false)

// Computed
const groupName = computed(() => group.value?.name || 'Loading...')
const bookTitle = computed(() => selectedBook.value?.book?.title || 'No Book Selected')
const bookRoundLabel = computed(() => {
  if (currentBookRound.value === null) return ''
  return `[${currentBookRound.value}회]`
})
const bookAuthor = computed(() => selectedBook.value?.book?.author || '')
const bookCover = computed(() => selectedBook.value?.book?.cover_url || '')
const toc = computed(() => selectedBook.value?.toc_snapshot || []) // Use snapshot or default
const currentChapterName = computed(() => {
  const pct = viewProgress.value
  const chapters = toc.value

  if (!chapters || chapters.length === 0) return 'Reading'

  const found = chapters.find((c: any, index: number) => {
    const isLast = index === chapters.length - 1  // Fixed: chapters is already an array
    if (isLast) {
      return pct >= c.start && pct <= c.end
    } else {
      return pct >= c.start && pct < c.end
    }
  })

  if (!found && pct < chapters[0]?.start) {
    return chapters[0]?.title || 'Start'
  }

  return found ? found.title : 'End'
})

// Reading period computed properties - using useDateUtils composable
const daysRemaining = computed(() => getDaysRemaining(selectedBook.value?.target_end_date))
const totalReadingDays = computed(() => getTotalDays(selectedBook.value?.target_start_date, selectedBook.value?.target_end_date))
const daysSinceStart = computed(() => getDaysSinceStart(selectedBook.value?.target_start_date))
const progressStatus = computed(() => {
  if (!totalReadingDays.value || !daysSinceStart.value) return 'unknown'
  const expectedProgress = (daysSinceStart.value / totalReadingDays.value) * 100
  const actualProgress = viewProgress.value
  if (actualProgress >= expectedProgress + 10) return 'ahead'
  if (actualProgress < expectedProgress - 10) return 'behind'
  return 'on-track'
})

const isAdmin = computed(() => {
  const userId = currentUserId.value
  if (!userId) return false
  const member = members.value.find(m => m.id === userId)
  return member?.role === 'admin'
})
const commentCount = computed(() => comments.value.length)

// Sorted members with progress
const sortedMembersWithProgress = computed(() => {
  const { formatTimeAgo, isInactive, formatShortDate } = useDateUtils()

  const membersWithData = members.value.map(member => {
    const progressData = memberProgress.value.find(p => p.user_id === member.id)

    // 진행도 (현재 사용자는 viewProgress 사용)
    const progress = member.id === currentUserId.value
      ? Math.round(viewProgress.value)
      : progressData?.progress_pct || 0

    // 마지막 활동 시간
    const lastReadAt = progressData?.last_read_at
    const timeAgo = lastReadAt ? formatTimeAgo(lastReadAt) : null
    const inactive = lastReadAt ? isInactive(lastReadAt) : true

    // 완독 정보 (History 책에서만 완독 체크 표시)
    const finishedAt = progressData?.finished_at
    const finishedDate = finishedAt ? formatShortDate(new Date(finishedAt)) : null
    const isCompleted = selectedBook.value?.status === 'done' && finishedAt !== null

    return {
      ...member,
      progress,
      timeAgo,
      inactive,
      finishedAt,
      finishedDate,
      isCompleted
    }
  })

  // 정렬: Reading 책은 진행도 순, History 책은 완독 날짜 순
  if (selectedBook.value?.status === 'done') {
    // History 책: 완독 빠른 순 (완독한 사람 우선, 그 다음 날짜 빠른 순)
    return membersWithData.sort((a, b) => {
      // 1. 완독한 사람 우선
      if (a.isCompleted && !b.isCompleted) return -1
      if (!a.isCompleted && b.isCompleted) return 1

      // 2. 둘 다 완독: 빨리 완독한 순 (오름차순)
      if (a.isCompleted && b.isCompleted && a.finishedAt && b.finishedAt) {
        return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
      }

      // 3. 둘 다 미완독: 진행도 높은 순
      return b.progress - a.progress
    })
  } else {
    // Reading 책: 진행도 높은 순 (내림차순)
    return membersWithData.sort((a, b) => b.progress - a.progress)
  }
})

// Slider members (exclude me, show top performers)
const sliderMembers = computed(() => {
  // 나를 제외한 멤버들
  const othersWithProgress = sortedMembersWithProgress.value
    .filter(m => m.id !== currentUserId.value)

  if (othersWithProgress.length === 0) return []

  // 4명 이하: 모두 표시
  if (othersWithProgress.length <= 4) {
    return othersWithProgress
  }

  // 5명 이상: 상위 3명만 표시
  return othersWithProgress.slice(0, 3)
})

// Fetch Data
// ===== Data Fetching =====
const fetchData = async () => {
  if (!userStore.user) return

  // Fetch group info
  const { data: groupData } = await client.from('groups').select('*').eq('id', groupId).single()
  if (groupData) {
    group.value = groupData
    editingGroupName.value = groupData.name
  }

  // Fetch members
  const { data: memberData } = await client
    .from('group_members')
    .select('*, user:users(*)')
    .eq('group_id', groupId)

  if (memberData) {
    members.value = memberData.map((m: any) => ({
      id: m.user.id,
      nickname: m.user.nickname,
      avatar_url: m.user.avatar_url,
      role: m.role
    }))
  }

  // Fetch books using Composable
  await fetchBooks()

  // Fetch comments for selected book
  if (selectedBookId.value) {
    await fetchComments(selectedBookId.value)
  }

  // Load user's reading progress
  if (currentUserId.value && selectedBookId.value) {
    const progress = await loadProgress(selectedBookId.value, currentUserId.value)
    viewProgress.value = progress
  }
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

// ===== Lifecycle =====
onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await userStore.fetchProfile()
  await fetchData()

  // Setup realtime subscriptions
  setupCommentSubscription()

  // 현재 진행도 위치로 자동 스크롤
  if (viewProgress.value > 0) {
    nextTick(() => {
      scrollToPosition(Math.round(viewProgress.value))
    })
  }
})

// Watch drawer for member progress loading
watch(() => modals.drawer, async (isOpen) => {
  if (isOpen && selectedBookId.value) {
    await loadMemberProgress(selectedBookId.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  cleanupSubscriptions()
})

// ===== Event Handlers =====
let progressSaveTimeout: NodeJS.Timeout | null = null
const handleSliderChange = async (val: number) => {
  viewProgress.value = val

  // 타임라인 스크롤
  nextTick(() => {
    scrollToPosition(Math.round(val))
  })

  // 100% 도달 시 리뷰 모달
  if (val >= 100) {
    setTimeout(async () => {
      if (!selectedBook.value || !currentUserId.value) return

      // Check for existing review for this group_book
      const { data: existingReview } = await client
        .from('reviews')
        .select('*')
        .eq('user_id', currentUserId.value)
        .eq('group_book_id', selectedBook.value.id)
        .maybeSingle()

      if (existingReview) {
        reviewInitialData.value = {
          rating: parseFloat(existingReview.rating),
          content: existingReview.content || ''
        }
        isEditingReview.value = true
      } else {
        reviewInitialData.value = { rating: 0, content: '' }
        isEditingReview.value = false
      }

      modals.review = true
    }, 500)
  }

  // Optimistic Update (from composable)
  updateOptimistic(val)

  // Save progress to DB (debounced)
  if (progressSaveTimeout) clearTimeout(progressSaveTimeout)
  progressSaveTimeout = setTimeout(async () => {
    if (!selectedBookId.value) return
    await saveProgress(val)
  }, 2000) // Save after 2 seconds (DB 부담 절감)
}

// Fetch book round number when current book changes
watch(currentBook, async (newBook) => {
  if (newBook && newBook.id && newBook.isbn) {
    currentBookRound.value = await getBookRound(groupId, newBook.isbn, newBook.id)
  } else {
    currentBookRound.value = null
  }
}, { immediate: true })

// Scroll helper function (only called explicitly when needed, e.g., jumpToChapter)
const scrollToPosition = (targetPct: number) => {
  // Find the closest comment group by position
  const groups = document.querySelectorAll('[data-position]')
  if (groups.length === 0) return

  let closestGroup: Element | null = null
  let closestDistance = Infinity

  groups.forEach(group => {
    const position = parseInt(group.getAttribute('data-position') || '0')
    const distance = Math.abs(position - targetPct)
    if (distance < closestDistance) {
      closestDistance = distance
      closestGroup = group
    }
  })

  if (closestGroup) {
    // Center the group in viewport for better visual alignment
    closestGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }
}

const handleWrite = () => {
  modals.commentInput = true
  anchorTextLocked.value = false
}

const handleWriteFromModal = (data: { anchorText: string, position: number }) => {
  // Pre-fill anchor text and position from modal
  newAnchorText.value = data.anchorText
  viewProgress.value = data.position
  anchorTextLocked.value = true
  modals.commentInput = true
}

const closeCommentInput = () => {
  modals.commentInput = false
  anchorTextLocked.value = false
  newAnchorText.value = ''
}

const { validateComment } = useValidation()

const handleCommentSubmit = async (payload: { content: string, anchorText: string | null, position: number }) => {
  if (!selectedBook.value || !currentUserId.value) return

  // Validate comment content
  const validation = validateComment(payload.content)
  if (!validation.valid) {
    toast.error(validation.message)
    return
  }

  try {
    // Use composable's submitComment method
    await submitComment(selectedBook.value.id, currentUserId.value, payload)

    // Close the overlay and reset state
    modals.commentInput = false
    newAnchorText.value = ''
    anchorTextLocked.value = false
  } catch (error: any) {
    toast.error('댓글 작성 실패: ' + error.message)
  }
}

const handleReviewSubmit = async (data: any) => {
  if (!selectedBook.value || !userStore.user) return

  try {
    if (!currentUserId.value) return

    console.log('[Review] Saving review for book:', selectedBook.value.id, selectedBook.value.book?.title)

    // Upsert review (insert or update)
    const { error } = await client
      .from('reviews')
      .upsert({
        user_id: currentUserId.value,
        group_book_id: selectedBook.value.id,
        rating: data.rating,
        content: data.content
      }, {
        onConflict: 'user_id,group_book_id'
      })

    if (error) {
      console.error('Review save error:', error)
      throw error
    }

    // 리뷰 개수 업데이트를 위해 책 목록 새로고침
    await fetchBooks()

    modals.review = false
    toast.success('리뷰가 저장되었습니다! 🎉')

  } catch (error: any) {
    console.error('Review error:', error)
    toast.error('리뷰 저장 실패: ' + (error.message || '알 수 없는 오류'))
  }
}

// ... (Keep existing helper functions: jumpToChapter, isCurrentChapter, openReviewModalForEdit, etc.) ...
// We need to keep the existing functions but ensure they use the new data refs if needed.
// Since we replaced the whole script block, I need to include them back.

const openSearchModal = () => {
  modals.drawer = false
  modals.search = true
}

// Admin book management handlers
const openEditDatesModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.editDates = true
}

const openEditTocModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.editToc = true
}

const openMarkCompletedModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.markCompleted = true
}

const openDeleteBookModal = (bookId: string) => {
  modals.editingBook = allBooks.value.find(b => b.id === bookId) || null
  modals.deleteBook = true
}

// Reviews modal
const fetchReviews = async (bookId: string) => {
  try {
    console.log('[Reviews] Fetching reviews for book:', bookId)

    // 1. 먼저 reviews만 가져오기
    const { data: reviewsData, error: reviewsError } = await client
      .from('reviews')
      .select('*')
      .eq('group_book_id', bookId)

    console.log('[Reviews] Reviews data:', reviewsData)

    if (reviewsError) throw reviewsError

    if (!reviewsData || reviewsData.length === 0) {
      reviews.value = []
      console.log('[Reviews] No reviews found')
      return
    }

    // 2. user_id들을 모아서 users 조회
    const userIds = [...new Set(reviewsData.map(r => r.user_id))]
    const { data: usersData, error: usersError } = await client
      .from('users')
      .select('id, nickname, avatar_url')
      .in('id', userIds)

    console.log('[Reviews] Users data:', usersData)

    if (usersError) {
      console.warn('[Reviews] Users fetch error:', usersError)
    }

    // 3. reviews와 users를 매핑
    const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
    reviews.value = reviewsData.map(r => {
      const user = usersMap.get(r.user_id)
      return {
        ...r,
        user: user ? {
          display_name: user.nickname || '익명',
          avatar_url: user.avatar_url
        } : { display_name: '익명', avatar_url: null }
      }
    })

    console.log('[Reviews] Final reviews:', reviews.value.length)
  } catch (error) {
    console.error('[Reviews] Error fetching reviews:', error)
    reviews.value = []
  }
}

const openReviews = async (bookId: string) => {
  const book = allBooks.value.find(b => b.id === bookId)
  if (!book) return

  // 이전 리뷰 데이터 초기화
  reviews.value = []
  reviewsBookTitle.value = book.book?.title || book.title || '책'

  // 모달 먼저 열기 (로딩 상태 표시)
  modals.reviews = true

  // 리뷰 데이터 로드
  await fetchReviews(bookId)
}

const saveEditedDates = async (dates: { startDate: string, endDate: string }) => {
  if (!modals.editingBook || !dates.startDate || !dates.endDate) return

  try {
    // Use composable's updateDates method
    await updateDates(modals.editingBook.id, dates.startDate, dates.endDate)

    // 로컬 상태 업데이트 (새로고침 없이 반영)
    await fetchBooks()

    modals.editDates = false
    modals.editingBook = null
    toast.success('독서 기간이 수정되었습니다! 📅')
  } catch (error) {
    console.error('Edit dates error:', error)
    toast.error('독서 기간 수정에 실패했습니다.')
  }
}

const markAsCompleted = async () => {
  if (!modals.editingBook) return

  try {
    // Use composable's markCompleted method
    await markBookCompleted(modals.editingBook.id)

    modals.markCompleted = false
    modals.editingBook = null
    toast.success('완독 처리되었습니다! 🎉 히스토리로 이동합니다.')

    // Refresh other data
    await fetchData()
  } catch (error) {
    console.error('Mark completed error:', error)
    toast.error('완독 처리에 실패했습니다.')
  }
}

const deleteBook = async () => {
  if (!modals.editingBook) return

  try {
    // Use composable's deleteBook method
    await deleteBookFromGroup(modals.editingBook.id)

    modals.deleteBook = false
    modals.editingBook = null
    toast.success('책이 삭제되었습니다.')

    // Refresh other data
    await fetchData()
  } catch (error) {
    console.error('Delete book error:', error)
    toast.error('책 삭제에 실패했습니다.')
  }
}

const saveEditedToc = async (tocData: { totalPages: number, chapters: { title: string, startPage: number }[] }) => {
  if (!modals.editingBook || !tocData.totalPages || tocData.totalPages <= 0) return

  try {
    // Use composable's updateToc method
    await updateToc(modals.editingBook.id, modals.editingBook.isbn, tocData.totalPages, tocData.chapters)

    // 로컬 상태 업데이트 (새로고침 없이 반영)
    await fetchBooks()

    modals.editToc = false
    modals.editingBook = null
    toast.success('목차가 수정되었습니다! 📑')
  } catch (error: any) {
    console.error('Save TOC error:', error)
    toast.error('수정 실패: ' + error.message)
  }
}

const handleBookAdd = async (data: any) => {
  try {
    // Use composable's addBook method
    await addBook(data)

    // Refresh other data
    await fetchData()

    toast.success('새 책이 추가되었습니다! 🎉')
  } catch (error: any) {
    console.error('[Group] Book add error:', error)
    toast.error(error.message || '책 추가 중 오류가 발생했습니다.')
  }
}

const saveGroupName = async () => {
  if (!editingGroupName.value.trim()) {
    toast.warning('그룹 이름을 입력해주세요.')
    return
  }

  if (editingGroupName.value.trim().length < 2) {
    toast.warning('그룹 이름은 2글자 이상이어야 합니다.')
    return
  }

  try {
    const { error } = await client
      .from('groups')
      .update({ name: editingGroupName.value.trim() })
      .eq('id', groupId)

    if (error) {
      console.error('Group name update error:', error)
      toast.error('그룹 이름 변경에 실패했습니다: ' + error.message)
      return
    }

    group.value.name = editingGroupName.value.trim()
    toast.success('그룹 이름이 변경되었습니다!')
    modals.drawer = false
  } catch (err) {
    console.error('Unexpected error:', err)
    toast.error('예상치 못한 오류가 발생했습니다.')
  }
}

const toggleMemberMenu = (memberId: string) => {
  activeMemberMenu.value = activeMemberMenu.value === memberId ? null : memberId
}

const promoteMember = async (memberId: string) => {
  if (!confirm('이 멤버를 관리자로 승격하시겠습니까?')) return

  const { error } = await client
    .from('group_members')
    .update({ role: 'admin' })
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) {
    toast.error('권한 변경에 실패했습니다.')
  } else {
    await fetchData()
    toast.success('관리자로 승격되었습니다.')
  }
  activeMemberMenu.value = null
}

const kickMember = async (memberId: string) => {
  if (!confirm('정말로 이 멤버를 강제 퇴장시키겠습니까?')) return

  const { error } = await client
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId)

  if (error) {
    toast.error('멤버 강퇴에 실패했습니다.')
  } else {
    await fetchData()
    toast.success('멤버가 퇴장되었습니다.')
  }
  activeMemberMenu.value = null
}

const copyInviteLink = async () => {
  if (!group.value?.invite_code) {
    toast.error('초대 코드를 불러올 수 없습니다.')
    return
  }

  const inviteLink = `${window.location.origin}/join/${group.value.invite_code}`

  try {
    await navigator.clipboard.writeText(inviteLink)
    toast.success('초대 링크가 클립보드에 복사되었습니다!\n친구들에게 공유해보세요.', 5000)
  } catch (err) {
    console.error('Clipboard error:', err)
    prompt('초대 링크를 복사하세요:', inviteLink)
    toast.info('초대 링크가 복사되지 않아 직접 입력창에 표시했습니다.')
  }
}

const copyInviteCode = async () => {
  if (!group.value?.invite_code) {
    toast.error('초대 코드를 불러올 수 없습니다.')
    return
  }

  const inviteCode = group.value.invite_code

  try {
    await navigator.clipboard.writeText(inviteCode)
    toast.success('초대 코드가 클립보드에 복사되었습니다!', 3000)
  } catch (err) {
    console.error('Clipboard error:', err)
    prompt('초대 코드를 복사하세요:', inviteCode)
    toast.info('초대 코드가 복사되지 않아 직접 입력창에 표시했습니다.')
  }
}

const jumpToChapter = (startPct: number) => {
  console.log('[jumpToChapter] Moving to:', startPct)

  // 1. 즉시 슬라이더 이동 (v-model에 의해 SmartSlider 자동 업데이트)
  viewProgress.value = startPct

  // 2. Optimistic Update (멤버 진행도 UI 즉시 반영)
  updateOptimistic(startPct)

  // 3. Vue 렌더링 완료 후 서랍 닫기
  nextTick(() => {
    console.log('[jumpToChapter] Closing drawer and scrolling')
    scrollToPosition(Math.round(startPct))
    modals.drawer = false
  })

  // 4. DB 저장
  if (selectedBookId.value) {
    saveProgress(startPct)
  }
}

const isCurrentChapter = (chapter: any) => {
  return viewProgress.value >= chapter.start && viewProgress.value < chapter.end
}

const openReviewModalForEdit = async (book: any) => {
  if (!userStore.user) return

  if (!currentUserId.value) return

  // Fetch existing review for this group_book
  const { data: existingReview } = await client
    .from('reviews')
    .select('*')
    .eq('user_id', currentUserId.value)
    .eq('group_book_id', book.id)
    .maybeSingle()

  reviewInitialData.value = existingReview
    ? { rating: existingReview.rating, content: existingReview.content || '' }
    : { rating: 0, content: '' }

  modals.review = true
  modals.drawer = false
}

const deleteGroup = async () => {
  if (!isAdmin.value) {
    toast.error('관리자만 그룹을 삭제할 수 있습니다.')
    return
  }

  // 멤버 수 확인
  const memberCount = members.value.length

  // 첫 번째 확인
  const confirmMsg = memberCount > 1
    ? `이 그룹에는 ${memberCount}명의 멤버가 있습니다.\n그룹을 삭제하면 모든 데이터(책, 댓글, 리뷰 등)가 영구적으로 삭제됩니다.\n\n정말로 삭제하시겠습니까?`
    : `그룹을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.\n\n정말로 삭제하시겠습니까?`

  if (!confirm(confirmMsg)) return

  // 두 번째 확인 (안전장치)
  const groupNameToConfirm = group.value?.name || ''
  const userInput = prompt(`정말로 삭제하려면 그룹 이름을 입력하세요:\n\n"${groupNameToConfirm}" `)

  if (userInput !== groupNameToConfirm) {
    toast.error('그룹 이름이 일치하지 않습니다. 삭제가 취소되었습니다.')
    return
  }

  try {
    console.log('[Group] Deleting group:', groupId)

    const { error } = await client
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      console.error('Group delete error:', error)
      toast.error('그룹 삭제에 실패했습니다: ' + error.message)
      return
    }

    toast.success('그룹이 삭제되었습니다.')
    router.push('/')
  } catch (err) {
    console.error('Unexpected error:', err)
    toast.error('예상치 못한 오류가 발생했습니다.')
  }
}

const leaveGroup = async () => {
  if (!currentUserId.value) return

  // Check if user is the only admin
  const admins = members.value.filter(m => m.role === 'admin')
  if (admins.length === 1 && admins[0].id === currentUserId.value) {
    toast.error('그룹의 유일한 관리자입니다. 다른 멤버를 관리자로 지정한 후 나가주세요.')
    return
  }

  if (!confirm('정말로 이 그룹에서 나가시겠습니까?')) return

  try {
    const { error } = await client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', currentUserId.value)

    if (error) throw error

    toast.success('그룹에서 나갔습니다.')
    router.push('/')

  } catch (error) {
    console.error('Leave group error:', error)
    toast.error('그룹 나가기에 실패했습니다.')
  }
}

const handleChangeMemberRole = async (member: any) => {
  if (!isAdmin.value) {
    toast.error('관리자만 권한을 변경할 수 있습니다.')
    return
  }

  const newRole = member.role === 'admin' ? 'member' : 'admin'
  const roleText = newRole === 'admin' ? '관리자' : '멤버'

  try {
    const { error } = await client
      .from('group_members')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', member.id)

    if (error) throw error

    // Update local state
    const memberIndex = members.value.findIndex(m => m.id === member.id)
    if (memberIndex >= 0) {
      members.value[memberIndex].role = newRole
    }

    toast.success(`${member.nickname}님의 권한이 ${roleText}로 변경되었습니다.`)
  } catch (error: any) {
    console.error('Change role error:', error)
    toast.error('권한 변경 실패: ' + error.message)
  }
}

const handleKickMember = async (member: any) => {
  if (!isAdmin.value) {
    toast.error('관리자만 멤버를 강퇴할 수 있습니다.')
    return
  }

  if (!confirm(`정말 ${member.nickname}님을 강퇴하시겠습니까?`)) return

  try {
    const { error } = await client
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', member.id)

    if (error) throw error

    // Update local state
    members.value = members.value.filter(m => m.id !== member.id)

    toast.success(`${member.nickname}님이 그룹에서 제거되었습니다.`)
  } catch (error: any) {
    console.error('Kick member error:', error)
    toast.error('멤버 강퇴 실패: ' + error.message)
  }
}

// Select book to view
const selectBook = async (bookId: string) => {
  selectedBookId.value = bookId
  modals.drawer = false

  // Fetch comments for selected book
  await fetchComments(bookId)

  // Load user's reading progress
  const userId = currentUserId.value
  if (userId) {
    const { data: progressData } = await client
      .from('user_reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('group_book_id', bookId)
      .maybeSingle()

    if (progressData) {
      viewProgress.value = progressData.progress_pct
    } else {
      viewProgress.value = 0
    }

    // 책을 선택했다는 것을 기록 (last_read_at 업데이트)
    // 이렇게 해야 메인 화면에서 "내가 마지막으로 본 책"으로 인식됨
    await saveProgress(viewProgress.value)
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style>
/* Global smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>

<style scoped>
@keyframes slide-right {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes slide-left {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-right {
  animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-slide-left {
  animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>