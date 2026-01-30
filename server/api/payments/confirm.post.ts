/**
 * 토스 페이먼츠 결제 승인 API
 * 결제 성공 후 호출됨
 */

import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const body = await readBody(event)
  const { orderId, paymentKey, amount } = body

  if (!orderId || !paymentKey || !amount) {
    throw createError({
      statusCode: 400,
      message: '필수 정보가 누락되었습니다.'
    })
  }

  console.log('[Payment Confirm] Starting confirmation process:', { orderId, paymentKey, amount, userId: user.sub })

  const config = useRuntimeConfig()
  const secretKey = config.tossSecretKey

  if (!secretKey) {
    throw createError({
      statusCode: 500,
      message: 'Toss Payments 설정이 올바르지 않습니다.'
    })
  }

  // Service Role 클라이언트 사용 (RLS 우회)
  const serviceClient = serverSupabaseServiceRole(event)

  try {
    // 1. 토스 페이먼츠에 결제 승인 요청
    console.log('[Payment Confirm] Requesting Toss API confirmation...')
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

    console.log('[Payment Confirm] Toss confirmation success:', tossResponse)

    // 2. 결제 정보에서 plan_id와 user_id 가져오기
    const { data: payment, error: paymentError } = await serviceClient
      .from('payments')
      .select('plan_id, user_id, status')
      .eq('order_id', orderId)
      .single()

    if (paymentError || !payment || !payment.plan_id) {
      console.error('[Payment Confirm] Payment not found:', paymentError)
      throw new Error('Payment plan not found')
    }

    // 중복 결제 방지: 이미 완료된 결제는 다시 처리하지 않음
    if (payment.status === 'done') {
      console.log('[Payment Confirm] Payment already processed:', orderId)
      return {
        success: true,
        message: 'Payment already confirmed',
        alreadyProcessed: true
      }
    }

    console.log('[Payment Confirm] Payment found:', payment)

    // 3. 결제 정보 업데이트
    const { error: updateError } = await serviceClient
      .from('payments')
      .update({
        payment_key: paymentKey,
        status: 'done',
        method: (tossResponse as any).method,
        approved_at: new Date().toISOString(),
        toss_response: tossResponse
      })
      .eq('order_id', orderId)

    if (updateError) {
      console.error('[Payment Confirm] Payment update error:', updateError)
      throw updateError
    }

    console.log('[Payment Confirm] Payment updated to done')

    // 4. 플랜 정보 조회
    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('*')
      .eq('id', payment.plan_id)
      .single()

    if (planError || !plan) {
      console.error('[Payment Confirm] Plan not found:', planError)
      throw new Error('Plan not found')
    }

    console.log('[Payment Confirm] Plan found:', plan)

    // 5. 구독 처리 (신규 또는 연장)

    // 현재 활성 구독 확인
    const { data: activeSub } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.sub)
      .eq('status', 'active')
      .maybeSingle()

    console.log('[Payment Confirm] Active subscription check:', activeSub)

    // 활성 구독이 있는데 다른 플랜으로 결제하려는 경우 차단
    if (activeSub && activeSub.plan_id !== plan.id) {
      console.error('[Payment Confirm] Plan change blocked:', { currentPlan: activeSub.plan_id, newPlan: plan.id })
      throw createError({
        statusCode: 400,
        message: '이미 다른 플랜을 구독 중입니다. 현재 구독이 만료된 후 새로운 플랜을 선택해주세요.'
      })
    }

    let subscriptionId: string
    let startDate: Date
    let endDate: Date

    if (activeSub) {
      // === 구독 연장 로직 ===
      console.log('[Payment Confirm] Extending existing subscription')
      startDate = new Date(activeSub.start_date) // 시작일은 유지
      const currentEndDate = new Date(activeSub.end_date)

      // 현재 만료일 기준 + 플랜 기간
      const targetMonth = currentEndDate.getMonth() + plan.billing_period_months
      const targetYear = currentEndDate.getFullYear() + Math.floor(targetMonth / 12)
      const finalMonth = targetMonth % 12

      const originalDay = currentEndDate.getDate()

      endDate = new Date(currentEndDate)
      endDate.setFullYear(targetYear)
      endDate.setMonth(finalMonth)

      const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()
      endDate.setDate(Math.min(originalDay, lastDayOfMonth))

      // 기존 구독 업데이트
      const { data: updatedSub, error: updateSubError } = await serviceClient
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          end_date: endDate.toISOString(),
          auto_renew: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeSub.id)
        .select()
        .single()

      if (updateSubError) {
        console.error('[Payment Confirm] Subscription update error:', updateSubError)
        throw updateSubError
      }
      subscriptionId = updatedSub.id
      console.log('[Payment Confirm] Subscription extended:', subscriptionId)

    } else {
      // === 신규 구독 생성 로직 ===
      console.log('[Payment Confirm] Creating new subscription')
      startDate = new Date()

      // 오늘 기준 + 플랜 기간
      const targetMonth = startDate.getMonth() + plan.billing_period_months
      const targetYear = startDate.getFullYear() + Math.floor(targetMonth / 12)
      const finalMonth = targetMonth % 12

      const originalDay = startDate.getDate()

      endDate = new Date(startDate)
      endDate.setFullYear(targetYear)
      endDate.setMonth(finalMonth)

      const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()
      endDate.setDate(Math.min(originalDay, lastDayOfMonth))

      const { data: newSub, error: insertSubError } = await serviceClient
        .from('subscriptions')
        .insert({
          user_id: user.sub,
          plan_id: plan.id,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true
        })
        .select()
        .single()

      if (insertSubError) {
        console.error('[Payment Confirm] Subscription insert error:', insertSubError)
        throw insertSubError
      }
      subscriptionId = newSub.id
      console.log('[Payment Confirm] New subscription created:', subscriptionId)
    }

    // 6. 결제에 구독 ID 연결
    await serviceClient
      .from('payments')
      .update({ subscription_id: subscriptionId })
      .eq('order_id', orderId)

    console.log('[Payment Confirm] Payment linked to subscription')

    // 7. 사용자 구독 등급 업데이트
    const { error: userUpdateError } = await serviceClient
      .from('users')
      .update({ subscription_tier: 'premium' })
      .eq('id', user.sub)

    if (userUpdateError) {
      console.error('[Payment Confirm] User update error:', userUpdateError)
      throw userUpdateError
    }

    console.log('[Payment Confirm] User tier updated to premium')

    // 8. 빌링키 발급 (자동갱신용) - 선택적
    if (plan.billing_period === 'monthly' || plan.billing_period === 'yearly') {
      try {
        console.log('[Payment Confirm] Issuing billing key for auto-renewal...')

        const billingResponse = await $fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerKey: user.sub,  // 사용자 고유 키
            authKey: paymentKey     // 방금 결제한 카드의 키
          })
        })

        console.log('[Payment Confirm] Billing key issued:', (billingResponse as any).billingKey)

        // 구독에 billing_key 저장
        await serviceClient
          .from('subscriptions')
          .update({
            billing_key: (billingResponse as any).billingKey,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId)

        console.log('[Payment Confirm] Billing key saved to subscription')
      } catch (billingError: any) {
        // 빌링 등록 실패해도 구독은 유지 (수동 갱신 가능)
        console.error('[Payment Confirm] Failed to issue billing key:', billingError)
        console.error('[Payment Confirm] Billing error details:', billingError.data)
        // 에러는 무시하고 계속 진행
      }
    }

    // 최종 구독 정보 조회
    const { data: finalSubscription } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    console.log('[Payment Confirm] Success! Final subscription:', finalSubscription)

    return {
      success: true,
      message: '프리미엄 구독이 활성화되었습니다!',
      subscription: finalSubscription
    }
  } catch (error: any) {
    console.error('[Payment Confirm] ERROR:', error)
    console.error('[Payment Confirm] Error details:', {
      message: error.message,
      data: error.data,
      statusCode: error.statusCode,
      stack: error.stack
    })

    // 결제 실패 상태로 업데이트
    if (orderId) {
      try {
        await serviceClient
          .from('payments')
          .update({
            status: 'failed',
            toss_response: error.data || { error: error.message }
          })
          .eq('order_id', orderId)

        console.log('[Payment Confirm] Payment status updated to failed')
      } catch (updateErr) {
        console.error('[Payment Confirm] Failed to update payment status:', updateErr)
      }
    }

    throw createError({
      statusCode: 500,
      message: error.data?.message || error.message || '결제 승인에 실패했습니다.'
    })
  }
})
