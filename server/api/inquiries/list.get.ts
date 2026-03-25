/**
 * 내 문의 목록 조회 API (유저용)
 * GET /api/inquiries/list
 */
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const { data, error } = await client
    .from('inquiries')
    .select('*')
    .eq('user_id', user.sub)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[Inquiry] List error:', error)
    throw createError({ statusCode: 500, message: `문의 목록 조회에 실패했습니다: ${error.message}` })
  }

  return { inquiries: data || [] }
})
