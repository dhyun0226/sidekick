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
  genre?: string // Group specific genre
  book?: {
    title: string
    author: string
    cover_url: string
    total_pages?: number
    official_genre?: string
    draft_genre?: string
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
  total_pages?: number
  genre?: string // Unified genre to display
  date: string
  round?: number
  reviewCount?: number
  user_finished_at?: string | null
  // Keep these for reference if needed, but 'genre' is the main one
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

export const useGroupBooks = (groupId: string) => {
  const client = useSupabaseClient()
  const { getBookRound } = useBookRound()
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
      .eq('group_id', groupId)
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
        // Prioritize group specific genre -> official -> draft
        genre: b.genre || b.book?.official_genre || b.book?.draft_genre
      }))

      allBooks.value = booksWithUserProgress

      const rawReadingBooks = booksWithUserProgress.filter((b: any) => b.status === 'reading')
      
      readingBooks.value = await Promise.all(
        rawReadingBooks.map(async (b: any) => {
          const round = await getBookRound(groupId, b.isbn, b.id)
          return { ...b, round }
        })
      )

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
            // Use the calculated genre priority
            genre: gb.genre || gb.book.official_genre || gb.book.draft_genre,
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
      const { error: bookInsertError } = await client
        .from('books')
        .insert({
          isbn: data.book.isbn,
          title: data.book.title,
          author: data.book.author,
          publisher: data.book.publisher,
          cover_url: data.book.cover,
          total_pages: data.totalPages,
          draft_toc: data.toc,
          draft_genre: data.genre
        })

      if (bookInsertError) throw new Error('책 정보 저장에 실패했습니다.')
    } else if (!existingBook.official_toc || !existingBook.official_genre) {
      const updateData: any = {
        total_pages: data.totalPages,
        updated_at: new Date().toISOString()
      }
      if (!existingBook.official_toc) updateData.draft_toc = data.toc
      if (!existingBook.official_genre) updateData.draft_genre = data.genre

      const { error: bookUpdateError } = await client
        .from('books')
        .update(updateData)
        .eq('isbn', data.book.isbn)

      if (bookUpdateError) throw new Error('책 정보 업데이트에 실패했습니다.')
    }

    // Determine initial genre for group_books
    // If official exists, use it. If not, use draft (from user input or existing)
    const initialGenre = existingBook?.official_genre || data.genre

    const { error: groupBookError } = await client
      .from('group_books')
      .insert({
        group_id: groupId,
        isbn: data.book.isbn,
        toc_snapshot: data.toc.map(c => ({ title: c.title, startPage: c.startPage })),
        status: 'reading',
        target_start_date: data.startDate,
        target_end_date: data.endDate,
        genre: initialGenre // Save genre snapshot
      })

    if (groupBookError) throw new Error('그룹에 책 추가에 실패했습니다.')

    const currentUserId = userStore.profile?.id
    if (currentUserId) {
      const { data: members } = await client
        .from('group_members')
        .select('user_id, user:users(notification_settings)')
        .eq('group_id', groupId)
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
            source_id: groupId,
            link: `/group/${groupId}`
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

    const { error: groupBookError } = await client
      .from('group_books')
      .update({ toc_snapshot: tocSnapshot })
      .eq('id', bookId)

    if (groupBookError) throw groupBookError

    const { error: bookError } = await client
      .from('books')
      .update({ total_pages: totalPages, draft_toc: tocSnapshot })
      .eq('isbn', isbn)

    if (bookError) throw bookError

    if (currentBook.value?.id === bookId) {
      currentBook.value.toc_snapshot = tocSnapshot
      if (currentBook.value.book) {
        currentBook.value.book.total_pages = totalPages
      }
    }
  }

  const updateGenre = async (bookId: string, isbn: string, genre: string) => {
    // 1. Update group specific genre
    const { error: groupError } = await client
      .from('group_books')
      .update({ genre })
      .eq('id', bookId)

    if (groupError) throw groupError

    // 2. Update public draft genre (Contribution)
    const { error: publicError } = await client
      .from('books')
      .update({ draft_genre: genre })
      .eq('isbn', isbn)
    
    if (publicError) console.warn('Failed to update public draft genre:', publicError)

    // Update local state immediately
    const book = allBooks.value.find(b => b.id === bookId)
    if (book) book.genre = genre
    
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
