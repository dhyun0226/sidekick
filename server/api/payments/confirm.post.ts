/**
 * 토스 페이먼츠 결제 승인 API
 * 결제 성공 후 호출됨
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get session to extract user
  const { data: { session }, error: sessionError } = await client.auth.getSession()

  if (sessionError || !session || !session.user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const user = session.user

  const body = await readBody(event)
  const { orderId, paymentKey, amount } = body

  if (!orderId || !paymentKey || !amount) {
    throw createError({
      statusCode: 400,
      message: '필수 정보가 누락되었습니다.'
    })
  }

  const config = useRuntimeConfig()
  const secretKey = config.tossSecretKey

  if (!secretKey) {
    throw createError({
      statusCode: 500,
      message: 'Toss Payments 설정이 올바르지 않습니다.'
    })
  }

  try {
    // 1. 토스 페이먼츠에 결제 승인 요청
    const tossResponse = await $fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        amount,
        paymentKey
      })
    })

    console.log('[Payment] Toss confirmation success:', tossResponse)

    // 2. 결제 정보에서 plan_id 가져오기
    const { data: payment } = await client
      .from('payments')
      .select('plan_id')
      .eq('order_id', orderId)
      .single()

    if (!payment || !payment.plan_id) {
      throw new Error('Payment plan not found')
    }

    // 3. 결제 정보 업데이트
    const { error: updateError } = await client
      .from('payments')
      .update({
        payment_key: paymentKey,
        status: 'done',
        method: (tossResponse as any).method,
        approved_at: new Date().toISOString(),
        toss_response: tossResponse
      })
      .eq('order_id', orderId)

    if (updateError) throw updateError

    // 4. 플랜 정보 조회
    const { data: plan } = await client
      .from('subscription_plans')
      .select('*')
      .eq('id', payment.plan_id)
      .single()

    if (!plan) {
      throw new Error('Plan not found')
    }

    // 5. 구독 생성 (billing_period_months에 따라)
    const startDate = new Date()

    // 월말 날짜 문제 해결: 정확한 만료일 계산
    const endDate = new Date(startDate)
    const targetMonth = endDate.getMonth() + plan.billing_period_months
    const targetYear = endDate.getFullYear() + Math.floor(targetMonth / 12)
    const finalMonth = targetMonth % 12

    // 원본 날짜 저장
    const originalDay = endDate.getDate()

    // 월 설정
    endDate.setFullYear(targetYear)
    endDate.setMonth(finalMonth)

    // 해당 월의 마지막 날짜 구하기
    const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()

    // 원본 날짜가 해당 월의 마지막 날보다 크면, 해당 월의 마지막 날로 설정
    endDate.setDate(Math.min(originalDay, lastDayOfMonth))

    const { data: subscription, error: subscriptionError } = await client
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: true
      })
      .select()
      .single()

    if (subscriptionError) throw subscriptionError

    // 5. 결제에 구독 ID 연결
    await client
      .from('payments')
      .update({ subscription_id: subscription.id })
      .eq('order_id', orderId)

    // 6. 사용자 구독 등급 업데이트
    const { error: userUpdateError } = await client
      .from('users')
      .update({ subscription_tier: 'premium' })
      .eq('id', user.id)

    if (userUpdateError) throw userUpdateError

    return {
      success: true,
      message: '프리미엄 구독이 활성화되었습니다!',
      subscription
    }
  } catch (error: any) {
    console.error('[Payment] Confirmation error:', error)

    // 결제 실패 상태로 업데이트
    await client
      .from('payments')
      .update({
        status: 'failed',
        toss_response: error.data || { error: error.message }
      })
      .eq('order_id', orderId)

    throw createError({
      statusCode: 500,
      message: error.data?.message || '결제 승인에 실패했습니다.'
    })
  }
})
