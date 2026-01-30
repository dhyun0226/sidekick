/**
 * 관리자 전용 - 모든 결제 내역 조회 API
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

  // 모든 결제 조회
  const { data, error } = await serviceClient
    .from('payments')
    .select(`
      *,
      user:users!payments_user_id_fkey(id, nickname)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Transform data to add username alias
  const payments = (data || []).map((payment: any) => ({
    ...payment,
    user: payment.user ? {
      ...payment.user,
      username: payment.user.nickname,
      email: null
    } : null
  }))

  return {
    payments
  }
})
