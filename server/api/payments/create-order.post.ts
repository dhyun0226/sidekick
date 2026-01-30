/**
 * 결제 주문 생성 API
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const client = await serverSupabaseClient(event)

  const body = await readBody(event)
  const { planId, amount } = body

  if (!planId || !amount) {
    throw createError({
      statusCode: 400,
      message: '필수 정보가 누락되었습니다.'
    })
  }

  try {
    console.log('[Create Order] User ID:', user.sub)

    // 주문 ID 생성 (고유해야 함)
    const orderId = `ORDER_${user.sub.substring(0, 8)}_${nanoid(10)}`
    console.log('[Create Order] Generated order ID:', orderId)

    // 결제 레코드 생성 (pending 상태)
    const { error: paymentError } = await client
      .from('payments')
      .insert({
        user_id: user.sub,
        plan_id: planId,
        order_id: orderId,
        amount,
        status: 'pending'
      })

    if (paymentError) {
      console.error('[Payment] Insert error:', paymentError)
      throw paymentError
    }

    return {
      orderId,
      amount
    }
  } catch (error: any) {
    console.error('[Payment] Create order error:', error)
    throw createError({
      statusCode: 500,
      message: `주문 생성에 실패했습니다: ${error.message || error}`
    })
  }
})
