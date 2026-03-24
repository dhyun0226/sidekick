/**
 * 전체 문의 목록 조회 API (어드민 전용)
 * GET /api/admin/inquiries/list
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const { data: userData } = await client
    .from('users')
    .select('subscription_tier')
    .eq('id', user.sub)
    .single()

  if (userData?.subscription_tier !== 'admin') {
    throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다.' })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  const query = getQuery(event)
  const status = query.status as string | undefined

  let q = serviceClient
    .from('inquiries')
    .select('*, user:users(id, nickname, email, avatar_url, subscription_tier)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') {
    q = q.eq('status', status)
  }

  const { data, error } = await q

  if (error) {
    console.error('[Admin Inquiry] List error:', error)
    throw createError({ statusCode: 500, message: '문의 목록 조회에 실패했습니다.' })
  }

  return { inquiries: data || [] }
})
