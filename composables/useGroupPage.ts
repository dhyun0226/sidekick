import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted, nextTick, reactive, defineAsyncComponent, type Ref, type ComputedRef } from 'vue'
import { useUserStore } from '~/stores/user'
import { useToastStore } from '~/stores/toast'
import type {
  Group,
  GroupMember,
  GroupPageModals,
  PendingMemberAction,
  PendingBookToDelete,
  ClipboardFallbackData,
  MemberWithProgress,
  TocChapter
} from '~/types'

export interface GroupPageConfig {
  mode: 'solo' | 'social'
  groupIdRef: Ref<string>
}

export function useGroupPage(config: GroupPageConfig) {
  // ===== External Dependencies =====
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const toast = useToastStore()
  const client = useSupabaseClient()
  const { formatDateRange, getDaysRemaining, getTotalDays, getDaysSinceStart } = useDateUtils()
  const {
    isPremium,
    limits,
    fetchLimits,
    isReadOnlyInGroup
  } = useSubscription()
  const { validateComment } = useValidation()

  // ===== Core State =====
  const viewProgress = ref(0)
  const currentUserId = computed(() => userStore.profile?.id)
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)

  // ===== Sub-Composables =====
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
    updateGenre,
    markCompleted: markBookCompleted,
    deleteBook: deleteBookFromGroup
  } = useGroupBooks(config.groupIdRef)

  const {
    memberProgress,
    updateOptimistic,
    saveProgress,
    loadProgress,
    loadMemberProgress
  } = useReadingProgress(computed(() => selectedBookId.value), currentUserId)

  const {
    comments,
    fetchComments,
    loadMoreComments,
    submitComment,
    addComment,
    hasMore,
    isLoadingMore
  } = useGroupComments(currentUserId)

  // ===== Modal States =====
  const modals = reactive<GroupPageModals>({
    drawer: false,
    search: false,
    review: false,
    reviews: false,
    comment: false,
    groupStats: false,
    commentInput: false,
    editDates: false,
    editToc: false,
    editGenre: false,
    markCompleted: false,
    deleteBook: false,
    editFinishedDate: false,
    editingBook: null as any,
    upgradeBook: false,
    upgradeReadOnly: false,
    promoteMember: false,
    kickMember: false,
    leaveGroup: false,
    deleteGroup: false,
    deleteGroupConfirm: false,
    clipboardFallback: false,
    regenerateInviteCode: false,
    deleteHistoryBook: false
  })

  // ===== Admin Action State =====
  const pendingMemberAction = ref<PendingMemberAction | null>(null)
  const pendingBookToDelete = ref<PendingBookToDelete | null>(null)
  const clipboardFallbackData = ref<ClipboardFallbackData>({ title: '', message: '', text: '' })

  // ===== Realtime Subscriptions =====
  const {
    setupCommentSubscription,
    setupProgressSubscription,
    cleanup: cleanupSubscriptions
  } = useRealtimeSubscriptions(
    selectedBookId,
    computed(() => modals.drawer),
    currentUserId,
    (comment: any) => addComment(comment),
    (progress: any) => {
      if (progress.group_book_id !== selectedBookId.value) return
      const index = memberProgress.value.findIndex((p: any) => p.user_id === progress.user_id)
      if (index >= 0) {
        memberProgress.value[index] = progress
      } else {
        memberProgress.value.push(progress)
      }
    }
  )

  // ===== Additional Reactive State =====
  const group = ref<Group | null>(null)
  const members = ref<GroupMember[]>([])
  const editingGroupName = ref('')
  const isScrolled = ref(false)
  const reviewInitialData = ref({ rating: 0, content: '' })
  const isEditingReview = ref(false)
  const reviewingBookId = ref<string | null>(null)
  const reviews = ref<any[]>([])
  const reviewsBookTitle = ref('')
  const newAnchorText = ref('')
  const anchorTextLocked = ref(false)
  const activeMemberMenu = ref<string | null>(null)
  const showMemberProgress = ref(false)
  const userReviewedBooks = ref<Map<string, number>>(new Map())
  const highlightedCommentId = ref<string | null>(null)
  const isSliderDragging = ref(false)

  // ===== Timer/RAF references =====
  let progressSaveTimeout: NodeJS.Timeout | null = null
  let highlightTimeout: NodeJS.Timeout | null = null
  let scrollRAF: number | null = null

  let lastScrollTime = 0

  // ===== Computed Values =====
  const myMembership = computed(() => members.value.find(m => m.id === currentUserId.value))
  const isArchived = computed(() => group.value?.deleted_at != null || myMembership.value?.left_at != null)

  const isReadOnlyMode = computed(() => {
    if (config.mode === 'solo') return false
    const groupType = group.value?.group_type || 'social'
    return isReadOnlyInGroup(groupType)
  })

  const isSoloGroup = computed(() => config.mode === 'solo')

  const isAdmin = computed(() => {
    if (config.mode === 'solo') return true
    const userId = currentUserId.value
    if (!userId) return false
    const member = members.value.find(m => m.id === userId)
    return member?.role === 'admin'
  })

  const isPausedGroup = computed(() => {
    if (config.mode === 'solo') return false
    return group.value?.status === 'paused'
  })

  const reviewingBook = computed(() => {
    if (reviewingBookId.value) {
      return allBooks.value.find((b: any) => b.id === reviewingBookId.value) || selectedBook.value
    }
    return selectedBook.value
  })

  const groupName = computed(() => group.value?.name || 'Loading...')
  const bookTitle = computed(() => selectedBook.value?.book?.title || 'No Book Selected')
  const bookRoundLabel = computed(() => {
    if (!selectedBook.value?.round) return ''
    return `[${selectedBook.value.round}회]`
  })
  const bookAuthor = computed(() => selectedBook.value?.book?.author || '')
  const bookCover = computed(() => selectedBook.value?.book?.cover_url || '')

  const toc = computed<TocChapter[]>(() => {
    const snapshot = selectedBook.value?.toc_snapshot
    const totalPages = selectedBook.value?.book?.total_pages
    if (!snapshot || !Array.isArray(snapshot)) return []
    if (!totalPages) return []

    return snapshot.map((c: any, i: number) => {
      let startPage = c.startPage !== undefined ? c.startPage : (c.page !== undefined ? c.page : null)
      if (startPage === null && c.start !== undefined) {
        startPage = Math.round((c.start / 100) * totalPages)
      }
      startPage = startPage || 1

      const nextChapter = snapshot[i + 1]
      let nextStartPage = nextChapter?.startPage !== undefined ? nextChapter.startPage : (nextChapter?.page !== undefined ? nextChapter.page : null)
      if (nextStartPage === null && nextChapter?.start !== undefined) {
        nextStartPage = Math.round((nextChapter.start / 100) * totalPages)
      }
      const endPage = nextStartPage ? nextStartPage - 1 : totalPages

      return {
        title: c.title,
        start: (startPage / totalPages) * 100,
        end: (endPage / totalPages) * 100,
        startPage
      }
    })
  })

  const currentChapterName = computed(() => {
    const pct = viewProgress.value
    const chapters = toc.value
    if (!chapters || chapters.length === 0) return '독서 기록'

    const found = chapters.find((c: TocChapter, index: number) => {
      const isLast = index === chapters.length - 1
      return isLast ? (pct >= c.start && pct <= c.end) : (pct >= c.start && pct < c.end)
    })

    if (!found && pct < chapters[0]?.start) return chapters[0]?.title || 'Start'
    return found ? found.title : 'End'
  })

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

  const commentCount = computed(() => comments.value.length)

  // ===== Sorted Members With Progress (O(n+m) optimized with Map) =====
  const sortedMembersWithProgress = computed<MemberWithProgress[]>(() => {
    if (config.mode === 'solo') return []

    const { formatTimeAgo, isInactive, formatShortDate } = useDateUtils()
    const activeMembers = members.value.filter(m => !m.left_at)

    // Phase 3: O(n+m) Map-based lookup instead of O(n*m) find()
    const progressMap = new Map<string, any>()
    for (const p of memberProgress.value) {
      if (p.group_book_id === selectedBookId.value) {
        progressMap.set(p.user_id, p)
      }
    }

    const membersWithData: MemberWithProgress[] = activeMembers.map(member => {
      const progressData = progressMap.get(member.id)

      let progress: number
      if (member.id === currentUserId.value) {
        const isFinished = progressData?.finished_at != null
        progress = (isFinished || isArchived.value)
          ? (progressData?.progress_pct || 0)
          : Math.round(viewProgress.value)
      } else {
        progress = progressData?.progress_pct || 0
      }

      const lastReadAt = progressData?.last_read_at
      const timeAgo = lastReadAt ? formatTimeAgo(lastReadAt) : null
      const inactive = lastReadAt ? isInactive(lastReadAt) : true
      const finishedAt = progressData?.finished_at || null
      const finishedDate = finishedAt ? formatShortDate(new Date(finishedAt)) : null
      const isCompleted = !!finishedAt

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

    if (selectedBook.value?.status === 'done') {
      return membersWithData.sort((a, b) => {
        if (a.isCompleted && !b.isCompleted) return -1
        if (!a.isCompleted && b.isCompleted) return 1
        if (a.isCompleted && b.isCompleted && a.finishedAt && b.finishedAt) {
          return new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime()
        }
        return b.progress - a.progress
      })
    }
    return membersWithData.sort((a, b) => b.progress - a.progress)
  })

  const sliderMembers = computed(() => {
    const othersWithProgress = sortedMembersWithProgress.value
      .filter(m => m.id !== currentUserId.value)
    if (othersWithProgress.length === 0) return []
    if (othersWithProgress.length <= 4) return othersWithProgress
    return othersWithProgress.slice(0, 3)
  })

  const visibleAllBooks = computed(() => allBooks.value)
  const visibleReadingBooks = computed(() => readingBooks.value)
  const visibleHistoryBooks = computed(() => historyBooks.value)

  // ===== Data Fetching =====
  const fetchSoloGroupId = async (): Promise<string | null> => {
    const userId = userStore.profile?.id
    if (!userId) return null

    const { data, error } = await client
      .from('group_members')
      .select('group_id, groups!inner(id, group_type)')
      .eq('user_id', userId)
      .eq('groups.group_type', 'solo')
      .is('left_at', null)
      .single()

    if (error || !data) {
      console.error('[GroupPage] Failed to fetch solo group:', error)
      return null
    }
    return data.group_id
  }

  const fetchUserReviews = async () => {
    if (!currentUserId.value) return
    try {
      const bookIds = allBooks.value.map((b: any) => b.id)
      if (bookIds.length === 0) return

      const { data: userReviews } = await client
        .from('reviews')
        .select('group_book_id, rating')
        .eq('user_id', currentUserId.value)
        .in('group_book_id', bookIds)

      if (userReviews) {
        const newMap = new Map<string, number>()
        userReviews.forEach((r: any) => newMap.set(r.group_book_id, Number(r.rating)))
        userReviewedBooks.value = newMap
      }
    } catch (error) {
      console.error('[FetchUserReviews] Error:', error)
    }
  }

  const fetchData = async () => {
    if (!userStore.user) return
    isLoading.value = true
    loadError.value = null

    try {
      // Solo mode: fetch solo group ID first
      if (config.mode === 'solo') {
        const soloGroupId = await fetchSoloGroupId()
        if (!soloGroupId) {
          toast.error('내 서재를 찾을 수 없습니다.')
          router.push('/')
          return
        }
        config.groupIdRef.value = soloGroupId
      }

      // Fetch group info
      const { data: groupData, error: groupError } = await client
        .from('groups')
        .select('*')
        .eq('id', config.groupIdRef.value)
        .single()

      if (groupError || !groupData) {
        const errMsg = config.mode === 'solo' ? '내 서재를 찾을 수 없습니다.' : '존재하지 않는 그룹입니다.'
        toast.error(errMsg)
        router.push('/')
        return
      }

      group.value = groupData
      editingGroupName.value = groupData.name

      // Social mode: fetch members and check access
      if (config.mode === 'social') {
        const { data: memberData } = await client
          .from('group_members')
          .select('*, user:users(*)')
          .eq('group_id', config.groupIdRef.value)

        if (memberData) {
          members.value = memberData.map((m: any) => ({
            id: m.user.id,
            nickname: m.user.nickname,
            avatar_url: m.user.avatar_url,
            role: m.role,
            left_at: m.left_at,
            subscription_tier: m.user.subscription_tier || 'free'
          }))
        }

        const isMember = members.value.some(m => m.id === currentUserId.value)
        if (!isMember) {
          toast.error('이 그룹에 접근할 권한이 없습니다.')
          router.push('/')
          return
        }
      }

      // Fetch books, then reviews
      await fetchBooks()
      await fetchUserReviews()

      // Handle bookId from query parameter
      if (route.query.bookId) {
        const bookIdFromQuery = route.query.bookId as string
        const bookExists = allBooks.value.some((b: any) => b.id === bookIdFromQuery)
        if (bookExists) {
          selectedBookId.value = bookIdFromQuery
        }
      }

      // Fetch comments and progress
      if (selectedBookId.value) {
        if (currentUserId.value) {
          const [_, progress] = await Promise.all([
            fetchComments(selectedBookId.value),
            loadProgress(selectedBookId.value, currentUserId.value)
          ])
          viewProgress.value = progress
        } else {
          await fetchComments(selectedBookId.value)
        }
      }
    } catch (err: any) {
      console.error('[GroupPage] fetchData error:', err)
      if (config.mode === 'social') {
        loadError.value = err.message || '데이터를 불러오는데 실패했습니다.'
      }
    } finally {
      isLoading.value = false
    }
  }

  // ===== UI Helpers =====
  const handleContainerScroll = (e: Event) => {
    const target = e.target as HTMLElement
    isScrolled.value = target.scrollTop > 20
  }

  const scrollToPosition = (targetPct: number) => {
    const groups = document.querySelectorAll('[data-position]')
    if (groups.length === 0) return

    let closestGroup: Element | null = null
    let closestDistance = Infinity

    groups.forEach(g => {
      const position = parseInt(g.getAttribute('data-position') || '0')
      const distance = Math.abs(position - targetPct)
      if (distance < closestDistance) {
        closestDistance = distance
        closestGroup = g
      }
    })

    if (closestGroup) {
      closestGroup.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
  }

  // ===== Slider Handlers =====
  const handleSliderDragging = (dragging: boolean) => {
    isSliderDragging.value = dragging
  }

  const handleSliderInput = (val: number) => {
    const now = Date.now()
    const THROTTLE_MS = 150
    if (now - lastScrollTime < THROTTLE_MS) return
    lastScrollTime = now

    if (scrollRAF !== null) cancelAnimationFrame(scrollRAF)
    scrollRAF = requestAnimationFrame(() => {
      scrollRAF = null
      scrollToPosition(Math.round(val))
    })
  }

  const handleSliderChange = async (val: number) => {
    viewProgress.value = val
    nextTick(() => scrollToPosition(Math.round(val)))

    // Read-only mode check (social only, harmless no-op for solo)
    if (isReadOnlyMode.value) return

    const currentBookData = allBooks.value.find((b: any) => b.id === selectedBookId.value)
    const isFinished = currentBookData?.user_finished_at != null

    if (isArchived.value || isFinished) {
      // Navigation mode - don't save
    } else {
      updateOptimistic(val)
      if (progressSaveTimeout) clearTimeout(progressSaveTimeout)
      const bookIdAtDrag = selectedBookId.value
      progressSaveTimeout = setTimeout(async () => {
        // 책이 바뀌었으면 저장하지 않음
        if (!selectedBookId.value || selectedBookId.value !== bookIdAtDrag) return
        await saveProgress(val)
      }, 2000)
    }
  }

  // ===== Comment Handlers =====
  const handleWrite = () => {
    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }
    modals.commentInput = true
    anchorTextLocked.value = false
  }

  const handleWriteFromModal = (data: { anchorText: string, position: number }) => {
    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }
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

  const handleLoadMore = async () => {
    if (!selectedBookId.value) return
    await loadMoreComments(selectedBookId.value)
  }

  const handleCommentSubmit = async (payload: { content: string, anchorText: string | null, position: number }) => {
    if (!selectedBook.value || !currentUserId.value) return

    const validation = validateComment(payload.content)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    try {
      const newComment = await submitComment(selectedBook.value.id, currentUserId.value, payload)
      modals.commentInput = false
      newAnchorText.value = ''
      anchorTextLocked.value = false

      if (newComment?.id) {
        await nextTick()
        scrollToPosition(Math.round(payload.position))
        highlightedCommentId.value = newComment.id
        if (highlightTimeout) clearTimeout(highlightTimeout)
        highlightTimeout = setTimeout(() => { highlightedCommentId.value = null }, 2000)
      }
    } catch (error: any) {
      toast.error('댓글 작성 실패: ' + error.message)
    }
  }

  // ===== Review Handlers =====
  const closeReviewModal = () => {
    modals.review = false
    reviewingBookId.value = null
  }

  const openReviewModalForBook = async (bookId: string) => {
    reviewingBookId.value = bookId
    const { data: existingReview } = await client
      .from('reviews')
      .select('*')
      .eq('user_id', currentUserId.value)
      .eq('group_book_id', bookId)
      .maybeSingle()

    if (existingReview) {
      reviewInitialData.value = { rating: parseFloat(existingReview.rating), content: existingReview.content || '' }
      isEditingReview.value = true
    } else {
      reviewInitialData.value = { rating: 0, content: '' }
      isEditingReview.value = false
    }
    modals.review = true
  }

  const handleReviewSubmit = async (data: any) => {
    if (!reviewingBookId.value || !userStore.user || !currentUserId.value) return
    try {
      const { error } = await client
        .from('reviews')
        .upsert({
          user_id: currentUserId.value,
          group_book_id: reviewingBookId.value,
          rating: data.rating,
          content: data.content
        }, { onConflict: 'user_id,group_book_id' })

      if (error) throw error

      await fetchBooks()
      await fetchUserReviews()
      closeReviewModal()
      toast.success('리뷰가 저장되었습니다! 🎉')
    } catch (error: any) {
      console.error('Review error:', error)
      toast.error('리뷰 저장 실패: ' + (error.message || '알 수 없는 오류'))
    }
  }

  const handleOpenReview = async (bookId: string) => {
    const book = allBooks.value.find((b: any) => b.id === bookId)
    if (!book || !userStore.user || !currentUserId.value) return

    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }

    reviewingBookId.value = bookId
    const { data: existingReview } = await client
      .from('reviews')
      .select('*')
      .eq('user_id', currentUserId.value)
      .eq('group_book_id', book.id)
      .maybeSingle()

    reviewInitialData.value = existingReview
      ? { rating: parseFloat(existingReview.rating), content: existingReview.content || '' }
      : { rating: 0, content: '' }
    isEditingReview.value = !!existingReview
    modals.review = true
    modals.drawer = false
  }

  const openReviewModalForEdit = async (book: any) => {
    if (!userStore.user || !currentUserId.value) return
    reviewingBookId.value = book.id
    const { data: existingReview } = await client
      .from('reviews')
      .select('*')
      .eq('user_id', currentUserId.value)
      .eq('group_book_id', book.id)
      .maybeSingle()

    reviewInitialData.value = existingReview
      ? { rating: parseFloat(existingReview.rating), content: existingReview.content || '' }
      : { rating: 0, content: '' }
    isEditingReview.value = !!existingReview
    modals.review = true
    modals.drawer = false
  }

  const fetchReviews = async (bookId: string) => {
    try {
      const { data: reviewsData, error: reviewsError } = await client
        .from('reviews')
        .select('*')
        .eq('group_book_id', bookId)

      if (reviewsError) throw reviewsError
      if (!reviewsData || reviewsData.length === 0) {
        reviews.value = []
        return
      }

      const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))]
      const { data: usersData, error: usersError } = await client
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      const usersMap = new Map(usersData?.map((u: any) => [u.id, u]) || [])
      reviews.value = reviewsData.map((r: any) => {
        const user = usersMap.get(r.user_id) as any
        return {
          ...r,
          user: user
            ? { display_name: user.nickname || '익명', avatar_url: user.avatar_url }
            : { display_name: '익명', avatar_url: null }
        }
      })
    } catch (error) {
      console.error('[Reviews] Error fetching reviews:', error)
      reviews.value = []
    }
  }

  const openReviews = async (bookId: string) => {
    const book = allBooks.value.find((b: any) => b.id === bookId)
    if (!book) return
    reviews.value = []
    reviewsBookTitle.value = book.book?.title || book.title || '책'
    modals.reviews = true
    await fetchReviews(bookId)
  }

  // ===== Book Search & Add =====
  const openSearchModal = () => {
    modals.drawer = false
    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }
    modals.search = true
  }

  const handleBookAdd = async (data: any) => {
    if (isArchived.value) {
      toast.error('종료된 그룹에는 책을 추가할 수 없습니다.')
      return
    }
    if (!isAdmin.value) {
      toast.error('관리자만 책을 추가할 수 있습니다.')
      return
    }

    try {
      const plainData = {
        book: {
          isbn: data.book.isbn,
          title: data.book.title,
          author: data.book.author,
          publisher: data.book.publisher,
          cover: data.book.cover
        },
        toc: data.toc.map((c: any) => ({ title: c.title, startPage: c.startPage })),
        totalPages: data.totalPages,
        startDate: data.startDate,
        endDate: data.endDate,
        genre: data.genre
      }
      await addBook(plainData)
      await fetchData()
      toast.success('새 책이 추가되었습니다! 🎉')
    } catch (error: any) {
      console.error('[GroupPage] Book add error:', error)
      toast.error(error.message || '책 추가 중 오류가 발생했습니다.')
    }
  }

  // ===== Book Admin Modal Openers =====
  const openEditDatesModal = (bookId: string) => {
    modals.editingBook = allBooks.value.find((b: any) => b.id === bookId) || null
    modals.editDates = true
  }

  const openEditTocModal = (bookId: string) => {
    modals.editingBook = allBooks.value.find((b: any) => b.id === bookId) || null
    modals.editToc = true
  }

  const openEditGenreModal = (bookId: string) => {
    modals.editingBook = allBooks.value.find((b: any) => b.id === bookId) || null
    modals.editGenre = true
  }

  const openMarkCompletedModal = (bookId: string) => {
    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }
    modals.editingBook = allBooks.value.find((b: any) => b.id === bookId) || null
    modals.markCompleted = true
  }

  const openDeleteBookModal = (bookId: string) => {
    modals.editingBook = allBooks.value.find((b: any) => b.id === bookId) || null
    modals.deleteBook = true
  }

  const handleEditFinishedDate = (bookId: string) => {
    modals.editingBook = allBooks.value.find((b: any) => b.id === bookId) || null
    modals.editFinishedDate = true
  }

  // ===== Book Admin Save Handlers =====
  const saveEditedDates = async (dates: { startDate: string, endDate: string }) => {
    if (!modals.editingBook || !dates.startDate || !dates.endDate) return
    if (!isAdmin.value) {
      toast.error('관리자만 독서 기간을 수정할 수 있습니다.')
      modals.editDates = false
      modals.editingBook = null
      return
    }
    try {
      await updateDates(modals.editingBook.id, dates.startDate, dates.endDate)
      await fetchBooks()
      toast.success('독서 기간이 수정되었습니다! 📅')
    } catch (error) {
      console.error('Edit dates error:', error)
      toast.error('독서 기간 수정에 실패했습니다.')
    } finally {
      modals.editDates = false
      modals.editingBook = null
    }
  }

  const saveEditedToc = async (tocData: { totalPages: number, chapters: { title: string, startPage: number }[] }) => {
    if (!modals.editingBook || !tocData.totalPages || tocData.totalPages <= 0) return
    if (!isAdmin.value) {
      toast.error('관리자만 목차를 수정할 수 있습니다.')
      modals.editToc = false
      modals.editingBook = null
      return
    }
    try {
      await updateToc(modals.editingBook.id, modals.editingBook.isbn, tocData.totalPages, tocData.chapters)
      await fetchBooks()
      toast.success('목차가 수정되었습니다! 📑')
    } catch (error: any) {
      console.error('Save TOC error:', error)
      toast.error('수정 실패: ' + error.message)
    } finally {
      modals.editToc = false
      modals.editingBook = null
    }
  }

  const saveEditedGenre = async (genre: string) => {
    if (!modals.editingBook || !genre) return
    if (!isAdmin.value) {
      toast.error('관리자만 장르를 수정할 수 있습니다.')
      modals.editGenre = false
      modals.editingBook = null
      return
    }
    try {
      await updateGenre(modals.editingBook.id, modals.editingBook.isbn, genre)
      await fetchBooks()
      toast.success('장르가 수정되었습니다! 🏷️')
    } catch (error: any) {
      console.error('Save Genre error:', error)
      toast.error('장르 수정 실패: ' + error.message)
    } finally {
      modals.editGenre = false
      modals.editingBook = null
    }
  }

  const saveEditedFinishedDate = async (finishedDate: string) => {
    if (!modals.editingBook || !finishedDate) return
    if (!isAdmin.value) {
      toast.error('완독 날짜 수정 권한이 없습니다.')
      modals.editFinishedDate = false
      modals.editingBook = null
      return
    }
    try {
      const { error } = await client
        .from('group_books')
        .update({ finished_at: finishedDate })
        .eq('id', modals.editingBook.id)
      if (error) throw error

      toast.success('완독 날짜가 수정되었습니다!')
      modals.editingBook.finished_at = finishedDate
      await fetchBooks()
    } catch (error: any) {
      console.error('[SaveFinishedDate] Error:', error)
      toast.error('완독 날짜 수정 중 오류가 발생했습니다.')
    } finally {
      modals.editFinishedDate = false
      modals.editingBook = null
    }
  }

  const markAsCompleted = async () => {
    if (!modals.editingBook) return
    if (!isAdmin.value) {
      toast.error('완독 처리 권한이 없습니다.')
      modals.markCompleted = false
      modals.editingBook = null
      return
    }
    try {
      await markBookCompleted(modals.editingBook.id)
      modals.markCompleted = false
      modals.editingBook = null
      toast.success('완주 처리되었습니다! 🎉 책장으로 이동합니다.')
      await fetchData()
    } catch (error) {
      console.error('Mark completed error:', error)
      toast.error('완주 처리에 실패했습니다.')
    }
  }

  const deleteBook = async () => {
    if (!modals.editingBook) return
    if (!isAdmin.value) {
      toast.error('관리자만 책을 삭제할 수 있습니다.')
      modals.deleteBook = false
      modals.editingBook = null
      return
    }
    try {
      await deleteBookFromGroup(modals.editingBook.id)
      modals.deleteBook = false
      modals.editingBook = null
      toast.success('책이 삭제되었습니다.')
      await fetchData()
    } catch (error) {
      console.error('Delete book error:', error)
      toast.error('책 삭제에 실패했습니다.')
    }
  }

  // ===== Mark Finished / Unmark Finished =====
  const markAsFinished = async (bookId: string, openReviewModal = true) => {
    if (!currentUserId.value) return
    try {
      const now = new Date().toISOString()
      const { data, error } = await client
        .from('user_reading_progress')
        .upsert({
          user_id: currentUserId.value,
          group_book_id: bookId,
          finished_at: now,
          progress_pct: 100,
          last_read_at: now
        }, { onConflict: 'user_id,group_book_id' })
        .select()
      if (error) throw error

      await loadMemberProgress(bookId)
      await fetchBooks()
      await nextTick()

      viewProgress.value = 100
      toast.success('완독 처리되었습니다! 🎉')

      if (openReviewModal) {
        await openReviewModalForBook(bookId)
      }
    } catch (error: any) {
      console.error('[MarkAsFinished] Error:', error)
      toast.error('완독 처리 중 오류가 발생했습니다.')
    }
  }

  const handleMarkFinished = async (bookId: string) => {
    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }

    await markAsFinished(bookId, true)

    // Solo: auto-complete book (reading → done)
    if (config.mode === 'solo') {
      try {
        await markBookCompleted(bookId)
        toast.success('책장으로 이동했습니다! 📚')
      } catch (error) {
        console.error('[HandleMarkFinished] Auto-complete error:', error)
      }
    }
  }

  const handleUnmarkFinished = async (bookId: string) => {
    if (!currentUserId.value) return
    if (isReadOnlyMode.value) {
      modals.upgradeReadOnly = true
      return
    }

    try {
      const { data, error } = await client
        .from('user_reading_progress')
        .update({ finished_at: null })
        .eq('group_book_id', bookId)
        .eq('user_id', currentUserId.value)
        .select()
      if (error) throw error

      // Solo: revert book status back to reading
      if (config.mode === 'solo') {
        const { error: statusError } = await client
          .from('group_books')
          .update({ status: 'reading', finished_at: null })
          .eq('id', bookId)
        if (statusError) throw statusError
      }

      await loadMemberProgress(bookId)
      await fetchBooks()
      await nextTick()

      const progressData = memberProgress.value.find(
        (p: any) => p.group_book_id === bookId && p.user_id === currentUserId.value
      )
      if (progressData) {
        viewProgress.value = progressData.progress_pct || 100
      }

      toast.success('완독이 취소되었습니다.')
    } catch (error: any) {
      console.error('[UnmarkFinished] Error:', error)
      toast.error('완독 취소 중 오류가 발생했습니다.')
    }
  }

  // ===== History Book Handlers =====
  const handleDeleteHistoryBook = (bookId: string) => {
    const book = allBooks.value.find((b: any) => b.id === bookId)
    if (!book) return
    if (!isAdmin.value) {
      toast.error('관리자만 책을 삭제할 수 있습니다.')
      return
    }
    pendingBookToDelete.value = { id: bookId, title: book.book?.title || '이 책' }
    modals.deleteHistoryBook = true
  }

  const confirmDeleteHistoryBook = async () => {
    if (!pendingBookToDelete.value) return
    const bookId = pendingBookToDelete.value.id
    modals.deleteHistoryBook = false
    pendingBookToDelete.value = null

    try {
      const { error } = await client
        .from('group_books')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', bookId)
      if (error) throw error

      await client
        .from('user_reading_progress')
        .update({ hidden: true })
        .eq('group_book_id', bookId)

      toast.success('책이 삭제되었습니다.')
      await fetchBooks()
    } catch (error: any) {
      console.error('[DeleteHistoryBook] Error:', error)
      toast.error('책 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleRestartReading = async (bookId: string) => {
    const book = allBooks.value.find((b: any) => b.id === bookId)
    if (!book) return
    if (!isAdmin.value) {
      toast.error('관리자만 책 상태를 변경할 수 있습니다.')
      return
    }
    try {
      const { error } = await client
        .from('group_books')
        .update({ status: 'reading', finished_at: null })
        .eq('id', bookId)
      if (error) throw error

      toast.success('다시 읽기로 변경되었습니다!')
      await fetchBooks()
    } catch (error: any) {
      console.error('[RestartReading] Error:', error)
      toast.error('상태 변경 중 오류가 발생했습니다.')
    }
  }

  // ===== Group Management =====
  const saveGroupName = async (newName: string) => {
    if (!isAdmin.value) {
      toast.error('관리자만 그룹 이름을 변경할 수 있습니다.')
      return
    }
    const trimmedName = newName.trim()
    if (!trimmedName) { toast.warning('그룹 이름을 입력해주세요.'); return }
    if (trimmedName.length < 2) { toast.warning('그룹 이름은 2글자 이상이어야 합니다.'); return }

    try {
      const { error } = await client
        .from('groups')
        .update({ name: trimmedName })
        .eq('id', config.groupIdRef.value)
      if (error) {
        toast.error('그룹 이름 변경에 실패했습니다: ' + error.message)
        return
      }
      group.value!.name = trimmedName
      toast.success('그룹 이름이 변경되었습니다!')
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('예상치 못한 오류가 발생했습니다.')
    }
  }

  const deleteGroup = () => {
    if (!isAdmin.value) {
      toast.error('관리자만 그룹을 삭제할 수 있습니다.')
      return
    }
    modals.deleteGroup = true
  }

  const confirmDeleteGroup = () => {
    modals.deleteGroup = false
    modals.deleteGroupConfirm = true
  }

  const executeDeleteGroup = async (inputText: string) => {
    if (!isAdmin.value) {
      toast.error('관리자만 그룹을 삭제할 수 있습니다.')
      modals.deleteGroupConfirm = false
      return
    }
    try {
      const { error } = await client
        .from('groups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', config.groupIdRef.value)
      if (error) {
        toast.error('그룹 삭제에 실패했습니다: ' + error.message)
        return
      }
      toast.success('그룹이 종료되었습니다. (아카이브 보관)')
      router.push('/')
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('예상치 못한 오류가 발생했습니다.')
    } finally {
      modals.deleteGroupConfirm = false
    }
  }

  // ===== Member Management =====
  const toggleMemberMenu = (memberId: string) => {
    activeMemberMenu.value = activeMemberMenu.value === memberId ? null : memberId
  }

  const promoteMember = (memberId: string) => {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return
    pendingMemberAction.value = { id: memberId, nickname: member.nickname }
    modals.promoteMember = true
  }

  const executePromoteMember = async () => {
    if (!pendingMemberAction.value) return
    if (!isAdmin.value) {
      toast.error('관리자만 권한을 변경할 수 있습니다.')
      modals.promoteMember = false
      pendingMemberAction.value = null
      return
    }
    try {
      const { error } = await client
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', config.groupIdRef.value)
        .eq('user_id', pendingMemberAction.value.id)
      if (error) throw error

      await fetchData()
      toast.success('관리자로 승격되었습니다.')
    } catch (error) {
      console.error('Promote member error:', error)
      toast.error('권한 변경에 실패했습니다.')
    } finally {
      modals.promoteMember = false
      pendingMemberAction.value = null
      activeMemberMenu.value = null
    }
  }

  const kickMember = (memberId: string) => {
    const member = members.value.find(m => m.id === memberId)
    if (!member) return
    pendingMemberAction.value = { id: memberId, nickname: member.nickname }
    modals.kickMember = true
  }

  const executeKickMember = async () => {
    if (!pendingMemberAction.value) return
    if (!isAdmin.value) {
      toast.error('관리자만 멤버를 강퇴할 수 있습니다.')
      modals.kickMember = false
      pendingMemberAction.value = null
      return
    }
    try {
      const { error } = await client
        .from('group_members')
        .delete()
        .eq('group_id', config.groupIdRef.value)
        .eq('user_id', pendingMemberAction.value.id)
      if (error) throw error

      members.value = members.value.filter(m => m.id !== pendingMemberAction.value!.id)
      toast.success(`${pendingMemberAction.value.nickname}님이 그룹에서 제거되었습니다.`)
    } catch (error) {
      console.error('Kick member error:', error)
      toast.error('멤버 강퇴에 실패했습니다.')
    } finally {
      modals.kickMember = false
      pendingMemberAction.value = null
      activeMemberMenu.value = null
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
        .eq('group_id', config.groupIdRef.value)
        .eq('user_id', member.id)
      if (error) throw error

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

  const handleKickMember = (member: any) => {
    if (!isAdmin.value) {
      toast.error('관리자만 멤버를 강퇴할 수 있습니다.')
      return
    }
    pendingMemberAction.value = { id: member.id, nickname: member.nickname }
    modals.kickMember = true
  }

  const leaveGroup = () => {
    if (!currentUserId.value) return
    const admins = members.value.filter(m => m.role === 'admin')
    if (admins.length === 1 && admins[0].id === currentUserId.value && members.value.length > 1) {
      toast.error('그룹의 유일한 관리자입니다. 다른 멤버를 관리자로 지정한 후 나가주세요.')
      return
    }
    modals.leaveGroup = true
  }

  const executeLeaveGroup = async () => {
    if (!currentUserId.value) return
    try {
      const { error } = await client
        .from('group_members')
        .update({ left_at: new Date().toISOString() })
        .eq('group_id', config.groupIdRef.value)
        .eq('user_id', currentUserId.value)
      if (error) throw error

      toast.success('그룹을 보관함으로 이동했습니다. (지난 그룹에서 확인 가능)')
      router.push('/')
    } catch (error) {
      console.error('Leave group error:', error)
      toast.error('그룹 나가기에 실패했습니다.')
    } finally {
      modals.leaveGroup = false
    }
  }

  const handleBecomeOwner = async () => {
    if (!isPremium.value) {
      toast.error('프리미엄 회원만 방장이 될 수 있습니다.')
      return
    }
    if (!isPausedGroup.value) {
      toast.error('일시 정지된 그룹만 방장이 될 수 있습니다.')
      return
    }
    try {
      await $fetch('/api/groups/become-owner', {
        method: 'POST',
        body: { groupId: config.groupIdRef.value }
      })

      toast.success('방장이 되었습니다! 그룹이 다시 활성화되었습니다.', 5000)
      await fetchData()
    } catch (error: any) {
      console.error('Become owner error:', error)
      toast.error(error.message || '방장 되기에 실패했습니다.')
    }
  }

  // ===== Invite Code =====
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
      clipboardFallbackData.value = {
        title: '초대 링크',
        message: '클립보드 복사에 실패했습니다. 아래 링크를 수동으로 복사해주세요.',
        text: inviteLink
      }
      modals.clipboardFallback = true
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
      clipboardFallbackData.value = {
        title: '초대 코드',
        message: '클립보드 복사에 실패했습니다. 아래 코드를 수동으로 복사해주세요.',
        text: inviteCode
      }
      modals.clipboardFallback = true
    }
  }

  const regenerateInviteCode = () => {
    if (!isAdmin.value) {
      toast.error('관리자만 초대 코드를 재생성할 수 있습니다.')
      return
    }
    modals.regenerateInviteCode = true
  }

  const executeRegenerateInviteCode = async () => {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let newCode = ''
      let attempts = 0
      const maxAttempts = 5

      while (attempts < maxAttempts) {
        newCode = ''
        for (let i = 0; i < 8; i++) {
          newCode += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        const { data: existing } = await client
          .from('groups')
          .select('id')
          .eq('invite_code', newCode)
          .maybeSingle()
        if (!existing) break
        attempts++
      }

      if (attempts === maxAttempts) {
        toast.error('초대 코드 생성에 실패했습니다. 다시 시도해주세요.')
        return
      }

      const { error } = await client
        .from('groups')
        .update({ invite_code: newCode })
        .eq('id', config.groupIdRef.value)
      if (error) {
        toast.error('초대 코드 재생성에 실패했습니다: ' + error.message)
        return
      }

      if (group.value) group.value.invite_code = newCode
      toast.success(`새 초대 코드가 생성되었습니다: ${newCode}`)
    } catch (err) {
      console.error('Unexpected error:', err)
      toast.error('예상치 못한 오류가 발생했습니다.')
    } finally {
      modals.regenerateInviteCode = false
    }
  }

  const cancelRegenerateInviteCode = () => {
    modals.regenerateInviteCode = false
  }

  // ===== Navigation =====
  const jumpToChapter = (startPct: number) => {
    viewProgress.value = startPct
    updateOptimistic(startPct)

    nextTick(() => {
      scrollToPosition(Math.round(startPct))
      modals.drawer = false
    })

    if (selectedBookId.value) {
      saveProgress(startPct)
    }
  }

  const isCurrentChapter = (chapter: any) => {
    return viewProgress.value >= chapter.start && viewProgress.value < chapter.end
  }

  const selectBook = async (bookId: string) => {
    selectedBookId.value = bookId
    modals.drawer = false

    await fetchComments(bookId)

    const userId = currentUserId.value
    if (userId) {
      const { data: progressData } = await client
        .from('user_reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('group_book_id', bookId)
        .maybeSingle()

      viewProgress.value = progressData ? progressData.progress_pct : 0

      // 레코드가 아예 없을 때만 최초 생성 (이미 있으면 불필요한 DB write 방지)
      if (!progressData && !isArchived.value) {
        await saveProgress(0)
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ===== Lifecycle Hooks =====
  onMounted(async () => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.height = '100vh'
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100vh'
    }

    await Promise.all([
      userStore.fetchProfile(),
      fetchLimits()
    ])

    await fetchData()

    if (selectedBookId.value) {
      await loadMemberProgress(selectedBookId.value)
    }

    setupCommentSubscription()

    if (route.query.jumpTo) {
      const jumpToPct = parseFloat(route.query.jumpTo as string)
      if (!isNaN(jumpToPct)) viewProgress.value = jumpToPct
    }

    if (route.query.highlightComment) {
      highlightedCommentId.value = route.query.highlightComment as string
      if (highlightTimeout) clearTimeout(highlightTimeout)
      highlightTimeout = setTimeout(() => { highlightedCommentId.value = null }, 2000)
    }

    if (viewProgress.value > 0) {
      nextTick(() => scrollToPosition(Math.round(viewProgress.value)))
    }
  })

  watch(() => modals.drawer, async (isOpen) => {
    if (isOpen && selectedBookId.value) {
      await loadMemberProgress(selectedBookId.value)
    }
  })

  watch(selectedBookId, async (newBookId) => {
    if (newBookId) {
      await loadMemberProgress(newBookId)
    }
  })

  onBeforeUnmount(async () => {
    if (progressSaveTimeout) {
      clearTimeout(progressSaveTimeout)
      if (selectedBookId.value && viewProgress.value !== undefined) {
        await saveProgress(viewProgress.value)
      }
    }
  })

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
    cleanupSubscriptions()
    if (progressSaveTimeout) clearTimeout(progressSaveTimeout)
    if (highlightTimeout) clearTimeout(highlightTimeout)
    if (scrollRAF !== null) cancelAnimationFrame(scrollRAF)
  })

  // ===== Return =====
  return {
    // Router
    router,

    // Core state
    viewProgress,
    currentUserId,
    isLoading,
    loadError,
    groupId: config.groupIdRef,

    // Sub-composable state
    currentBook,
    readingBooks,
    historyBooks,
    selectedBookId,
    selectedBook,
    allBooks,
    fetchBooks,
    memberProgress,
    comments,
    hasMore,
    isLoadingMore,

    // Modals
    modals,

    // Admin action state
    pendingMemberAction,
    pendingBookToDelete,
    clipboardFallbackData,

    // Reactive state
    group,
    members,
    editingGroupName,
    isScrolled,
    reviewInitialData,
    isEditingReview,
    reviewingBookId,
    reviews,
    reviewsBookTitle,
    newAnchorText,
    anchorTextLocked,
    activeMemberMenu,
    showMemberProgress,
    userReviewedBooks,
    highlightedCommentId,
    isSliderDragging,

    // Computed
    myMembership,
    isArchived,
    isReadOnlyMode,
    isSoloGroup,
    isAdmin,
    isPausedGroup,
    isPremium,
    reviewingBook,
    groupName,
    bookTitle,
    bookRoundLabel,
    bookAuthor,
    bookCover,
    toc,
    currentChapterName,
    daysRemaining,
    totalReadingDays,
    daysSinceStart,
    progressStatus,
    commentCount,
    sortedMembersWithProgress,
    sliderMembers,
    visibleAllBooks,
    visibleReadingBooks,
    visibleHistoryBooks,

    // Functions
    fetchData,
    fetchUserReviews,
    handleContainerScroll,
    scrollToPosition,
    handleSliderDragging,
    handleSliderInput,
    handleSliderChange,
    handleWrite,
    handleWriteFromModal,
    closeCommentInput,
    handleLoadMore,
    handleCommentSubmit,
    closeReviewModal,
    openReviewModalForBook,
    handleReviewSubmit,
    handleOpenReview,
    openReviewModalForEdit,
    fetchReviews,
    openReviews,
    openSearchModal,
    handleBookAdd,
    openEditDatesModal,
    openEditTocModal,
    openEditGenreModal,
    openMarkCompletedModal,
    openDeleteBookModal,
    handleEditFinishedDate,
    saveEditedDates,
    saveEditedToc,
    saveEditedGenre,
    saveEditedFinishedDate,
    markAsCompleted,
    deleteBook,
    markAsFinished,
    handleMarkFinished,
    handleUnmarkFinished,
    handleDeleteHistoryBook,
    confirmDeleteHistoryBook,
    handleRestartReading,
    saveGroupName,
    deleteGroup,
    confirmDeleteGroup,
    executeDeleteGroup,
    toggleMemberMenu,
    promoteMember,
    executePromoteMember,
    kickMember,
    executeKickMember,
    handleChangeMemberRole,
    handleKickMember,
    leaveGroup,
    executeLeaveGroup,
    handleBecomeOwner,
    copyInviteLink,
    copyInviteCode,
    regenerateInviteCode,
    executeRegenerateInviteCode,
    cancelRegenerateInviteCode,
    jumpToChapter,
    isCurrentChapter,
    selectBook,
    fetchComments
  }
}
