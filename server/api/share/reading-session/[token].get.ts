import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: '공유 토큰이 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('reading_sessions')
    .select(`
      id, companion_code, started_at, duration_seconds, end_progress,
      pages_read, share_quote, shared_at,
      user:users(nickname, avatar_url),
      group_book:group_books(
        id,
        books(title, author, cover_url),
        groups(name, group_type)
      )
    `)
    .eq('share_token', token)
    .not('shared_at', 'is', null)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw createError({ statusCode: 404, message: '공유된 독서 카드를 찾을 수 없습니다.' })
  }

  return data
})
