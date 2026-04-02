/**
 * 빌링키 발급 + 첫 결제 + 구독 생성 (자동결제 방식)
 *
 * Flow:
 * 1. authKey로 빌링키 발급
 * 2. 플랜 검증 (결제 전)
 * 3. 빌링키로 첫 결제 실행
 * 4. 구독 생성/연장
 * 5. 사용자 tier 업데이트
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const body = await readBody(event)
  const { authKey, customerKey, planName } = body

  if (!authKey || !customerKey || !planName) {
    throw createError({ statusCode: 400, message: '필수 정보가 누락되었습니다.' })
  }

  // customerKey 검증 (본인 확인)
  if (customerKey !== user.sub) {
    throw createError({ statusCode: 403, message: '권한이 없습니다.' })
  }

  const config = useRuntimeConfig()
  const secretKey = config.tossSecretKey
  if (!secretKey) {
    throw createError({ statusCode: 500, message: 'Toss Payments 설정이 올바르지 않습니다.' })
  }

  const serviceClient = serverSupabaseServiceRole(event)
  const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`

  try {
    // ========================================
    // 1. 플랜 조회 + 검증 (결제 전!)
    // ========================================
    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      throw createError({ statusCode: 400, message: '플랜을 찾을 수 없습니다.' })
    }

    // 이미 활성 구독이 있고 다른 플랜이면 차단 (결제 전!)
    const { data: activeSub } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.sub)
      .eq('status', 'active')
      .maybeSingle()

    if (activeSub && activeSub.plan_id !== plan.id) {
      throw createError({
        statusCode: 400,
        message: '이미 다른 플랜을 구독 중입니다. 현재 구독이 만료된 후 새로운 플랜을 선택해주세요.'
      })
    }

    console.log('[Billing Subscribe] Plan validated:', plan.name, plan.price)

    // ========================================
    // 2. 빌링키 발급
    // ========================================
    console.log('[Billing Subscribe] Issuing billing key...')
    const billingAuthResponse: any = await $fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ authKey, customerKey })
    })

    const billingKey = billingAuthResponse.billingKey
    if (!billingKey) {
      throw new Error('빌링키 발급에 실패했습니다.')
    }

    console.log('[Billing Subscribe] Billing key issued:', billingKey)

    // ========================================
    // 3. 빌링키로 첫 결제 실행
    // ========================================
    const orderId = `BILL_${user.sub.slice(0, 8)}_${nanoid(10)}`
    const orderName = plan.billing_period === 'yearly' ? '치어리더스 프리미엄 (연간)' : '치어리더스 프리미엄 (월간)'

    console.log('[Billing Subscribe] Charging first payment:', orderId, plan.price)

    const chargeResponse: any = await $fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerKey,
        amount: plan.price,
        orderId,
        orderName,
        customerName: user.user_metadata?.nickname || user.email
      })
    })

    console.log('[Billing Subscribe] First charge success:', chargeResponse.paymentKey)

    // ========================================
    // 4. 결제 기록 저장
    // ========================================
    await serviceClient.from('payments').insert({
      user_id: user.sub,
      plan_id: plan.id,
      order_id: orderId,
      amount: plan.price,
      status: 'completed',
      payment_key: chargeResponse.paymentKey,
      method: chargeResponse.method || '카드',
      approved_at: new Date().toISOString(),
      toss_response: chargeResponse
    })

    // ========================================
    // 5. 구독 생성/연장
    // ========================================
    let subscriptionId: string
    const now = new Date()

    if (activeSub) {
      // 기존 구독 연장
      const currentEndDate = new Date(activeSub.end_date)
      const newEndDate = addMonths(currentEndDate, plan.billing_period_months)

      const { data: updatedSub, error: updateError } = await serviceClient
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          end_date: newEndDate.toISOString(),
          auto_renew: true,
          billing_key: billingKey,
          updated_at: now.toISOString()
        })
        .eq('id', activeSub.id)
        .select()
        .single()

      if (updateError) throw updateError
      subscriptionId = updatedSub.id
      console.log('[Billing Subscribe] Subscription extended:', subscriptionId)
    } else {
      // 신규 구독
      const endDate = addMonths(now, plan.billing_period_months)

      const { data: newSub, error: insertError } = await serviceClient
        .from('subscriptions')
        .insert({
          user_id: user.sub,
          plan_id: plan.id,
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true,
          billing_key: billingKey
        })
        .select()
        .single()

      if (insertError) throw insertError
      subscriptionId = newSub.id
      console.log('[Billing Subscribe] New subscription created:', subscriptionId)
    }

    // 결제에 구독 ID 연결
    await serviceClient
      .from('payments')
      .update({ subscription_id: subscriptionId })
      .eq('order_id', orderId)

    // ========================================
    // 6. 사용자 tier 업데이트
    // ========================================
    await serviceClient
      .from('users')
      .update({ subscription_tier: 'premium' })
      .eq('id', user.sub)

    console.log('[Billing Subscribe] User tier updated to premium')

    // 최종 구독 정보 조회
    const { data: finalSubscription } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    return {
      success: true,
      message: '프리미엄 구독이 활성화되었습니다!',
      subscription: finalSubscription
    }

  } catch (error: any) {
    console.error('[Billing Subscribe] ERROR:', error)
    console.error('[Billing Subscribe] Error details:', error.data || error.message)

    // 사용자 친화적 메시지
    const errorCode = error.data?.code || ''
    const errorMessages: Record<string, string> = {
      'INVALID_CARD_NUMBER': '유효하지 않은 카드 번호입니다.',
      'CARD_LIMIT_EXCEEDED': '카드 한도를 초과했습니다.',
      'INSUFFICIENT_BALANCE': '잔액이 부족합니다.',
      'REJECT_CARD_COMPANY': '카드사에서 결제를 거부했습니다.',
      'EXPIRED_CARD': '만료된 카드입니다.',
      'RESTRICTED_CARD': '사용이 제한된 카드입니다.',
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: errorMessages[errorCode] || error.data?.message || error.message || '결제 처리 중 오류가 발생했습니다.'
    })
  }
})

/** 안전한 월 덧셈 (31일 → 28일 등 오버플로 방지) */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const originalDay = result.getDate()
  result.setMonth(result.getMonth() + months)
  // 월 오버플로 보정 (예: 1월 31일 + 1개월 = 3월 3일 → 2월 28일로 보정)
  if (result.getDate() !== originalDay) {
    result.setDate(0) // 이전 달의 마지막 날로 설정
  }
  return result
}
