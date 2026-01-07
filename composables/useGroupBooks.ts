import { ref, computed } from 'vue'

interface BookData {
  id: string
  isbn: string
  status: 'reading' | 'done'
  target_start_date?: string
  target_end_date?: string
  toc_snapshot?: any[]
  finished_at?: string
  created_at: string
  book?: {
    title: string
    author: string
    cover_url: string
    total_pages?: number
  }
  user_reading_progress?: Array<{
    last_read_at?: string
    progress_pct?: number
    finished_at?: string
  }>
  user_finished_at?: string // 사용자의 개인 완독일 (computed)
}

interface HistoryBook {
  id: string
  isbn: string
  title: string
  author: string
  cover_url: string
  publisher?: string
  total_pages?: number
  date: string
  round?: number
  reviewCount?: number
  user_finished_at?: string | null
}

interface BookAddData {
  book: {
    isbn: string
    title: string
    author: string
    publisher: string
    cover: string
  }
  genre: string
  totalPages: number
  toc: any[]
  startDate: string
  endDate: string
}

export const useGroupBooks = (groupId: string) => {
  const client = useSupabaseClient()
  const { getBookRound } = useBookRound()
  const userStore = useUserStore()

  const currentBook = ref<BookData | null>(null)
  const readingBooks = ref<BookData[]>([]) // 읽는 중인 모든 책
  const historyBooks = ref<HistoryBook[]>([])
  const selectedBookId = ref<string | null>(null)
  const allBooks = ref<BookData[]>([])

  // Computed: Currently selected book (either selectedBookId or currentBook)
  const selectedBook = computed(() => {
    if (!selectedBookId.value) return currentBook.value
    return allBooks.value.find(b => b.id === selectedBookId.value) || currentBook.value
  })

  /**
   * Fetch all books (reading + done) for the group
   */
  const fetchBooks = async () => {
    const userId = userStore.profile?.id

    // Fetch all books with user's reading progress and genre
    const { data: allBooksData } = await client
      .from('group_books')
      .select(`
        *,
        book:books(*, official_genre, draft_genre),
        user_reading_progress!left (
          last_read_at,
          progress_pct,
          finished_at
        )
      `)
      .eq('group_id', groupId)
      .in('status', ['reading', 'done'])
      .eq('user_reading_progress.user_id', userId)

    if (allBooksData) {
      // Sort by last_read_at (내가 마지막으로 읽은 책 우선)
      const sortedAllBooks = allBooksData.sort((a: any, b: any) => {
        const aLastRead = a.user_reading_progress?.[0]?.last_read_at
        const bLastRead = b.user_reading_progress?.[0]?.last_read_at

        // 둘 다 진행도 없으면 created_at 기준
        if (!aLastRead && !bLastRead) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        // 하나만 진행도 있으면 그게 우선
        if (!aLastRead) return 1
        if (!bLastRead) return -1

        // 둘 다 있으면 last_read_at 기준 (최근이 먼저)
        return new Date(bLastRead).getTime() - new Date(aLastRead).getTime()
      })

      // Add user_finished_at field from user_reading_progress
      const booksWithUserProgress = sortedAllBooks.map((b: any) => ({
        ...b,
        user_finished_at: b.user_reading_progress?.[0]?.finished_at || null
      }))

      allBooks.value = booksWithUserProgress

      // Find all reading books (여러 권 동시 읽기 가능, 이미 정렬됨)
      const rawReadingBooks = booksWithUserProgress.filter((b: any) => b.status === 'reading')
      
      // 읽는 중인 책들도 회차 정보를 미리 계산
      readingBooks.value = await Promise.all(
        rawReadingBooks.map(async (b: any) => {
          const round = await getBookRound(groupId, b.isbn, b.id)
          return { ...b, round }
        })
      )

      // Current book = 내가 가장 최근에 읽은 reading 책
      currentBook.value = readingBooks.value[0] || null

      // Set selectedBook to currentBook by default
      if (!selectedBookId.value && currentBook.value) {
        selectedBookId.value = currentBook.value.id
      }
    } else {
      allBooks.value = []
      readingBooks.value = []
      currentBook.value = null
    }

    // Create history books from allBooks (status='done')
    const doneBooks = allBooks.value.filter((b: any) => b.status === 'done')

    if (doneBooks.length > 0) {
      // 🔥 성능 최적화: 리뷰 개수 N+1 쿼리 제거 (10권 기준 10개 쿼리 → 1개 쿼리)

      // 1. 모든 완독 책의 리뷰 개수를 한 번에 조회 (1개 쿼리)
      const bookIds = doneBooks.map((gb: any) => gb.id)
      const { data: allReviews } = await client
        .from('reviews')
        .select('group_book_id, rating')
        .in('group_book_id', bookIds)

      // 2. JavaScript에서 책별 리뷰 개수 및 평균 별점 계산
      const reviewStatsMap = new Map<string, { count: number, totalRating: number }>()
      allReviews?.forEach(review => {
        const stats = reviewStatsMap.get(review.group_book_id) || { count: 0, totalRating: 0 }
        reviewStatsMap.set(review.group_book_id, {
          count: stats.count + 1,
          totalRating: stats.totalRating + Number(review.rating || 0)
        })
      })

      // 3. Calculate round numbers and combine data
      const historyBooksWithRounds = await Promise.all(
        doneBooks.map(async (gb: any) => {
          const round = await getBookRound(groupId, gb.isbn, gb.id)
          const stats = reviewStatsMap.get(gb.id) || { count: 0, totalRating: 0 }
          const avgRating = stats.count > 0 ? (stats.totalRating / stats.count).toFixed(1) : null

          return {
            id: gb.id,
            isbn: gb.isbn,
            title: gb.book.title,
            author: gb.book.author,
            cover_url: gb.book.cover_url,
            publisher: gb.book.publisher,
            total_pages: gb.book.total_pages,
            date: gb.finished_at || gb.created_at,
            round,
            reviewCount: stats.count,
            averageRating: avgRating,
            user_finished_at: gb.user_finished_at
          }
        })
      )
      // Sort by finished_at (most recent first)
      historyBooks.value = historyBooksWithRounds.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    } else {
      historyBooks.value = []
    }

    return {
      currentBook: currentBook.value,
      readingBooks: readingBooks.value,
      allBooks: allBooks.value,
      historyBooks: historyBooks.value
    }
  }

  /**
   * Add a new book to the group
   */
  const addBook = async (data: BookAddData) => {
    console.log('[Group] Adding book:', data)
    console.log('[Group] 🔍 DEBUG - data.toc:', JSON.stringify(data.toc, null, 2))
    console.log('[Group] 🔍 DEBUG - data.genre:', data.genre)

    // 1. Check if book exists in books table
    const { data: existingBook, error: bookCheckError } = await client
      .from('books')
      .select('*')
      .eq('isbn', data.book.isbn)
      .maybeSingle()

    if (bookCheckError) {
      console.error('Book check error:', bookCheckError)
    }

    console.log('[Group] 🔍 DEBUG - existingBook:', existingBook)
    console.log('[Group] 🔍 DEBUG - existingBook.official_toc:', existingBook?.official_toc)
    console.log('[Group] 🔍 DEBUG - existingBook.official_genre:', existingBook?.official_genre)

    // ✅ official_toc/official_genre는 화면에 미리 채워주는 가이드 역할
    // ✅ 저장은 항상 사용자가 최종 확인/수정한 값 사용
    const tocToUse = data.toc

    if (!existingBook) {
      // ✅ 새 책: draft_toc, draft_genre에 임시 저장 (관리자 승인 전)
      console.log('[Group] 🔍 DEBUG - Inserting new book with draft data')

      const { data: insertedBook, error: bookInsertError } = await client
        .from('books')
        .insert({
          isbn: data.book.isbn,
          title: data.book.title,
          author: data.book.author,
          publisher: data.book.publisher,
          cover_url: data.book.cover,
          total_pages: data.totalPages,
          draft_toc: data.toc,
          official_toc: null,  // 승인 전이므로 null
          draft_genre: data.genre,
          official_genre: null  // 승인 전이므로 null
        })
        .select()

      if (bookInsertError) {
        console.error('[Group] ❌ Book insert error:', bookInsertError)
        throw new Error('책 정보 저장에 실패했습니다.')
      }

      console.log('[Group] ✅ New book created, returned data:', insertedBook)

      // 🔍 Verify what was actually saved to the database
      const { data: verifyBook, error: verifyError } = await client
        .from('books')
        .select('isbn, title, draft_toc, official_toc, draft_genre, official_genre, total_pages')
        .eq('isbn', data.book.isbn)
        .single()

      if (verifyError) {
        console.error('[Group] ❌ Verify error:', verifyError)
      } else {
        console.log('[Group] 🔍 VERIFY - What\'s actually in DB after insert:')
        console.log('  - ISBN:', verifyBook.isbn)
        console.log('  - Title:', verifyBook.title)
        console.log('  - Total Pages:', verifyBook.total_pages)
        console.log('  - draft_toc:', JSON.stringify(verifyBook.draft_toc, null, 2))
        console.log('  - official_toc:', JSON.stringify(verifyBook.official_toc, null, 2))
        console.log('  - draft_genre:', verifyBook.draft_genre)
        console.log('  - official_genre:', verifyBook.official_genre)
      }
    } else if (!existingBook.official_toc || !existingBook.official_genre) {
      // ✅ 기존 책 + official_toc/official_genre 없음 → draft 업데이트 (관리자 승인 대기)
      console.log('[Group] 🔍 DEBUG - Updating existing book draft data')

      const updateData: any = {
        total_pages: data.totalPages,
        updated_at: new Date().toISOString()
      }

      // Only update draft_toc if official_toc doesn't exist
      if (!existingBook.official_toc) {
        updateData.draft_toc = data.toc
      }

      // Only update draft_genre if official_genre doesn't exist
      if (!existingBook.official_genre) {
        updateData.draft_genre = data.genre
      }

      const { data: updatedBook, error: bookUpdateError } = await client
        .from('books')
        .update(updateData)
        .eq('isbn', data.book.isbn)
        .select()

      if (bookUpdateError) {
        console.error('[Group] ❌ Book update error:', bookUpdateError)
        throw new Error('책 정보 업데이트에 실패했습니다.')
      }

      console.log('[Group] ✅ Updated draft data for existing book, returned data:', updatedBook)

      // 🔍 Verify what was actually saved
      const { data: verifyBook, error: verifyError } = await client
        .from('books')
        .select('isbn, title, draft_toc, official_toc, draft_genre, official_genre, total_pages')
        .eq('isbn', data.book.isbn)
        .single()

      if (verifyError) {
        console.error('[Group] ❌ Verify error:', verifyError)
      } else {
        console.log('[Group] 🔍 VERIFY - What\'s actually in DB after update:')
        console.log('  - ISBN:', verifyBook.isbn)
        console.log('  - Title:', verifyBook.title)
        console.log('  - Total Pages:', verifyBook.total_pages)
        console.log('  - draft_toc:', JSON.stringify(verifyBook.draft_toc, null, 2))
        console.log('  - official_toc:', JSON.stringify(verifyBook.official_toc, null, 2))
        console.log('  - draft_genre:', verifyBook.draft_genre)
        console.log('  - official_genre:', verifyBook.official_genre)
      }
    } else {
      // ❌ 기존 책 + official_toc & official_genre 있음 → books 테이블 건드리지 않음 (승인된 공식 버전 유지)
      console.log('[Group] Using official_toc and official_genre as guide, saving user-confirmed data to group_books only')
    }

    // 2. Add new book to group_books (항상 사용자 입력 사용)
    const { error: groupBookError } = await client
      .from('group_books')
      .insert({
        group_id: groupId,
        isbn: data.book.isbn,
        toc_snapshot: tocToUse,  // 항상 사용자가 확인/수정한 내용 사용
        status: 'reading',
        target_start_date: data.startDate,
        target_end_date: data.endDate
      })

    if (groupBookError) {
      console.error('Group book insert error:', groupBookError)
      throw new Error('그룹에 책 추가에 실패했습니다.')
    }

    console.log('[Group] Book added successfully with user-confirmed TOC')

    // 3. Create notifications for group members (except self)
    const currentUserId = userStore.profile?.id
    if (currentUserId) {
      // Fetch group members with notification settings (excluding self)
      const { data: members } = await client
        .from('group_members')
        .select('user_id, user:users(notification_settings)')
        .eq('group_id', groupId)
        .neq('user_id', currentUserId)

      if (members && members.length > 0) {
        const currentUserName = userStore.profile?.nickname || '누군가'

        // Filter members who have book_added notifications enabled
        const notificationsToSend = members
          .filter((member: any) => {
            const settings = member.user?.notification_settings
            return settings?.book_added !== false // Default to true if not set
          })
          .map((member: any) => ({
            user_id: member.user_id,
            type: 'book_added',
            title: '📚 새로운 책이 시작되었습니다',
            message: `${currentUserName}님이 "${data.book.title}"을(를) 추가했습니다`,
            source_id: groupId,
            link: `/group/${groupId}`
          }))

        if (notificationsToSend.length > 0) {
          const { error: notifError } = await client
            .from('notifications')
            .insert(notificationsToSend)

          if (notifError) {
            console.error('Notification insert error:', notifError)
            // Don't throw - notifications are not critical
          } else {
            console.log(`[Group] Sent notifications to ${notificationsToSend.length} members`)
          }
        }
      }
    }

    // Refresh data
    await fetchBooks()
  }

  /**
   * Update book dates
   */
  const updateDates = async (bookId: string, startDate: string, endDate: string) => {
    const { error } = await client
      .from('group_books')
      .update({
        target_start_date: startDate,
        target_end_date: endDate
      })
      .eq('id', bookId)

    if (error) throw error

    // Update local data
    if (currentBook.value?.id === bookId) {
      currentBook.value.target_start_date = startDate
      currentBook.value.target_end_date = endDate
    }
  }

  /**
   * Update book TOC
   */
  const updateToc = async (
    bookId: string,
    isbn: string,
    totalPages: number,
    chapters: { title: string; startPage: number }[]
  ) => {
    // Calculate new TOC based on new total pages (목차가 없으면 빈 배열)
    const toc = chapters.map((c, i) => {
      const nextStart = chapters[i + 1]?.startPage || totalPages
      const startPct = (c.startPage / totalPages) * 100
      const endPct = (nextStart / totalPages) * 100
      return {
        title: c.title,
        start: startPct,
        end: endPct
      }
    })

    // Update group_books with new TOC
    const { error: groupBookError } = await client
      .from('group_books')
      .update({
        toc_snapshot: toc
      })
      .eq('id', bookId)

    if (groupBookError) throw groupBookError

    // Update books table with new total_pages
    const { error: bookError } = await client
      .from('books')
      .update({
        total_pages: totalPages
      })
      .eq('isbn', isbn)

    if (bookError) throw bookError

    // Update local data
    if (currentBook.value?.id === bookId) {
      currentBook.value.toc_snapshot = toc
      if (currentBook.value.book) {
        currentBook.value.book.total_pages = totalPages
      }
    }
  }

  /**
   * Mark book as completed
   */
  const markCompleted = async (bookId: string) => {
    const { error } = await client
      .from('group_books')
      .update({
        status: 'done',
        finished_at: new Date().toISOString()
      })
      .eq('id', bookId)

    if (error) throw error

    // Refresh data to update UI
    await fetchBooks()
  }

  /**
   * Delete a book from the group
   */
  const deleteBook = async (bookId: string) => {
    const { error } = await client
      .from('group_books')
      .delete()
      .eq('id', bookId)

    if (error) throw error

    // Refresh data to update UI
    await fetchBooks()
  }

  return {
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
    markCompleted,
    deleteBook
  }
}
