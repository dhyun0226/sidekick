import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

type BookCandidate = {
  isbn: string
  title: string
  author: string
  publisher: string
  coverUrl: string
  genre: string | null
  score: number
  reasons: string[]
  signals: Record<string, number | string | null>
}

const resolveGenre = (genreSnapshot?: string | null, officialGenre?: string | null, draftGenre?: string | null) =>
  genreSnapshot || officialGenre || draftGenre || null

const normalizeBook = (book: any, genre: string | null): BookCandidate | null => {
  if (!book?.isbn) return null
  return {
    isbn: book.isbn,
    title: book.title || '제목 없는 책',
    author: book.author || '',
    publisher: book.publisher || '',
    coverUrl: book.cover_url || '',
    genre,
    score: 0,
    reasons: [],
    signals: {}
  }
}

const addCandidate = (map: Map<string, BookCandidate>, next: BookCandidate | null, score: number, reason: string, signals: Record<string, number | string | null> = {}) => {
  if (!next) return
  const current = map.get(next.isbn) || next
  current.score += score
  if (!current.reasons.includes(reason)) current.reasons.push(reason)
  current.signals = { ...current.signals, ...signals }
  map.set(current.isbn, current)
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub

  const [myProgressRes, mySessionsRes, myWishlistRes, globalProgressRes, globalWishlistRes, globalReviewsRes, feedbackRes] = await Promise.all([
    client
      .from('user_reading_progress')
      .select(`
        finished_at,
        group_book:group_books(
          isbn, genre_snapshot,
          books(isbn, title, author, publisher, cover_url, official_genre, draft_genre)
        )
      `)
      .eq('user_id', userId),
    client
      .from('reading_sessions')
      .select(`
        duration_seconds,
        group_book:group_books(
          isbn, genre_snapshot,
          books(isbn, title, author, publisher, cover_url, official_genre, draft_genre)
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(100),
    client
      .from('user_wishlists')
      .select('isbn, book:books(isbn, title, author, publisher, cover_url, official_genre, draft_genre)')
      .eq('user_id', userId),
    client
      .from('user_reading_progress')
      .select(`
        finished_at,
        group_book:group_books(
          isbn, genre_snapshot,
          books(isbn, title, author, publisher, cover_url, official_genre, draft_genre)
        )
      `)
      .limit(1000),
    client
      .from('user_wishlists')
      .select('isbn, book:books(isbn, title, author, publisher, cover_url, official_genre, draft_genre)')
      .limit(1000),
    client
      .from('reviews')
      .select(`
        rating,
        group_book:group_books(
          isbn, genre_snapshot,
          books(isbn, title, author, publisher, cover_url, official_genre, draft_genre)
        )
      `)
      .limit(1000),
    client
      .from('recommendation_feedback')
      .select('isbn, feedback')
      .eq('user_id', userId)
  ])

  if (myProgressRes.error) throw myProgressRes.error
  if (mySessionsRes.error) throw mySessionsRes.error
  if (myWishlistRes.error) throw myWishlistRes.error
  if (globalProgressRes.error) throw globalProgressRes.error
  if (globalWishlistRes.error) throw globalWishlistRes.error
  if (globalReviewsRes.error) throw globalReviewsRes.error
  if (feedbackRes.error && feedbackRes.error.code !== '42P01') throw feedbackRes.error

  const completedIsbns = new Set<string>()
  const currentIsbns = new Set<string>()
  const wishlistIsbns = new Set<string>()
  const ignoredIsbns = new Set<string>()
  const wantedIsbns = new Set<string>()
  const genreScores = new Map<string, number>()
  const authorScores = new Map<string, number>()
  const recentGenreScores = new Map<string, number>()

  for (const item of feedbackRes.data || []) {
    if ((item as any).feedback === 'not_interested') ignoredIsbns.add((item as any).isbn)
    if ((item as any).feedback === 'want_to_read') wantedIsbns.add((item as any).isbn)
  }

  for (const item of myProgressRes.data || []) {
    const groupBook = Array.isArray((item as any).group_book) ? (item as any).group_book[0] : (item as any).group_book
    const book = groupBook?.books
    const isbn = book?.isbn || groupBook?.isbn
    if (!isbn) continue
    if ((item as any).finished_at) completedIsbns.add(isbn)
    else currentIsbns.add(isbn)
    const genre = resolveGenre(groupBook?.genre_snapshot, book?.official_genre, book?.draft_genre)
    if (genre) genreScores.set(genre, (genreScores.get(genre) || 0) + ((item as any).finished_at ? 4 : 2))
    if (book?.author) authorScores.set(book.author, (authorScores.get(book.author) || 0) + ((item as any).finished_at ? 4 : 2))
  }

  for (const [index, session] of (mySessionsRes.data || []).entries()) {
    const groupBook = Array.isArray((session as any).group_book) ? (session as any).group_book[0] : (session as any).group_book
    const book = groupBook?.books
    const genre = resolveGenre(groupBook?.genre_snapshot, book?.official_genre, book?.draft_genre)
    const durationWeight = Math.max(1, Math.round(((session as any).duration_seconds || 0) / 600))
    const recencyWeight = Math.max(1, 6 - Math.floor(index / 5))
    if (genre) {
      genreScores.set(genre, (genreScores.get(genre) || 0) + durationWeight)
      recentGenreScores.set(genre, (recentGenreScores.get(genre) || 0) + recencyWeight)
    }
    if (book?.author) authorScores.set(book.author, (authorScores.get(book.author) || 0) + Math.ceil(durationWeight / 2))
  }

  for (const item of myWishlistRes.data || []) {
    const book = Array.isArray((item as any).book) ? (item as any).book[0] : (item as any).book
    if (book?.isbn) wishlistIsbns.add(book.isbn)
    const genre = resolveGenre(null, book?.official_genre, book?.draft_genre)
    if (genre) genreScores.set(genre, (genreScores.get(genre) || 0) + 1)
    if (book?.author) authorScores.set(book.author, (authorScores.get(book.author) || 0) + 1)
  }

  const preferredGenres = [...genreScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre)

  const candidates = new Map<string, BookCandidate>()
  const wishCounts = new Map<string, number>()
  const completionCounts = new Map<string, { total: number; finished: number }>()
  const ratingCounts = new Map<string, { total: number; count: number }>()

  for (const item of globalWishlistRes.data || []) {
    const book = Array.isArray((item as any).book) ? (item as any).book[0] : (item as any).book
    if (!book?.isbn) continue
    wishCounts.set(book.isbn, (wishCounts.get(book.isbn) || 0) + 1)
  }

  for (const item of globalProgressRes.data || []) {
    const groupBook = Array.isArray((item as any).group_book) ? (item as any).group_book[0] : (item as any).group_book
    const book = groupBook?.books
    const isbn = book?.isbn || groupBook?.isbn
    if (!isbn) continue
    const current = completionCounts.get(isbn) || { total: 0, finished: 0 }
    current.total += 1
    if ((item as any).finished_at) current.finished += 1
    completionCounts.set(isbn, current)
  }

  for (const item of globalReviewsRes.data || []) {
    const groupBook = Array.isArray((item as any).group_book) ? (item as any).group_book[0] : (item as any).group_book
    const book = groupBook?.books
    if (!book?.isbn) continue
    const current = ratingCounts.get(book.isbn) || { total: 0, count: 0 }
    current.total += Number((item as any).rating || 0)
    current.count += 1
    ratingCounts.set(book.isbn, current)
  }

  const seenSourceRows = [
    ...(globalWishlistRes.data || []).map((item: any) => ({ book: Array.isArray(item.book) ? item.book[0] : item.book, genreSnapshot: null })),
    ...(globalProgressRes.data || []).map((item: any) => {
      const groupBook = Array.isArray(item.group_book) ? item.group_book[0] : item.group_book
      return { book: groupBook?.books, genreSnapshot: groupBook?.genre_snapshot }
    }),
    ...(globalReviewsRes.data || []).map((item: any) => {
      const groupBook = Array.isArray(item.group_book) ? item.group_book[0] : item.group_book
      return { book: groupBook?.books, genreSnapshot: groupBook?.genre_snapshot }
    })
  ]

  for (const row of seenSourceRows) {
    const book = row.book
    if (!book?.isbn || completedIsbns.has(book.isbn) || currentIsbns.has(book.isbn) || ignoredIsbns.has(book.isbn)) continue
    const genre = resolveGenre(row.genreSnapshot, book.official_genre, book.draft_genre)
    const base = normalizeBook(book, genre)
    const wishCount = wishCounts.get(book.isbn) || 0
    const completion = completionCounts.get(book.isbn)
    const rating = ratingCounts.get(book.isbn)
    const avgRating = rating?.count ? Math.round((rating.total / rating.count) * 10) / 10 : 0
    const completionRate = completion?.total ? Math.round((completion.finished / completion.total) * 100) : 0
    const authorScore = book.author ? (authorScores.get(book.author) || 0) : 0
    const recentGenreScore = genre ? (recentGenreScores.get(genre) || 0) : 0

    if (wishlistIsbns.has(book.isbn)) {
      addCandidate(candidates, base, 18, '위시리스트에 담아둔 책입니다.', { wishlist: 'mine' })
    }
    if (wantedIsbns.has(book.isbn)) {
      addCandidate(candidates, base, 22, '읽고 싶다고 표시한 책입니다.', { feedback: 'want_to_read' })
    }
    if (genre && preferredGenres.includes(genre)) {
      addCandidate(candidates, base, 12 + (genreScores.get(genre) || 0), `최근 ${genre} 흐름과 잘 맞습니다.`, { genre })
    }
    if (genre && recentGenreScore > 0) {
      addCandidate(candidates, base, Math.min(18, recentGenreScore * 2), `최근 세션에서 자주 머문 ${genre} 계열입니다.`, { recentGenreScore })
    }
    if (authorScore > 0) {
      addCandidate(candidates, base, Math.min(12, authorScore * 2), '이미 읽은 작가/관심 작가 흐름과 이어집니다.', { authorScore })
    }
    if (wishCount > 0) {
      addCandidate(candidates, base, Math.min(16, wishCount * 2), `${wishCount}명이 위시리스트에 담았습니다.`, { wishCount })
    }
    if (avgRating >= 4) {
      addCandidate(candidates, base, Math.min(14, avgRating * 2), `평균 평점 ${avgRating}점으로 반응이 좋습니다.`, { avgRating, reviewCount: rating?.count || 0 })
    }
    if (completionRate >= 50 && (completion?.total || 0) >= 3) {
      addCandidate(candidates, base, Math.min(14, completionRate / 8), `완독률 ${completionRate}%로 끝까지 읽힌 책입니다.`, { completionRate })
    }
  }

  const ranked = [...candidates.values()]
    .filter(item => item.score > 0)
    .map(item => ({
      ...item,
      score: Math.round(item.score * 10) / 10,
      reasons: item.reasons.slice(0, 3)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 24)

  return {
    preferredGenres,
    forYou: ranked.slice(0, 8),
    wishlist: ranked.filter(item => item.signals.wishlist === 'mine').slice(0, 8),
    momentum: ranked.filter(item => Number(item.signals.wishCount || 0) > 0 || Number(item.signals.avgRating || 0) >= 4).slice(0, 8),
    all: ranked
  }
})
