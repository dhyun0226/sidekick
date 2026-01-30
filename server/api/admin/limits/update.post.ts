/**
 * 관리자 전용 - 구독 제한 설정 업데이트 API
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
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
      message: '관리자 권한이 필요합니다.'
    })
  }

  // 요청 데이터
  const body = await readBody(event)
  const { tier, max_groups_created, max_books_per_group, has_statistics_access } = body

  if (!tier) {
    throw createError({
      statusCode: 400,
      message: 'tier가 필요합니다.'
    })
  }

  // 구독 제한 설정 업데이트
  const { error } = await serviceClient
    .from('subscription_limits')
    .update({
      max_groups_created,
      max_books_per_group,
      has_statistics_access
    })
    .eq('tier', tier)

  if (error) throw error

  return {
    message: '설정이 저장되었습니다.'
  }
})
