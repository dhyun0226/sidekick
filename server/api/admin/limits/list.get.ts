/**
 * 관리자 전용 - 구독 제한 설정 조회 API
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

    const serviceClient = serverSupabaseServiceRole(event)

    // 관리자 권한 체크
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

    // 구독 제한 설정 조회
    const { data, error } = await serviceClient
      .from('subscription_limits')
      .select('*')
      .order('tier')

    if (error) {
      throw createError({
        statusCode: 500,
        message: '구독 제한 설정 조회에 실패했습니다'
      })
    }

    return {
      limits: data || []
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[Admin] Limits list error:', err)
    throw createError({
      statusCode: 500,
      message: '구독 제한 설정 조회 중 오류가 발생했습니다'
    })
  }
})
