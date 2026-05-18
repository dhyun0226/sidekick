import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const query = getQuery(event)
  const bookId = String(query.bookId || '')
  if (!bookId) {
    throw createError({ statusCode: 400, message: '책 정보가 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub

  const { data: groupBook, error: bookError } = await client
    .from('group_books')
    .select(`
      id, isbn, group_id, status, target_start_date, target_end_date,
      finished_at, deleted_at, toc_snapshot, pages_snapshot, genre_snapshot,
      book:books(title, author, publisher, cover_url, official_pages, draft_pages, official_genre, draft_genre),
      group:groups(id, name, group_type, status, deleted_at)
    `)
    .eq('id', bookId)
    .single()

  if (bookError || !groupBook || groupBook.deleted_at) {
    throw createError({ statusCode: 404, message: '읽을 책을 찾을 수 없습니다.' })
  }

  const { data: membership } = await client
    .from('group_members')
    .select('role, left_at')
    .eq('group_id', groupBook.group_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership || membership.left_at) {
    throw createError({ statusCode: 403, message: '이 책에 접근할 수 없습니다.' })
  }

  const { data: progress } = await client
    .from('user_reading_progress')
    .select('progress_pct, finished_at, last_read_at')
    .eq('user_id', userId)
    .eq('group_book_id', bookId)
    .maybeSingle()

  const { data: settings } = await client
    .from('user_companion_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const { data: recentSessions } = await client
    .from('reading_sessions')
    .select('id, companion_code, started_at, ended_at, duration_seconds, end_progress, pages_read, memo_count, quote_count')
    .eq('user_id', userId)
    .eq('group_book_id', bookId)
    .order('started_at', { ascending: false })
    .limit(5)

  return {
    book: {
      ...groupBook,
      total_pages: groupBook.pages_snapshot || groupBook.book?.official_pages || groupBook.book?.draft_pages || null,
      genre: groupBook.genre_snapshot || groupBook.book?.official_genre || groupBook.book?.draft_genre || null
    },
    group: groupBook.group,
    membership,
    progress: {
      progress_pct: progress?.progress_pct || 0,
      finished_at: progress?.finished_at || null,
      last_read_at: progress?.last_read_at || null
    },
    settings: settings || {
      active_companion_code: 'pipi',
      active_wallpaper_code: 'morning-desk',
      reaction_intensity: 'normal',
      sound_enabled: true
    },
    recentSessions: recentSessions || []
  }
})
