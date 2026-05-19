import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Math.round(Number(value))
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, number))
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const body = await readBody<{
    groupBookId?: string
    targetMinutes?: number
    targetPages?: number
    targetProgress?: number | null
    targetDate?: string | null
  }>(event)

  if (!body?.groupBookId) {
    throw createError({ statusCode: 400, message: '책 정보가 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub

  const { data: groupBook, error: bookError } = await client
    .from('group_books')
    .select('id, group_id, deleted_at, group:groups(id, deleted_at)')
    .eq('id', body.groupBookId)
    .maybeSingle()

  if (bookError) throw bookError
  if (!groupBook || groupBook.deleted_at || groupBook.group?.deleted_at) {
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

  const targetProgress = body.targetProgress == null
    ? null
    : clampInt(body.targetProgress, 0, 100, 0)

  const { data, error } = await client
    .from('reading_goals')
    .upsert({
      user_id: userId,
      group_book_id: body.groupBookId,
      target_minutes: clampInt(body.targetMinutes, 1, 600, 25),
      target_pages: clampInt(body.targetPages, 0, 99999, 0),
      target_progress: targetProgress,
      target_date: body.targetDate || null,
      status: 'active',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,group_book_id'
    })
    .select('*')
    .single()

  if (error) throw error

  return { goal: data }
})
