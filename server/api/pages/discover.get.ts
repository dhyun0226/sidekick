/**
 * 디스커버 페이지 통합 API
 * GET /api/pages/discover?period=week|month|all&genre=소설
 *
 * 기존 4개 클라이언트 쿼리를 1개 서버 API로 통합:
 * 1. hotBooks — 최근 활발히 읽히는 책 (진행 중 독서 기록 COUNT)
 * 2. wishBooks — 위시 인기 (위시리스트 COUNT)
 * 3. topRatedBooks — 평점 TOP (리뷰 AVG, 리뷰 3개 이상)
 * 4. completionBooks — 완독률 TOP (finished/total, 시작 5명 이상)
 */
import { serverSupabaseServiceRole } from '#supabase/server'

type PeriodFilter = 'week' | 'month' | 'all'

interface DiscoverBook {
  isbn: string
  title: string
  author: string
  publisher: string
  cover_url: string
  genre: string | null
  count?: number
  avgRating?: number
  reviewCount?: number
  completionRate?: number
}

function getDateFilter(period: PeriodFilter): string | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'week') {
    now.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    now.setDate(now.getDate() - 30)
  }
  return now.toISOString()
}

function resolveGenre(genreSnapshot: string | null, officialGenre: string | null, draftGenre: string | null): string | null {
  return genreSnapshot || officialGenre || draftGenre || null
}

