/**
 * 자동갱신 재활성화: 카드 재등록 후 빌링키 발급 + 구독 업데이트
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const body = await readBody(event)
  const { authKey, customerKey } = body

  if (!authKey || !customerKey) {
    throw createError({ statusCode: 400, message: '필수 정보가 누락되었습니다.' })
  }

  if (customerKey !== user.sub) {
    throw createError({ statusCode: 403, message: '권한이 없습니다.' })
  }

  const config = useRuntimeConfig()
  const secretKey = config.tossSecretKey
  const serviceClient = serverSupabaseServiceRole(event)
  const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`

  try {
    // 1. 활성 구독 확인
    const { data: subscription } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.sub)
      .eq('status', 'active')
      .maybeSingle()

    if (!subscription) {
      throw createError({ statusCode: 404, message: '활성화된 구독이 없습니다.' })
    }

    // 2. 빌링키 발급
    console.log('[Billing Reactivate] Issuing billing key...')
    const billingResponse: any = await $fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey, customerKey })
    })

    const billingKey = billingResponse.billingKey
    if (!billingKey) {
      throw new Error('빌링키 발급에 실패했습니다.')
    }

    // 3. 구독 업데이트 (빌링키 + 자동갱신 활성화)
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        billing_key: billingKey,
        auto_renew: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) throw updateError

    console.log('[Billing Reactivate] Subscription reactivated with new billing key')

    // 업데이트된 구독 조회
    const { data: updatedSub } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscription.id)
      .single()

    return {
      success: true,
      message: '자동갱신이 재활성화되었습니다.',
      subscription: updatedSub
    }
  } catch (error: any) {
    console.error('[Billing Reactivate] ERROR:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.message || error.message || '자동갱신 재활성화에 실패했습니다.'
    })
  }
})
