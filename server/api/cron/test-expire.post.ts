/**
 * 만료 처리 테스트 엔드포인트
 * 개발 중 수동으로 만료 프로세스를 테스트
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

    console.log('[Test Expire] Found subscription:', subscription)

    // 만료일 확인
    const endDate = new Date(subscription.end_date)
    const now = new Date()
    const isExpired = endDate < now

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan.display_name,
        end_date: subscription.end_date,
        status: subscription.status,
        is_expired: isExpired
      },
      message: isExpired
        ? `구독이 만료되었습니다. expire-subscriptions Cron 실행 시 처리됩니다.`
        : `구독이 ${endDate.toLocaleDateString('ko-KR')}에 만료 예정입니다.`
    }
  } catch (error: any) {
    console.error('[Test Expire] Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
