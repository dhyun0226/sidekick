import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const toLocalDay = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getMonthKey = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const getStartDate = (year: number, month?: number) => new Date(year, month ? month - 1 : 0, 1)
const getEndDate = (year: number, month?: number) => month
  ? new Date(year, month, 1)
  : new Date(year + 1, 0, 1)

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const query = getQuery(event)
  const now = new Date()
  const year = Math.max(2000, Math.min(2100, Number(query.year || now.getFullYear())))
  const monthValue = query.month ? Number(query.month) : undefined
  const month = monthValue && monthValue >= 1 && monthValue <= 12 ? monthValue : undefined
  const startDate = getStartDate(year, month)
  const endDate = getEndDate(year, month)

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub

  const [sessionsRes, finishedRes, badgesRes] = await Promise.all([
    client
      .from('reading_sessions')
      .select(`
        id, companion_code, started_at, ended_at, duration_seconds,
        end_progress, pages_read, memo_count, quote_count, share_token,
        group_book:group_books(id, books(title, author, cover_url), groups(name, group_type))
      `)
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString())
      .lt('started_at', endDate.toISOString())
      .order('started_at', { ascending: true }),
    client
      .from('user_reading_progress')
      .select(`
        finished_at,
        group_book:group_books(id, books(title, author, cover_url), groups(name, group_type))
      `)
      .eq('user_id', userId)
      .gte('finished_at', startDate.toISOString())
      .lt('finished_at', endDate.toISOString()),
    client
      .from('user_badges')
      .select('earned_at, badge:badges(code, title, description, category)')
      .eq('user_id', userId)
      .gte('earned_at', startDate.toISOString())
      .lt('earned_at', endDate.toISOString())
      .order('earned_at', { ascending: false })
  ])

  if (sessionsRes.error) throw sessionsRes.error
  if (finishedRes.error) throw finishedRes.error
  if (badgesRes.error) throw badgesRes.error

  const sessions = sessionsRes.data || []
  const finishedBooks = finishedRes.data || []
  const badges = badgesRes.data || []
  const dayMap = new Map<string, { day: string; sessions: number; duration: number; pages: number }>()
  const monthMap = new Map<string, number>()
  const weekdayMap = new Map<number, number>()
  const hourMap = new Map<number, number>()
  const companionMap = new Map<string, { code: string; sessions: number; duration: number }>()
  const bookMap = new Map<string, { id: string; title: string; author: string; coverUrl: string; sessions: number; duration: number }>()

  for (const session of sessions as any[]) {
    const date = new Date(session.started_at)
    const dayKey = toLocalDay(session.started_at)
    const monthKey = getMonthKey(session.started_at)
    const duration = session.duration_seconds || 0
    const pages = session.pages_read || 0
    const day = dayMap.get(dayKey) || { day: dayKey, sessions: 0, duration: 0, pages: 0 }
    day.sessions += 1
    day.duration += duration
    day.pages += pages
    dayMap.set(dayKey, day)
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
    weekdayMap.set(date.getDay(), (weekdayMap.get(date.getDay()) || 0) + 1)
    hourMap.set(date.getHours(), (hourMap.get(date.getHours()) || 0) + 1)

    const companionCode = session.companion_code || 'pipi'
    const companion = companionMap.get(companionCode) || { code: companionCode, sessions: 0, duration: 0 }
    companion.sessions += 1
    companion.duration += duration
    companionMap.set(companionCode, companion)

    const groupBook = Array.isArray(session.group_book) ? session.group_book[0] : session.group_book
    if (groupBook?.id) {
      const book = bookMap.get(groupBook.id) || {
        id: groupBook.id,
        title: groupBook.books?.title || '제목 없는 책',
        author: groupBook.books?.author || '',
        coverUrl: groupBook.books?.cover_url || '',
        sessions: 0,
        duration: 0
      }
      book.sessions += 1
      book.duration += duration
      bookMap.set(groupBook.id, book)
    }
  }

  const totalDurationSeconds = sessions.reduce((sum: number, item: any) => sum + (item.duration_seconds || 0), 0)
  const pagesRead = sessions.reduce((sum: number, item: any) => sum + (item.pages_read || 0), 0)
  const noteCount = sessions.reduce((sum: number, item: any) => sum + (item.memo_count || 0) + (item.quote_count || 0), 0)
  const activeDays = dayMap.size
  const longestSession = [...sessions].sort((a: any, b: any) => (b.duration_seconds || 0) - (a.duration_seconds || 0))[0] || null
  const bestDay = [...dayMap.values()].sort((a, b) => b.duration - a.duration || b.sessions - a.sessions)[0] || null
  const topCompanion = [...companionMap.values()].sort((a, b) => b.duration - a.duration || b.sessions - a.sessions)[0] || null
  const topBook = [...bookMap.values()].sort((a, b) => b.duration - a.duration || b.sessions - a.sessions)[0] || null
  const bestWeekday = [...weekdayMap.entries()].sort((a, b) => b[1] - a[1])[0]
  const bestHour = [...hourMap.entries()].sort((a, b) => b[1] - a[1])[0]

  const monthlyBreakdown = Array.from({ length: month ? 1 : 12 }, (_, index) => {
    const monthNumber = month || index + 1
    const key = `${year}-${String(monthNumber).padStart(2, '0')}`
    return {
      key,
      month: monthNumber,
      sessions: monthMap.get(key) || 0
    }
  })

  return {
    period: {
      year,
      month: month || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    },
    stats: {
      sessionCount: sessions.length,
      totalDurationSeconds,
      averageDurationSeconds: sessions.length ? Math.round(totalDurationSeconds / sessions.length) : 0,
      pagesRead,
      noteCount,
      activeDays,
      completedBooks: finishedBooks.length,
      earnedBadges: badges.length
    },
    highlights: {
      longestSession,
      bestDay,
      topCompanion,
      topBook,
      bestWeekday: bestWeekday ? { index: bestWeekday[0], label: weekdayLabels[bestWeekday[0]], count: bestWeekday[1] } : null,
      bestHour: bestHour ? { hour: bestHour[0], count: bestHour[1] } : null
    },
    monthlyBreakdown,
    recentSessions: [...sessions].reverse().slice(0, 8),
    finishedBooks,
    badges
  }
})
