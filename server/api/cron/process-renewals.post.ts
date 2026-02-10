/**
 * 자동갱신 처리 Cron Job
 * 매일 실행하여 만료 예정 구독을 자동 결제
 *
 * Vercel Cron: vercel.json에 설정
 * 또는 Supabase Edge Function으로 실행
 */

import { serverSupabaseServiceRole } from '#supabase/server'
import { nanoid } from 'nanoid'

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
  const secretKey = config.tossSecretKey

  console.log('[Cron] Starting renewal process...')

  try {
    // 1. 7일 이내 만료 예정 + auto_renew=true + billing_key 있는 구독 조회
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    const { data: renewalSubs, error: fetchError } = await serviceClient
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        user:users(id, nickname)
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .not('billing_key', 'is', null)
      .lte('end_date', sevenDaysLater.toISOString())

    if (fetchError) throw fetchError

    console.log(`[Cron] Found ${renewalSubs?.length || 0} subscriptions to renew`)

    if (!renewalSubs || renewalSubs.length === 0) {
      return { message: 'No subscriptions to renew', processed: 0 }
    }

    // 2. 각 구독에 대해 자동결제 시도
    let successCount = 0
    let failCount = 0

    for (const sub of renewalSubs) {
      try {
        console.log(`[Cron] Processing subscription ${sub.id}...`)

        // 주문 ID 생성
        const orderId = `AUTO_${sub.user_id.substring(0, 8)}_${nanoid(10)}`

        // 토스 빌링 결제 요청
        const tossResponse = await $fetch(`https://api.tosspayments.com/v1/billing/${sub.billing_key}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerKey: sub.user_id,
            amount: sub.plan.price,
            orderId,
            orderName: `${sub.plan.display_name} 자동갱신`,
            customerName: sub.user.nickname || '사용자'
          })
        })

        console.log(`[Cron] Billing success for ${sub.id}`)

        // 결제 레코드 생성
        await serviceClient.from('payments').insert({
          user_id: sub.user_id,
          subscription_id: sub.id,
          plan_id: sub.plan_id,
          order_id: orderId,
          payment_key: (tossResponse as any).paymentKey,
          amount: sub.plan.price,
          method: (tossResponse as any).method,
          status: 'completed',
          approved_at: new Date().toISOString(),
          toss_response: tossResponse
        })

        // 구독 연장 (월 오버플로우 방지)
        const currentEndDate = new Date(sub.end_date)
        const targetMonth = currentEndDate.getMonth() + sub.plan.billing_period_months
        const targetYear = currentEndDate.getFullYear() + Math.floor(targetMonth / 12)
        const finalMonth = targetMonth % 12
        const originalDay = currentEndDate.getDate()

        const newEndDate = new Date(currentEndDate)
        newEndDate.setFullYear(targetYear)
        newEndDate.setMonth(finalMonth)

        // 월말 날짜 보정 (예: 1월 31일 + 1개월 = 2월 28일)
        const lastDayOfMonth = new Date(targetYear, finalMonth + 1, 0).getDate()
        newEndDate.setDate(Math.min(originalDay, lastDayOfMonth))

        await serviceClient
          .from('subscriptions')
          .update({
            end_date: newEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id)

        console.log(`[Cron] Subscription ${sub.id} extended to ${newEndDate}`)
        successCount++

      } catch (error: any) {
        console.error(`[Cron] Failed to renew ${sub.id}:`, error)

        // 결제 실패 시 auto_renew 끄기
        await serviceClient
          .from('subscriptions')
          .update({ auto_renew: false })
          .eq('id', sub.id)

        // 실패 알림 생성 (선택)
        await serviceClient.from('notifications').insert({
          user_id: sub.user_id,
          type: 'system',
          title: '자동결제 실패',
          message: '구독 갱신에 실패했습니다. 결제 수단을 확인해주세요.',
          link: '/subscription'
        })

        failCount++
      }
    }

    return {
      message: 'Renewal process completed',
      processed: renewalSubs.length,
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
