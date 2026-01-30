import { ref, computed, toValue, type MaybeRef } from 'vue'

interface BookData {
  id: string
  isbn: string
  status: 'reading' | 'done'
  target_start_date?: string
  target_end_date?: string
  toc_snapshot?: any[]
  pages_snapshot?: number // ✅ Group specific total pages (사용자 입력값)
  genre_snapshot?: string // ✅ Group specific genre (사용자 입력값)
  finished_at?: string
  created_at: string
  book?: {
    title: string
    author: string
    cover_url: string
    draft_pages?: number // Draft pages (미승인)
    official_pages?: number // Official pages (승인된 가이드)
    draft_genre?: string
    official_genre?: string // Official genre (승인된 가이드)
  }
  user_reading_progress?: Array<{
    last_read_at?: string
    progress_pct?: number
    finished_at?: string
  }>
  user_finished_at?: string
}

interface HistoryBook {
  id: string
  isbn: string
  title: string
  author: string
  cover_url: string
  publisher?: string
  total_pages?: number // Unified from snapshot → official → draft
  genre?: string // Unified genre to display
  date: string
  round?: number
  reviewCount?: number
  user_finished_at?: string | null
  // Keep these for reference if needed
  official_genre?: string
  draft_genre?: string
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

export const useGroupBooks = (groupId: MaybeRef<string>) => {
  const client = useSupabaseClient()
  const { getBookRound, getBatchBookRounds } = useBookRound()
  const userStore = useUserStore()

  const currentBook = ref<BookData | null>(null)
  const readingBooks = ref<BookData[]>([])
  const historyBooks = ref<HistoryBook[]>([])
  const selectedBookId = ref<string | null>(null)
  const allBooks = ref<BookData[]>([])

  const selectedBook = computed(() => {
    if (!selectedBookId.value) return currentBook.value
    return allBooks.value.find(b => b.id === selectedBookId.value) || currentBook.value
  })

  const fetchBooks = async () => {
    const userId = userStore.profile?.id

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
      .eq('group_id', toValue(groupId))
      .in('status', ['reading', 'done'])
      .eq('user_reading_progress.user_id', userId)

    if (allBooksData) {
      const sortedAllBooks = allBooksData.sort((a: any, b: any) => {
        const aLastRead = a.user_reading_progress?.[0]?.last_read_at
        const bLastRead = b.user_reading_progress?.[0]?.last_read_at

        if (!aLastRead && !bLastRead) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (!aLastRead) return 1
        if (!bLastRead) return -1

        return new Date(bLastRead).getTime() - new Date(aLastRead).getTime()
      })

      const booksWithUserProgress = sortedAllBooks.map((b: any) => ({
        ...b,
        user_finished_at: b.user_reading_progress?.[0]?.finished_at || null,
        // ✅ Unified genre for display (snapshot → official → draft)
        genre: b.genre_snapshot || b.book?.official_genre || b.book?.draft_genre,
        // ✅ Unified total_pages for display (snapshot → official → draft)
        total_pages: b.pages_snapshot || b.book?.official_pages || b.book?.draft_pages
      }))

      // Batch fetch rounds for ALL books (reading + done)
      const allRoundsMap = await getBatchBookRounds(
        toValue(groupId),
        booksWithUserProgress.map((b: any) => ({ isbn: b.isbn, id: b.id }))
      )

      // Add round to allBooks
      allBooks.value = booksWithUserProgress.map((b: any) => ({
        ...b,
        round: allRoundsMap.get(b.id) || null
      }))

      const rawReadingBooks = allBooks.value.filter((b: any) => b.status === 'reading')

      readingBooks.value = rawReadingBooks

      currentBook.value = readingBooks.value[0] || null

      if (!selectedBookId.value && currentBook.value) {
        selectedBookId.value = currentBook.value.id
      }
    } else {
      allBooks.value = []
      readingBooks.value = []
      currentBook.value = null
    }

    const doneBooks = allBooks.value.filter((b: any) => b.status === 'done')

    if (doneBooks.length > 0) {
      const bookIds = doneBooks.map((gb: any) => gb.id)
      const { data: allReviews } = await client
        .from('reviews')
        .select('group_book_id, rating')
        .in('group_book_id', bookIds)

      const reviewStatsMap = new Map<string, { count: number, totalRating: number }>()
      allReviews?.forEach(review => {
        const stats = reviewStatsMap.get(review.group_book_id) || { count: 0, totalRating: 0 }
        reviewStatsMap.set(review.group_book_id, {
          count: stats.count + 1,
          totalRating: stats.totalRating + Number(review.rating || 0)
        })
      })

      const historyBooksWithRounds = await Promise.all(
        doneBooks.map(async (gb: any) => {
          const round = await getBookRound(toValue(groupId), gb.isbn, gb.id)
          const stats = reviewStatsMap.get(gb.id) || { count: 0, totalRating: 0 }
          const avgRating = stats.count > 0 ? (stats.totalRating / stats.count).toFixed(1) : null

          return {
            id: gb.id,
            isbn: gb.isbn,
            title: gb.book.title,
            author: gb.book.author,
            cover_url: gb.book.cover_url,
            publisher: gb.book.publisher,
            // ✅ Use snapshot (사용자 입력값) → fallback to official → draft
            total_pages: gb.pages_snapshot || gb.book.official_pages || gb.book.draft_pages,
            // ✅ Use snapshot (사용자 입력값) → fallback to official → draft
            genre: gb.genre_snapshot || gb.book.official_genre || gb.book.draft_genre,
            official_genre: gb.book.official_genre, // Keep for fallback/debug
            draft_genre: gb.book.draft_genre,       // Keep for fallback/debug
            date: gb.finished_at || gb.created_at,
            round,
            reviewCount: stats.count,
            averageRating: avgRating,
            user_finished_at: gb.user_finished_at
          }
        })
      )
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

  const addBook = async (data: BookAddData) => {
    console.log('[Group] Adding book:', data)

    const { data: existingBook, error: bookCheckError } = await client
      .from('books')
      .select('*')
      .eq('isbn', data.book.isbn)
      .maybeSingle()

    if (bookCheckError) console.error('Book check error:', bookCheckError)

    if (!existingBook) {
      // ✅ 새 책 추가 시: draft만 저장
      const { error: bookInsertError } = await client
        .from('books')
        .insert({
          isbn: data.book.isbn,
          title: data.book.title,
          author: data.book.author,
          publisher: data.book.publisher,
          cover_url: data.book.cover,
          draft_pages: data.totalPages, // ✅ Draft pages
          draft_toc: data.toc,
          draft_genre: data.genre
        })

      if (bookInsertError) throw new Error('책 정보 저장에 실패했습니다.')
    } else if (!existingBook.official_toc || !existingBook.official_genre || !existingBook.official_pages) {
      // ✅ 승인되지 않은 항목만 draft 업데이트
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      if (!existingBook.official_toc) updateData.draft_toc = data.toc
      if (!existingBook.official_genre) updateData.draft_genre = data.genre
      if (!existingBook.official_pages) updateData.draft_pages = data.totalPages

      const { error: bookUpdateError } = await client
        .from('books')
        .update(updateData)
        .eq('isbn', data.book.isbn)

      if (bookUpdateError) throw new Error('책 정보 업데이트에 실패했습니다.')
    }

    const { data: newGroupBook, error: groupBookError } = await client
      .from('group_books')
      .insert({
        group_id: toValue(groupId),
        isbn: data.book.isbn,
        toc_snapshot: data.toc.map(c => ({ title: c.title, startPage: c.startPage })),
        pages_snapshot: data.totalPages, // ✅ 사용자 입력 페이지수
        genre_snapshot: data.genre, // ✅ 사용자 입력 장르
        status: 'reading',
        target_start_date: data.startDate,
        target_end_date: data.endDate
      })
      .select('id')
      .single()

    if (groupBookError) throw new Error('그룹에 책 추가에 실패했습니다.')

    const currentUserId = userStore.profile?.id

    // Check if group is solo type
    const { data: groupData } = await client
      .from('groups')
      .select('group_type')
      .eq('id', toValue(groupId))
      .single()

    // ✅ Solo 그룹: user_reading_progress 레코드 생성 (profile 서재에 바로 나타나도록)
    if (groupData?.group_type === 'solo' && newGroupBook?.id && currentUserId) {
      await client.from('user_reading_progress').upsert({
        user_id: currentUserId,
        group_book_id: newGroupBook.id,
        progress_pct: 0,
        last_read_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,group_book_id'
      })
    }

    // ✅ Social 그룹에서만 알림 생성
    if (currentUserId && groupData?.group_type === 'social') {
        const { data: members } = await client
          .from('group_members')
          .select('user_id, user:users(notification_settings)')
          .eq('group_id', toValue(groupId))
          .neq('user_id', currentUserId)

        if (members && members.length > 0) {
          const currentUserName = userStore.profile?.nickname || '누군가'
          const notificationsToSend = members
            .filter((member: any) => member.user?.notification_settings?.book_added !== false)
            .map((member: any) => ({
              user_id: member.user_id,
              type: 'book_added',
              title: '📚 새로운 책이 시작되었습니다',
              message: `${currentUserName}님이 "${data.book.title}"을(를) 추가했습니다`,
              source_id: toValue(groupId),
              link: `/group/${toValue(groupId)}`
            }))

          if (notificationsToSend.length > 0) {
            await client.from('notifications').insert(notificationsToSend)
          }
        }
    }

    await fetchBooks()
  }

  const updateDates = async (bookId: string, startDate: string, endDate: string) => {
    const { error } = await client
      .from('group_books')
      .update({
        target_start_date: startDate,
        target_end_date: endDate
      })
      .eq('id', bookId)

    if (error) throw error

    if (currentBook.value?.id === bookId) {
      currentBook.value.target_start_date = startDate
      currentBook.value.target_end_date = endDate
    }
  }

  const updateToc = async (
    bookId: string,
    isbn: string,
    totalPages: number,
    chapters: { title: string; startPage: number }[]
  ) => {
    const tocSnapshot = chapters.map(c => ({ title: c.title, startPage: c.startPage }))

    // ✅ Update group-specific snapshot (toc_snapshot + pages_snapshot)
    const { error: groupBookError } = await client
      .from('group_books')
      .update({
        toc_snapshot: tocSnapshot,
        pages_snapshot: totalPages // ✅ 사용자 입력 페이지수 저장
      })
      .eq('id', bookId)

    if (groupBookError) throw groupBookError

    // ✅ Update only draft_toc (NOT total_pages - 승인된 가이드는 유지)
    const { error: bookError } = await client
      .from('books')
      .update({ draft_toc: tocSnapshot })
      .eq('isbn', isbn)

    if (bookError) throw bookError

    // Update local state
    if (currentBook.value?.id === bookId) {
      currentBook.value.toc_snapshot = tocSnapshot
      currentBook.value.pages_snapshot = totalPages
    }
  }

  const updateGenre = async (bookId: string, isbn: string, genre: string) => {
    // ✅ 1. Update group specific genre snapshot
    const { error: groupError } = await client
      .from('group_books')
      .update({ genre_snapshot: genre })
      .eq('id', bookId)

    if (groupError) throw groupError

    // ✅ 2. Update public draft genre (Contribution)
    const { error: publicError } = await client
      .from('books')
      .update({ draft_genre: genre })
      .eq('isbn', isbn)

    if (publicError) console.warn('Failed to update public draft genre:', publicError)

    // Update local state immediately
    const book = allBooks.value.find(b => b.id === bookId)
    if (book) {
      book.genre_snapshot = genre
      book.genre = genre // Also update unified genre
    }
    
    if (currentBook.value?.id === bookId) {
      currentBook.value.genre = genre
    }
  }

  const markCompleted = async (bookId: string) => {
    const { error } = await client
      .from('group_books')
      .update({
        status: 'done',
        finished_at: new Date().toISOString()
      })
      .eq('id', bookId)

    if (error) throw error

    await fetchBooks()
  }

  const deleteBook = async (bookId: string) => {
    const { error } = await client
      .from('group_books')
      .delete()
      .eq('id', bookId)

    if (error) throw error

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
    updateGenre,
    markCompleted,
    deleteBook
  }
}
