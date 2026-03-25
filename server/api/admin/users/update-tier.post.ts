/**
 * 관리자 전용 - 사용자 등급 업데이트 API
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: '인증이 필요합니다'
      })
    }

    // Service Role 클라이언트로 RLS 우회
    const serviceClient = serverSupabaseServiceRole(event)

    // 관리자 권한 체크 (Service Role로 조회)
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('subscription_tier')
      .eq('id', user.sub)
      .single()

    if (userError || userData?.subscription_tier !== 'admin') {
      throw createError({
        statusCode: 403,
        message: '관리자 권한이 필요합니다'
      })
    }

    // Request body
    const body = await readBody(event)
    const { userId, tier } = body

    if (!userId || !tier) {
      throw createError({
        statusCode: 400,
        message: '필수 정보가 누락되었습니다'
      })
    }

    // Validate tier
    if (!['admin', 'premium', 'free'].includes(tier)) {
      throw createError({
        statusCode: 400,
        message: '잘못된 구독 등급입니다'
      })
    }

    // 사용자 등급 업데이트
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', userId)

    if (updateError) {
      console.error('[Admin] Update tier error:', updateError)
      throw createError({
        statusCode: 500,
        message: '구독 등급 변경에 실패했습니다'
      })
    }

    return {
      success: true,
      message: '구독 등급이 변경되었습니다'
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[Admin] Update tier error:', err)
    throw createError({
      statusCode: 500,
      message: '구독 등급 변경 중 오류가 발생했습니다'
    })
  }
})
