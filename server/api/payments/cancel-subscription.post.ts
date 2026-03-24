/**
 * 구독 취소 API
 * 자동 갱신을 중지하고 현재 기간 종료 시 무료 플랜으로 전환
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
      console.error('[CancelSubscription] Query error:', fetchError)
      throw fetchError
    }

    if (!subscription) {
      throw createError({
        statusCode: 404,
        message: '활성화된 구독이 없습니다.'
      })
    }

    // 빌링키가 있으면 토스에서 해지
    if (subscription.billing_key) {
      const config = useRuntimeConfig()
      const secretKey = config.tossSecretKey
      if (secretKey) {
        try {
          await $fetch(`https://api.tosspayments.com/v1/billing/authorizations/${subscription.billing_key}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
            }
          })
          console.log('[CancelSubscription] Billing key revoked:', subscription.billing_key)
        } catch (billingError: any) {
          // 빌링키 해지 실패해도 자동갱신은 끄기 (cron에서 결제 시도 시 실패할 것)
          console.error('[CancelSubscription] Billing key revoke failed:', billingError.message)
        }
      }
    }

    // 자동 갱신 중지 + 빌링키 제거
    const { error: updateError } = await client
      .from('subscriptions')
      .update({
        auto_renew: false,
        billing_key: null,
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
