/**
 * Toss Payments Webhook Handler
 * 결제 상태 변경 이벤트를 수신하여 처리
 *
 * 이벤트 타입:
 * - DONE: 결제 완료
 * - CANCELED: 전체 취소
 * - PARTIAL_CANCELED: 부분 취소
 * - EXPIRED: 결제 만료
 * - ABORTED: 결제 중단
 */

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookSecret = config.tossWebhookSecret

  // Webhook 시크릿 검증
  const body = await readBody(event)

  console.log('[Webhook] Received Toss Payments webhook:', JSON.stringify(body, null, 2))

  // 시크릿 검증 (Toss에서 보내는 secret 필드 또는 Basic Auth)
  if (webhookSecret) {
    const authHeader = getHeader(event, 'authorization')
    const expectedAuth = `Basic ${Buffer.from(webhookSecret + ':').toString('base64')}`

    // Basic Auth 또는 body.secret 중 하나로 인증 필요
    const isAuthHeaderValid = authHeader === expectedAuth
    const isBodySecretValid = body.secret === webhookSecret

    if (!isAuthHeaderValid && !isBodySecretValid) {
      console.error('[Webhook] Invalid webhook secret - no valid auth provided')
      throw createError({
        statusCode: 401,
        message: 'Invalid webhook secret'
      })
    }
  } else {
    console.error('[Webhook] TOSS_WEBHOOK_SECRET is not configured - rejecting request')
    throw createError({
      statusCode: 401,
      message: 'Webhook secret not configured'
    })
  }

  const { orderId, status, paymentKey, transactionKey } = body

  if (!orderId || !status) {
    console.error('[Webhook] Missing required fields:', { orderId, status })
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: orderId, status'
    })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  try {
    // 결제 정보 조회
    const { data: payment, error: paymentError } = await serviceClient
      .from('payments')
      .select('*, plan:subscription_plans(*)')
      .eq('order_id', orderId)
      .maybeSingle()

    if (paymentError) {
      console.error('[Webhook] Payment lookup error:', paymentError)
      throw paymentError
    }

    if (!payment) {
      console.log('[Webhook] Payment not found for orderId:', orderId)
      // 결제 정보가 없으면 무시 (다른 시스템의 결제일 수 있음)
      return { success: true, message: 'Payment not found, ignored' }
    }

    console.log('[Webhook] Processing status:', status, 'for payment:', payment.id)

    switch (status) {
      case 'DONE':
        await handlePaymentDone(serviceClient, payment, paymentKey, config)
        break

      case 'CANCELED':
      case 'PARTIAL_CANCELED':
        await handlePaymentCanceled(serviceClient, payment, status)
        break

      case 'EXPIRED':
      case 'ABORTED':
        await handlePaymentFailed(serviceClient, payment, status)
        break

      case 'WAITING_FOR_DEPOSIT':
        // 가상계좌 입금 대기 - 상태만 로깅
        console.log('[Webhook] Waiting for deposit:', orderId)
        break

      default:
        console.log('[Webhook] Unknown status:', status)
    }

    return { success: true, message: `Webhook processed: ${status}` }

  } catch (error: any) {
    console.error('[Webhook] Error processing webhook:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Webhook processing failed'
    })
  }
})

/**
 * 결제 완료 처리 (백업용 - confirm API가 실패한 경우)
 */
