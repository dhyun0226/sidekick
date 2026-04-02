/**
 * 자동갱신 테스트 엔드포인트
 * 개발 중 수동으로 갱신 프로세스를 테스트
 */

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 개발 환경에서만 허용
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      message: 'This endpoint is only available in development'
    })
  }

  const body = await readBody(event)
  const { userId } = body

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId is required'
    })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  try {
    // 사용자의 활성 구독 조회
    const { data: subscription, error: subError } = await serviceClient
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (subError) throw subError

    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found'
      }
    }

    console.log('[Test Renewal] Found subscription:', subscription)

    // 만료일 계산
    const endDate = new Date(subscription.end_date)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan.display_name,
        end_date: subscription.end_date,
        auto_renew: subscription.auto_renew,
        billing_key: subscription.billing_key ? '등록됨' : '미등록',
        days_until_expiry: daysUntilExpiry
      },
      message: `구독 정보 조회 성공. ${daysUntilExpiry}일 후 만료 예정.`,
      can_auto_renew: subscription.auto_renew && subscription.billing_key ? true : false
    }
  } catch (error: any) {
    console.error('[Test Renewal] Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
