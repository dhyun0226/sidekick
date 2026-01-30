/**
 * 관리자 전용 - 모든 구독 목록 조회 API
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  // 관리자 권한 체크
  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('subscription_tier')
    .eq('id', user.sub)
    .single()

  if (userError || userData?.subscription_tier !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '관리자 권한이 필요합니다.'
    })
  }

  // 모든 구독 조회
  const { data, error } = await serviceClient
    .from('subscriptions')
    .select(`
      *,
      user:users!subscriptions_user_id_fkey(id, nickname),
      plan:subscription_plans(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Transform data to add username alias
  const subscriptions = (data || []).map((sub: any) => ({
    ...sub,
    user: sub.user ? {
      ...sub.user,
      username: sub.user.nickname,
      email: null
    } : null
  }))

  return {
    subscriptions
  }
})
