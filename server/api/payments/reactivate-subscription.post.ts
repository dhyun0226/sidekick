/**
 * 구독 자동갱신 재활성화 API
 * 취소했던 구독의 auto_renew를 다시 true로 설정
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const client = await serverSupabaseClient(event)

  try {
    // 현재 활성 구독 조회
    const { data: subscription, error: fetchError } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.sub)
      .eq('status', 'active')
      .maybeSingle()

    if (fetchError) {
      console.error('[ReactivateSubscription] Query error:', fetchError)
      throw fetchError
    }

    if (!subscription) {
      throw createError({
        statusCode: 404,
        message: '활성화된 구독이 없습니다.'
      })
    }

    if (subscription.auto_renew) {
      throw createError({
        statusCode: 400,
        message: '이미 자동갱신이 활성화되어 있습니다.'
      })
    }

    // 자동 갱신 재활성화
    const { error: updateError } = await client
      .from('subscriptions')
      .update({
        auto_renew: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) throw updateError

    return {
      success: true,
      message: '자동갱신이 재활성화되었습니다.',
      endDate: subscription.end_date
    }
  } catch (error: any) {
    console.error('[Subscription] Reactivate error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '자동갱신 재활성화에 실패했습니다.'
    })
  }
})
