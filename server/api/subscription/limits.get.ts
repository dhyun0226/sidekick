/**
 * 사용자 구독 제한 및 사용 현황 조회 API
 *
 * GET /api/subscription/limits
 *
 * Returns:
 * - tier: 현재 구독 등급 (free/premium/admin)
 * - limits: 그룹 생성 현황, 최대 제한, 통계 접근 권한 등
 */

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get session to extract user
  const { data: { session }, error: sessionError } = await client.auth.getSession()

  if (sessionError || !session || !session.user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const user = session.user

  try {
    // Call database function to get usage stats
    const { data, error } = await client
      .rpc('get_user_subscription_usage', { p_user_id: user.id })
      .single()

    if (error) {
      console.error('[Subscription] Get usage error:', error)
      throw error
    }

    return {
      tier: data.tier,
      limits: {
        groupsCreated: data.groups_created,
        maxGroups: data.max_groups,
        canCreateGroup: data.can_create_group,
        hasStatisticsAccess: data.has_statistics_access
      }
    }
  } catch (error: any) {
    console.error('[Subscription] Get limits error:', error)
    throw createError({
      statusCode: 500,
      message: '구독 정보 조회에 실패했습니다.'
    })
  }
})
