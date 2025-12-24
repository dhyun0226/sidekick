/**
 * 구독 취소 API
 * 자동 갱신을 중지하고 현재 기간 종료 시 무료 플랜으로 전환
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  try {
    // 현재 활성 구독 조회
    const { data: subscription, error: fetchError } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (fetchError || !subscription) {
      throw createError({
        statusCode: 404,
        message: '활성화된 구독이 없습니다.'
      })
    }

    // 자동 갱신 중지
    const { error: updateError } = await client
      .from('subscriptions')
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) throw updateError

    return {
      success: true,
      message: '구독이 취소되었습니다. 현재 기간 종료일까지 프리미엄 기능을 사용할 수 있습니다.',
      endDate: subscription.end_date
    }
  } catch (error: any) {
    console.error('[Subscription] Cancel error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '구독 취소에 실패했습니다.'
    })
  }
})
