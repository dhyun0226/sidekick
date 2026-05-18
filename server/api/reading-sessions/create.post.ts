import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { awardUserBadges } from '../../utils/v2Badges'

interface SessionPayload {
  groupBookId: string
  companionCode: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  startProgress: number
  endProgress: number
  pagesRead?: number
  memo?: string
  quote?: string
}

const clampProgress = (value: unknown) => {
  const num = Math.round(Number(value || 0))
  return Math.max(0, Math.min(100, Number.isFinite(num) ? num : 0))
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const body = await readBody<SessionPayload>(event)
  if (!body?.groupBookId) {
    throw createError({ statusCode: 400, message: '책 정보가 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub
  const groupBookId = body.groupBookId

  const { data: groupBook, error: bookError } = await client
    .from('group_books')
    .select('id, group_id, status, deleted_at, group:groups(id, group_type, status, deleted_at)')
    .eq('id', groupBookId)
    .single()

  if (bookError || !groupBook || groupBook.deleted_at || groupBook.group?.deleted_at) {
    throw createError({ statusCode: 404, message: '읽을 책을 찾을 수 없습니다.' })
  }

  const { data: membership } = await client
    .from('group_members')
    .select('left_at')
    .eq('group_id', groupBook.group_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership || membership.left_at) {
    throw createError({ statusCode: 403, message: '이 책에 접근할 수 없습니다.' })
  }

  const startProgress = clampProgress(body.startProgress)
  const endProgress = clampProgress(body.endProgress)
  const durationSeconds = Math.max(0, Math.round(Number(body.durationSeconds || 0)))
  const memo = String(body.memo || '').trim()
  const quote = String(body.quote || '').trim()
  const pagesRead = Math.max(0, Math.round(Number(body.pagesRead || 0)))
  const mode = groupBook.group?.group_type === 'social' ? 'group' : 'solo'

  const { data: session, error: sessionError } = await client
    .from('reading_sessions')
    .insert({
      user_id: userId,
      group_book_id: groupBookId,
      group_id: groupBook.group_id,
      mode,
      companion_code: body.companionCode || 'pipi',
      started_at: body.startedAt || new Date().toISOString(),
      ended_at: body.endedAt || new Date().toISOString(),
      duration_seconds: durationSeconds,
      start_progress: startProgress,
      end_progress: endProgress,
      pages_read: pagesRead,
      memo_count: memo ? 1 : 0,
      quote_count: quote ? 1 : 0
    })
    .select()
    .single()

  if (sessionError) {
    throw createError({ statusCode: 500, message: '독서 세션 저장에 실패했습니다.' })
  }

  await client
    .from('user_reading_progress')
    .upsert({
      user_id: userId,
      group_book_id: groupBookId,
      progress_pct: endProgress,
      last_read_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,group_book_id'
    })

  let comment = null
  if (memo || quote) {
    const content = memo || '독서 세션에서 저장한 인용구'
    const { data } = await client
      .from('comments')
      .insert({
        user_id: userId,
        group_book_id: groupBookId,
        content,
        anchor_text: quote || null,
        position_pct: endProgress
      })
      .select('id, content, anchor_text, position_pct, created_at')
      .single()
    comment = data || null
  }

  await client
    .from('user_companion_stats')
    .upsert({
      user_id: userId,
      companion_code: body.companionCode || 'pipi',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,companion_code'
    })

  const { data: stats } = await client
    .from('user_companion_stats')
    .select('total_duration_seconds, session_count, note_count')
    .eq('user_id', userId)
    .eq('companion_code', body.companionCode || 'pipi')
    .maybeSingle()

  await client
    .from('user_companion_stats')
    .update({
      total_duration_seconds: (stats?.total_duration_seconds || 0) + durationSeconds,
      session_count: (stats?.session_count || 0) + 1,
      note_count: (stats?.note_count || 0) + (memo || quote ? 1 : 0),
      affinity_level: Math.max(1, Math.floor(((stats?.total_duration_seconds || 0) + durationSeconds) / 3600) + 1),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('companion_code', body.companionCode || 'pipi')

  let badges: any[] = []
  try {
    badges = await awardUserBadges(client, userId, { type: 'reading_session', id: session.id })
  } catch {
    badges = []
  }

  return { session, comment, progress: endProgress, badges }
})
