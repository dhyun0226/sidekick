/**
 * 특정 유저의 결제 내역 조회 (어드민 전용)
 * GET /api/admin/users/payments?userId=xxx
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)

    if (!user) {
      throw createError({ statusCode: 401, message: '인증이 필요합니다' })
    }

    const serviceClient = serverSupabaseServiceRole(event)

    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('subscription_tier')
      .eq('id', user.sub)
      .single()

    if (userError || userData?.subscription_tier !== 'admin') {
      throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다' })
    }

    const query = getQuery(event)
    const userId = query.userId as string

    if (!userId) {
      throw createError({ statusCode: 400, message: 'userId가 필요합니다' })
    }

    const { data, error } = await serviceClient
      .from('payments')
      .select('id, amount, status, method, approved_at, created_at, plan:subscription_plans(name, display_name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw createError({ statusCode: 500, message: '결제 내역 조회에 실패했습니다' })
    }

    return { payments: data || [] }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[Admin] User payments error:', err)
    throw createError({ statusCode: 500, message: '결제 내역 조회 중 오류가 발생했습니다' })
  }
})
