/**
 * 오래된 pending 결제 정리 Cron Job
 * 매일 실행하여 24시간 이상 지난 pending 결제를 cancelled로 처리
 *
 * Vercel Cron: vercel.json에 설정
 */

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Cron Secret으로 인증 (보안)
  const authHeader = getHeader(event, 'authorization')
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET

  // 개발 환경에서는 인증 건너뛰기
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  console.log('[Cron] Starting pending payment cleanup...')

  try {
    // 24시간 전 시각 계산
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // 24시간 이상 지난 pending 결제 조회
    const { data: pendingPayments, error: fetchError } = await serviceClient
      .from('payments')
      .select('id, order_id, created_at')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString())

    if (fetchError) throw fetchError

    console.log(`[Cron] Found ${pendingPayments?.length || 0} pending payments to cleanup`)

    if (!pendingPayments || pendingPayments.length === 0) {
      return {
        message: 'No pending payments to cleanup',
        processed: 0
      }
    }

    // 각 pending 결제를 cancelled로 변경
    let successCount = 0
    let failCount = 0

    for (const payment of pendingPayments) {
      try {
        console.log(`[Cron] Cancelling payment ${payment.order_id}`)

        const { error: updateError } = await serviceClient
          .from('payments')
          .update({
            status: 'cancelled'
          })
          .eq('id', payment.id)

        if (updateError) {
          console.error(`[Cron] Failed to cancel payment ${payment.id}:`, updateError)
          failCount++
          continue
        }

        console.log(`[Cron] Payment ${payment.order_id} cancelled successfully`)
        successCount++

      } catch (error: any) {
        console.error(`[Cron] Error processing payment ${payment.id}:`, error)
        failCount++
      }
    }

    return {
      message: 'Cleanup process completed',
      processed: pendingPayments.length,
      success: successCount,
      failed: failCount
    }

  } catch (error: any) {
    console.error('[Cron] Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
