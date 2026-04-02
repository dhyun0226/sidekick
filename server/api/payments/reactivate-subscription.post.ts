/**
 * 구독 자동갱신 재활성화 API
 * - billing_key가 있으면 바로 재활성화
 * - billing_key가 없으면 카드 재등록 필요 안내
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const body = await readBody(event).catch(() => ({}))
  const { billingKey } = body || {}

  const client = serverSupabaseServiceRole(event)

  try {
    // 현재 활성 구독 조회
    const { data: subscription, error: fetchError } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.sub)
      .eq('status', 'active')
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!subscription) {
      throw createError({ statusCode: 404, message: '활성화된 구독이 없습니다.' })
    }

    if (subscription.auto_renew) {
      throw createError({ statusCode: 400, message: '이미 자동갱신이 활성화되어 있습니다.' })
    }

    // billing_key가 없으면 카드 재등록 필요
    if (!subscription.billing_key && !billingKey) {
      return {
        success: false,
        needsCardRegistration: true,
        message: '카드 재등록이 필요합니다.'
      }
    }

    // 새 빌링키가 제공되었으면 업데이트
    const updateData: any = {
      auto_renew: true,
      updated_at: new Date().toISOString()
    }
    if (billingKey) {
      updateData.billing_key = billingKey
    }

    const { error: updateError } = await client
      .from('subscriptions')
      .update(updateData)
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
