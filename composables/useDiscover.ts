/**
 * 디스커버 페이지 데이터 Composable
 *
 * HOT 도서, 위시 인기, 평점 TOP, 완독률 TOP 데이터를 가져옵니다.
 */

import { ref } from 'vue'

export interface DiscoverBook {
  isbn: string
  title: string
  author: string
  publisher: string
  cover_url: string
  genre: string | null
  // 섹션별 추가 정보
  count?: number      // 읽는 사람 수 또는 위시 수
  avgRating?: number  // 평균 평점
  reviewCount?: number // 리뷰 수
  completionRate?: number // 완독률 (%)
}

export type PeriodFilter = 'week' | 'month' | 'all'

export const useDiscover = () => {
  const client = useSupabaseClient()
  const loading = ref(false)

  const hotBooks = ref<DiscoverBook[]>([])
  const wishBooks = ref<DiscoverBook[]>([])
  const topRatedBooks = ref<DiscoverBook[]>([])
  const completionBooks = ref<DiscoverBook[]>([])

  // 기간 필터에 따른 날짜 계산
  const getDateFilter = (period: PeriodFilter): string | null => {
    if (period === 'all') return null
    const now = new Date()
    if (period === 'week') {
      now.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      now.setDate(now.getDate() - 30)
    }
    return now.toISOString()
  }

  // 1. HOT 도서: 최근 활발히 읽히는 책
  const fetchHotBooks = async (period: PeriodFilter, genre: string | null) => {
    try {
      const dateFilter = getDateFilter(period)

      // 진행 중인 독서 기록 조회 (finished_at IS NULL)
      let query = client
        .from('user_reading_progress')
        .select(`
          group_book_id,
          last_read_at,
          group_book:group_books!inner (
            isbn,
            genre_snapshot,
            deleted_at,
            book:books!inner (
              isbn,
              title,
              author,
              publisher,
              cover_url,
              official_genre,
              draft_genre
            )
          )
        `)
        .is('finished_at', null)
        .is('group_book.deleted_at', null)

      if (dateFilter) {
        query = query.gte('last_read_at', dateFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // ISBN 기준으로 그룹화하여 카운트
      const bookMap = new Map<string, { book: any; count: number }>()

      data?.forEach((item: any) => {
        const bookData = item.group_book?.book
        if (!bookData) return

        const bookGenre = item.group_book?.genre_snapshot || bookData.official_genre || bookData.draft_genre

        // 장르 필터 적용
        if (genre && bookGenre !== genre) return

        const existing = bookMap.get(bookData.isbn)
        if (existing) {
          existing.count++
        } else {
          bookMap.set(bookData.isbn, {
            book: { ...bookData, genre: bookGenre },
            count: 1
          })
        }
      })

      // 카운트 기준 정렬
      const sorted = Array.from(bookMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)

      hotBooks.value = sorted.map(item => ({
        isbn: item.book.isbn,
        title: item.book.title,
        author: item.book.author,
        publisher: item.book.publisher,
        cover_url: item.book.cover_url,
        genre: item.book.genre,
        count: item.count
      }))
    } catch (err) {
      console.error('[useDiscover] fetchHotBooks error:', err)
      hotBooks.value = []
    }
  }

  // 2. 위시 인기: 가장 많이 위시에 담긴 책
  const fetchWishBooks = async (period: PeriodFilter, genre: string | null) => {
    try {
      const dateFilter = getDateFilter(period)

      let query = client
        .from('user_wishlists')
        .select(`
          isbn,
          created_at,
          book:books!inner (
            isbn,
            title,
            author,
            publisher,
            cover_url,
            official_genre,
            draft_genre
          )
        `)

      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // ISBN 기준으로 그룹화하여 카운트
      const bookMap = new Map<string, { book: any; count: number }>()

      data?.forEach((item: any) => {
        const bookData = item.book
        if (!bookData) return

        const bookGenre = bookData.official_genre || bookData.draft_genre

        // 장르 필터 적용
        if (genre && bookGenre !== genre) return

        const existing = bookMap.get(bookData.isbn)
        if (existing) {
          existing.count++
        } else {
          bookMap.set(bookData.isbn, {
            book: { ...bookData, genre: bookGenre },
            count: 1
          })
        }
      })

      // 카운트 기준 정렬
      const sorted = Array.from(bookMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)

      wishBooks.value = sorted.map(item => ({
        isbn: item.book.isbn,
        title: item.book.title,
        author: item.book.author,
        publisher: item.book.publisher,
        cover_url: item.book.cover_url,
        genre: item.book.genre,
        count: item.count
      }))
    } catch (err) {
      console.error('[useDiscover] fetchWishBooks error:', err)
      wishBooks.value = []
    }
  }

  // 3. 평점 TOP: 평점 높은 책 (리뷰 3개 이상)
  const fetchTopRatedBooks = async (period: PeriodFilter, genre: string | null) => {
    try {
      const dateFilter = getDateFilter(period)

      let query = client
        .from('reviews')
        .select(`
          rating,
          created_at,
          group_book:group_books!inner (
            isbn,
            genre_snapshot,
            deleted_at,
            book:books!inner (
              isbn,
              title,
              author,
              publisher,
              cover_url,
              official_genre,
              draft_genre
            )
          )
        `)
        .is('group_book.deleted_at', null)

      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // ISBN 기준으로 그룹화하여 평균 평점 계산
      const bookMap = new Map<string, { book: any; ratings: number[] }>()

      data?.forEach((item: any) => {
        const bookData = item.group_book?.book
        if (!bookData) return

        const bookGenre = item.group_book?.genre_snapshot || bookData.official_genre || bookData.draft_genre

        // 장르 필터 적용
        if (genre && bookGenre !== genre) return

        const existing = bookMap.get(bookData.isbn)
        if (existing) {
          existing.ratings.push(item.rating)
        } else {
          bookMap.set(bookData.isbn, {
            book: { ...bookData, genre: bookGenre },
            ratings: [item.rating]
          })
        }
      })

      // 리뷰 3개 이상, 평균 평점 기준 정렬
      const sorted = Array.from(bookMap.values())
        .filter(item => item.ratings.length >= 3)
        .map(item => ({
          ...item,
          avgRating: item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length
        }))
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 20)

      topRatedBooks.value = sorted.map(item => ({
        isbn: item.book.isbn,
        title: item.book.title,
        author: item.book.author,
        publisher: item.book.publisher,
        cover_url: item.book.cover_url,
        genre: item.book.genre,
        avgRating: Math.round(item.avgRating * 10) / 10,
        reviewCount: item.ratings.length
      }))
    } catch (err) {
      console.error('[useDiscover] fetchTopRatedBooks error:', err)
      topRatedBooks.value = []
    }
  }

  // 4. 완독률 TOP: 완독 비율 높은 책 (시작한 사람 5명 이상)
  const fetchCompletionBooks = async (period: PeriodFilter, genre: string | null) => {
    try {
      // 모든 reading progress 조회 (기간 필터는 started_at 기준)
      const dateFilter = getDateFilter(period)

      let query = client
        .from('user_reading_progress')
        .select(`
          finished_at,
          created_at,
          group_book:group_books!inner (
            isbn,
            genre_snapshot,
            deleted_at,
            book:books!inner (
              isbn,
              title,
              author,
              publisher,
              cover_url,
              official_genre,
              draft_genre
            )
          )
        `)
        .is('group_book.deleted_at', null)

      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // ISBN 기준으로 그룹화하여 완독률 계산
      const bookMap = new Map<string, { book: any; total: number; finished: number }>()

      data?.forEach((item: any) => {
        const bookData = item.group_book?.book
        if (!bookData) return

        const bookGenre = item.group_book?.genre_snapshot || bookData.official_genre || bookData.draft_genre

        // 장르 필터 적용
        if (genre && bookGenre !== genre) return

        const existing = bookMap.get(bookData.isbn)
        if (existing) {
          existing.total++
          if (item.finished_at) existing.finished++
        } else {
          bookMap.set(bookData.isbn, {
            book: { ...bookData, genre: bookGenre },
            total: 1,
            finished: item.finished_at ? 1 : 0
          })
        }
      })

      // 시작한 사람 5명 이상, 완독률 기준 정렬
      const sorted = Array.from(bookMap.values())
        .filter(item => item.total >= 5)
        .map(item => ({
          ...item,
          completionRate: (item.finished / item.total) * 100
        }))
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 20)

      completionBooks.value = sorted.map(item => ({
        isbn: item.book.isbn,
        title: item.book.title,
        author: item.book.author,
        publisher: item.book.publisher,
        cover_url: item.book.cover_url,
        genre: item.book.genre,
        completionRate: Math.round(item.completionRate),
        count: item.total
      }))
    } catch (err) {
      console.error('[useDiscover] fetchCompletionBooks error:', err)
      completionBooks.value = []
    }
  }

  // 모든 데이터 fetch
  const fetchAll = async (period: PeriodFilter, genre: string | null) => {
    loading.value = true
    try {
      await Promise.all([
        fetchHotBooks(period, genre),
        fetchWishBooks(period, genre),
        fetchTopRatedBooks(period, genre),
        fetchCompletionBooks(period, genre)
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    hotBooks,
    wishBooks,
    topRatedBooks,
    completionBooks,
    fetchAll,
    fetchHotBooks,
    fetchWishBooks,
    fetchTopRatedBooks,
    fetchCompletionBooks
  }
}
