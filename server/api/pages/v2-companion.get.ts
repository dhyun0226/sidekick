import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { listUserBadges } from '../../utils/v2Badges'

const emptyV2 = (migrationRequired = false) => ({
  migrationRequired,
  stats: {
    sessionCount: 0,
    totalDurationSeconds: 0,
    pagesRead: 0,
    noteCount: 0,
    activeDays: 0
  },
  activeCompanion: 'pipi',
  companionStats: [],
  recentSessions: [],
  badges: [],
  recommendations: []
})

const isMissingV2Table = (error: any) => {
  const message = `${error?.code || ''} ${error?.message || ''}`
  return message.includes('42P01') || message.includes('reading_sessions') || message.includes('user_companion') || message.includes('badges')
}

const toLocalDay = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub

  const { data: memberships } = await client
    .from('group_members')
    .select('group_id, groups(id, name, group_type, status, deleted_at)')
    .eq('user_id', userId)
    .is('left_at', null)

  const activeGroupIds = (memberships || [])
    .filter((item: any) => item.groups && !item.groups.deleted_at)
    .map((item: any) => item.group_id)

  const currentBooksPromise = activeGroupIds.length > 0
    ? client
      .from('group_books')
      .select(`
        id, group_id, status, target_end_date, pages_snapshot, genre_snapshot,
        books(title, author, cover_url, official_genre, draft_genre),
        groups(id, name, group_type),
        user_reading_progress!left(progress_pct, last_read_at, finished_at)
      `)
      .in('group_id', activeGroupIds)
      .eq('status', 'reading')
      .is('deleted_at', null)
      .eq('user_reading_progress.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8)
    : Promise.resolve({ data: [], error: null })

  const [
    sessionsRes,
    settingsRes,
    statsRes,
    currentBooksRes,
    badgesRes
  ] = await Promise.all([
    client
      .from('reading_sessions')
      .select(`
        id, group_book_id, group_id, companion_code, started_at, ended_at,
        duration_seconds, end_progress, pages_read, memo_count, quote_count,
        share_token, shared_at, share_quote,
        group_book:group_books(id, books(title, author, cover_url), groups(name, group_type))
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(50),
    client
      .from('user_companion_settings')
      .select('active_companion_code, active_wallpaper_code')
      .eq('user_id', userId)
      .maybeSingle(),
    client
      .from('user_companion_stats')
      .select('*')
      .eq('user_id', userId)
      .order('total_duration_seconds', { ascending: false }),
    currentBooksPromise,
    listUserBadges(client, userId)
  ])

  if (sessionsRes.error || settingsRes.error || statsRes.error) {
    const error = sessionsRes.error || settingsRes.error || statsRes.error
    if (isMissingV2Table(error)) return emptyV2(true)
    throw error
  }

  const sessions = sessionsRes.data || []
  const daySet = new Set(sessions.map((item: any) => toLocalDay(item.started_at)))
  const noteCount = sessions.reduce((sum: number, item: any) => sum + (item.memo_count || 0) + (item.quote_count || 0), 0)
  const totalDurationSeconds = sessions.reduce((sum: number, item: any) => sum + (item.duration_seconds || 0), 0)
  const pagesRead = sessions.reduce((sum: number, item: any) => sum + (item.pages_read || 0), 0)
  const companionStats = statsRes.data || []

  const currentBooks = (currentBooksRes.data || []).map((item: any) => {
    const progress = Array.isArray(item.user_reading_progress)
      ? item.user_reading_progress[0]
      : item.user_reading_progress
    return {
      id: item.id,
      title: item.books?.title,
      author: item.books?.author,
      coverUrl: item.books?.cover_url,
      groupName: item.groups?.name,
      groupType: item.groups?.group_type,
      progressPct: progress?.progress_pct || 0,
      targetEndDate: item.target_end_date,
      genre: item.genre_snapshot || item.books?.official_genre || item.books?.draft_genre
    }
  })

  const recommendations = [
    ...currentBooks.slice(0, 3).map((book: any) => ({
      type: 'continue',
      title: book.title,
      subtitle: `${book.progressPct}% 진행 중 · ${book.groupName || '내 서재'}`,
      reason: book.targetEndDate ? '목표일이 있는 진행 중인 책입니다.' : '최근 이어 읽기 좋은 진행 중인 책입니다.',
      actionLabel: '읽기방 열기',
      href: `/read/${book.id}`,
      coverUrl: book.coverUrl
    })),
    {
      type: 'habit',
      title: '오늘 15분만 이어 읽기',
      subtitle: sessions.length > 0 ? '최근 세션 흐름을 끊지 않는 짧은 목표입니다.' : '첫 세션을 만들면 추천이 더 좋아집니다.',
      reason: sessions.length > 0 ? '짧은 세션을 이어가면 읽기 리듬이 끊기지 않습니다.' : '첫 세션을 만들면 배지와 공유 카드가 열립니다.',
      actionLabel: sessions.length > 0 ? '15분 읽기' : '첫 세션 시작',
      href: currentBooks[0]?.id ? `/read/${currentBooks[0].id}` : '/my-library',
      coverUrl: currentBooks[0]?.coverUrl || null
    },
    {
      type: 'badge',
      title: noteCount >= 5 ? '다음 배지 확인하기' : '문장 수집가 배지 도전',
      subtitle: noteCount >= 5 ? '이미 기록 기반 배지 조건을 채웠습니다.' : `메모나 인용구 ${Math.max(0, 5 - noteCount)}개를 더 남기면 좋아요.`,
      reason: 'v2는 읽는 시간뿐 아니라 남긴 문장도 성장 흐름으로 봅니다.',
      actionLabel: currentBooks[0]?.id ? '기록 남기기' : '책 추가하기',
      href: currentBooks[0]?.id ? `/read/${currentBooks[0].id}` : '/my-library',
      coverUrl: null
    }
  ].slice(0, 4)

  return {
    migrationRequired: false,
    stats: {
      sessionCount: sessions.length,
      totalDurationSeconds,
      pagesRead,
      noteCount,
      activeDays: daySet.size
    },
    activeCompanion: settingsRes.data?.active_companion_code || 'pipi',
    companionStats,
    recentSessions: sessions.slice(0, 6),
    badges: badgesRes,
    recommendations
  }
})
