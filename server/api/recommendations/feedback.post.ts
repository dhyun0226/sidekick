import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const body = await readBody<{ isbn?: string; feedback?: 'want_to_read' | 'not_interested' }>(event)
  const isbn = String(body?.isbn || '').trim()
  const feedback = body?.feedback

  if (!isbn || !['want_to_read', 'not_interested'].includes(feedback || '')) {
    throw createError({ statusCode: 400, message: '추천 피드백 정보가 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('recommendation_feedback')
    .upsert({
      user_id: user.sub,
      isbn,
      feedback,
      source: 'v2',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,isbn'
    })
    .select('*')
    .single()

  if (error) throw error

  return { feedback: data }
})
