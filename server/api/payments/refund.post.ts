/**
 * 결제 환불(취소) API (관리자 전용)
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

  // 관리자 권한 체크
  const { data: userData, error: userError } = await client
    .from('users')
    .select('subscription_tier')
    .eq('id', user.sub)
    .single()

  if (userError || userData?.subscription_tier !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '관리자 권한이 필요합니다.'
    })
  }

  const body = await readBody(event)
  const { paymentId } = body

  if (!paymentId) {
    throw createError({
      statusCode: 400,
      message: '결제 ID가 필요합니다.'
    })
  }

  // 1. 결제 정보 조회
  const { data: payment, error: fetchError } = await client
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    throw createError({
      statusCode: 404,
      message: '결제 정보를 찾을 수 없습니다.'
    })
  }

  if (payment.status !== 'completed') {
    throw createError({
      statusCode: 400,
      message: '완료된 결제만 환불할 수 있습니다.'
    })
  }

  // 2. 결제 상태 업데이트 (cancelled)
  const { error: updatePaymentError } = await client
    .from('payments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentId)

  if (updatePaymentError) throw updatePaymentError

  // 3. (옵션) 관련된 구독 처리
  // 이 결제 건으로 인해 시작된 구독이 있다면 만료 처리하거나 등급 하향
  // NOTE: 여러 활성 구독 / 부분 환불 시나리오는 v2.0에서 개선
  const { data: subscription } = await client
    .from('subscriptions')
    .select('*')
    .eq('user_id', payment.user_id)
    .eq('status', 'active')
    .maybeSingle()

  if (subscription) {
    // 가장 최근 결제 건인지 확인 로직이 필요할 수 있으나, 단순화하여 즉시 취소 처리
    // NOTE: payment.id와 subscription 연관성은 v2.0에서 개선
    const { error: subCancelError } = await client
      .from('subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (subCancelError) {
      console.error('[Refund] Failed to cancel subscription:', subCancelError)
      // 구독 취소 실패해도 환불은 계속 진행
    }

    // 유저 등급도 free로 하향
    const { error: tierDowngradeError } = await client
      .from('users')
      .update({ subscription_tier: 'free' })
      .eq('id', payment.user_id)

    if (tierDowngradeError) {
      console.error('[Refund] Failed to downgrade tier:', tierDowngradeError)
      // 등급 하향 실패해도 환불은 계속 진행
    }
  }

  return {
    success: true,
    message: '환불 처리가 완료되었습니다.'
  }
})