function toDiscoverBook(book: any, genre: string | null, extra: Record<string, any> = {}): DiscoverBook {
  return {
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    cover_url: book.cover_url,
    genre,
    ...extra
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const period = (query.period as PeriodFilter) || 'week'
    const genre = (query.genre as string) || null
    const dateFilter = getDateFilter(period)

    if (!['week', 'month', 'all'].includes(period)) {
      throw createError({ statusCode: 400, message: 'period는 week, month, all 중 하나여야 합니다' })
    }

    const client = serverSupabaseServiceRole(event)

    // 4개 쿼리 병렬 실행
    const [hotRes, wishRes, ratingRes, completionRes] = await Promise.all([
      // 1. HOT 도서: 진행 중인 독서 기록
      (() => {
        let q = client
          .from('user_reading_progress')
          .select(`
            group_book_id,
            group_book:group_books!inner (
              isbn,
              genre_snapshot,
              deleted_at,
              book:books!inner (
                isbn, title, author, publisher, cover_url,
                official_genre, draft_genre
              )
            )
          `)
          .is('finished_at', null)
          .is('group_book.deleted_at', null)

        if (dateFilter) {
          q = q.gte('last_read_at', dateFilter)
        }
        return q
      })(),

      // 2. 위시 인기
      (() => {
        let q = client
          .from('user_wishlists')
          .select(`
            isbn,
            book:books!inner (
              isbn, title, author, publisher, cover_url,
              official_genre, draft_genre
            )
          `)

        if (dateFilter) {
          q = q.gte('created_at', dateFilter)
        }
        return q
      })(),

      // 3. 평점 TOP
      (() => {
        let q = client
          .from('reviews')
          .select(`
            rating,
            group_book:group_books!inner (
              isbn,
              genre_snapshot,
              deleted_at,
              book:books!inner (
                isbn, title, author, publisher, cover_url,
                official_genre, draft_genre
              )
            )
          `)
          .is('group_book.deleted_at', null)

        if (dateFilter) {
          q = q.gte('created_at', dateFilter)
        }
        return q
      })(),

      // 4. 완독률 TOP
      (() => {
        let q = client
          .from('user_reading_progress')
          .select(`
            finished_at,
            group_book:group_books!inner (
              isbn,
              genre_snapshot,
              deleted_at,
              book:books!inner (
                isbn, title, author, publisher, cover_url,
                official_genre, draft_genre
              )
            )
          `)
          .is('group_book.deleted_at', null)

        if (dateFilter) {
          q = q.gte('created_at', dateFilter)
        }
        return q
      })()
    ])

    if (hotRes.error) throw hotRes.error
    if (wishRes.error) throw wishRes.error
    if (ratingRes.error) throw ratingRes.error
    if (completionRes.error) throw completionRes.error

    // --- 서버에서 집계 ---

    // 1. HOT 도서: ISBN별 COUNT, 상위 10개
    const hotMap = new Map<string, { book: any; genre: string | null; count: number }>()
    hotRes.data?.forEach((item: any) => {
      const bookData = item.group_book?.book
      if (!bookData) return
      const bookGenre = resolveGenre(item.group_book?.genre_snapshot, bookData.official_genre, bookData.draft_genre)
      if (genre && bookGenre !== genre) return

      const existing = hotMap.get(bookData.isbn)
      if (existing) {
        existing.count++
      } else {
        hotMap.set(bookData.isbn, { book: bookData, genre: bookGenre, count: 1 })
      }
    })
    const hotBooks: DiscoverBook[] = Array.from(hotMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => toDiscoverBook(item.book, item.genre, { count: item.count }))

    // 2. 위시 인기: ISBN별 COUNT, 상위 10개
    const wishMap = new Map<string, { book: any; genre: string | null; count: number }>()
    wishRes.data?.forEach((item: any) => {
      const bookData = item.book
      if (!bookData) return
      const bookGenre = resolveGenre(null, bookData.official_genre, bookData.draft_genre)
      if (genre && bookGenre !== genre) return

      const existing = wishMap.get(bookData.isbn)
      if (existing) {
        existing.count++
      } else {
        wishMap.set(bookData.isbn, { book: bookData, genre: bookGenre, count: 1 })
      }
    })
    const wishBooks: DiscoverBook[] = Array.from(wishMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => toDiscoverBook(item.book, item.genre, { count: item.count }))

    // 3. 평점 TOP: ISBN별 AVG(rating), 리뷰 3개 이상, 상위 10개
    const ratingMap = new Map<string, { book: any; genre: string | null; ratings: number[] }>()
    ratingRes.data?.forEach((item: any) => {
      const bookData = item.group_book?.book
      if (!bookData) return
      const bookGenre = resolveGenre(item.group_book?.genre_snapshot, bookData.official_genre, bookData.draft_genre)
      if (genre && bookGenre !== genre) return

      const existing = ratingMap.get(bookData.isbn)
      if (existing) {
        existing.ratings.push(item.rating)
      } else {
        ratingMap.set(bookData.isbn, { book: bookData, genre: bookGenre, ratings: [item.rating] })
      }
    })
    const topRatedBooks: DiscoverBook[] = Array.from(ratingMap.values())
      .filter(item => item.ratings.length >= 3)
      .map(item => {
        const avg = item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length
        return { ...item, avgRating: avg }
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10)
      .map(item => toDiscoverBook(item.book, item.genre, {
        avgRating: Math.round(item.avgRating * 10) / 10,
        reviewCount: item.ratings.length
      }))

    // 4. 완독률 TOP: ISBN별 finished/total, 시작 5명 이상, 상위 10개
    const completionMap = new Map<string, { book: any; genre: string | null; total: number; finished: number }>()
    completionRes.data?.forEach((item: any) => {
      const bookData = item.group_book?.book
      if (!bookData) return
      const bookGenre = resolveGenre(item.group_book?.genre_snapshot, bookData.official_genre, bookData.draft_genre)
      if (genre && bookGenre !== genre) return

      const existing = completionMap.get(bookData.isbn)
      if (existing) {
        existing.total++
        if (item.finished_at) existing.finished++
      } else {
        completionMap.set(bookData.isbn, {
          book: bookData,
          genre: bookGenre,
          total: 1,
          finished: item.finished_at ? 1 : 0
        })
      }
    })
    const completionBooks: DiscoverBook[] = Array.from(completionMap.values())
      .filter(item => item.total >= 5)
      .map(item => ({
        ...item,
        completionRate: (item.finished / item.total) * 100
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10)
      .map(item => toDiscoverBook(item.book, item.genre, {
        completionRate: Math.round(item.completionRate),
        count: item.total
      }))

    return { hotBooks, wishBooks, topRatedBooks, completionBooks }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[discover API] error:', err)
    throw createError({ statusCode: 500, message: '디스커버 데이터 조회에 실패했습니다' })
  }
})