async function handlePaymentDone(
  serviceClient: any,
  payment: any,
  paymentKey: string,
  config: any
) {
  // 이미 완료된 결제는 무시
  if (payment.status === 'completed') {
    console.log('[Webhook] Payment already completed:', payment.id)
    return
  }

  console.log('[Webhook] Processing DONE for pending payment:', payment.id)

  // Toss API로 결제 상세 정보 조회
  let tossPaymentInfo = null
  try {
    const secretKey = config.tossSecretKey
    tossPaymentInfo = await $fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    })
  } catch (e) {
    console.error('[Webhook] Failed to fetch payment info from Toss:', e)
  }

  // 1. 결제 상태 업데이트
  await serviceClient
    .from('payments')
    .update({
      status: 'completed',
      payment_key: paymentKey,
      method: (tossPaymentInfo as any)?.method || null,
      approved_at: new Date().toISOString(),
      toss_response: tossPaymentInfo
    })
    .eq('id', payment.id)

  console.log('[Webhook] Payment updated to completed')

  // 2. 활성 구독 확인
  const { data: activeSub } = await serviceClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', payment.user_id)
    .eq('status', 'active')
    .maybeSingle()

  // 3. 구독이 없으면 생성 (confirm API가 실패한 경우의 복구)
  if (!activeSub && payment.plan) {
    const plan = payment.plan
    const startDate = new Date()

    // 종료일 계산
    const targetMonth = startDate.getMonth() + (plan.billing_period_months || 1)
    const targetYear = startDate.getFullYear() + Math.floor(targetMonth / 12)
    const finalMonth = targetMonth % 12
    const originalDay = startDate.getDate()

    const endDate = new Date(startDate)
    endDate.setFullYear(targetYear)
    endDate.setMonth(finalMonth)
    const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()
    endDate.setDate(Math.min(originalDay, lastDayOfMonth))

    const { data: newSub } = await serviceClient
      .from('subscriptions')
      .insert({
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        auto_renew: false // Webhook 복구이므로 빌링키 없음
      })
      .select()
      .single()

    if (newSub) {
      // 결제에 구독 ID 연결
      await serviceClient
        .from('payments')
        .update({ subscription_id: newSub.id })
        .eq('id', payment.id)

      console.log('[Webhook] New subscription created:', newSub.id)
    }

    // 4. 사용자 등급 업데이트
    await serviceClient
      .from('users')
      .update({ subscription_tier: 'premium' })
      .eq('id', payment.user_id)

    console.log('[Webhook] User tier updated to premium')
  }
}

/**
 * 결제 취소/부분 취소 처리
 */
async function handlePaymentCanceled(
  serviceClient: any,
  payment: any,
  status: string
) {
  const newStatus = status === 'CANCELED' ? 'cancelled' : 'refunded'

  // 1. 결제 상태 업데이트
  await serviceClient
    .from('payments')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', payment.id)

  console.log(`[Webhook] Payment status updated to ${newStatus}`)

  // 2. 전체 취소인 경우 구독 처리
  if (status === 'CANCELED') {
    // 관련 구독 조회
    const { data: subscription } = await serviceClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', payment.user_id)
      .eq('status', 'active')
      .maybeSingle()

    if (subscription) {
      // 구독 취소 처리
      await serviceClient
        .from('subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)

      // 사용자 등급 다운그레이드
      await serviceClient
        .from('users')
        .update({ subscription_tier: 'free' })
        .eq('id', payment.user_id)

      console.log('[Webhook] Subscription cancelled and user downgraded')

      // 알림 생성
      await serviceClient.from('notifications').insert({
        user_id: payment.user_id,
        type: 'system',
        title: '결제가 취소되었습니다',
        message: '구독이 취소되었습니다. 다시 구독하시려면 구독 페이지를 방문해주세요.',
        link: '/subscription'
      })
    }
  }
}

/**
 * 결제 실패/만료 처리
 */
async function handlePaymentFailed(
  serviceClient: any,
  payment: any,
  status: string
) {
  // 결제 상태 업데이트
  await serviceClient
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('id', payment.id)

  console.log(`[Webhook] Payment marked as failed (${status})`)

  // 알림 생성
  await serviceClient.from('notifications').insert({
    user_id: payment.user_id,
    type: 'system',
    title: '결제에 실패했습니다',
    message: '결제가 처리되지 않았습니다. 다시 시도해주세요.',
    link: '/subscription'
  })
}
