/**
 * 특정 유저의 활동 통계 조회 (어드민 전용)
 * GET /api/admin/users/stats?userId=xxx
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)

    if (!user) {
      throw createError({ statusCode: 401, message: '인증이 필요합니다' })
    }

    const serviceClient = serverSupabaseServiceRole(event)

    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('subscription_tier')
      .eq('id', user.sub)
      .single()

    if (userError || userData?.subscription_tier !== 'admin') {
      throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다' })
    }

    const query = getQuery(event)
    const userId = query.userId as string

    if (!userId) {
      throw createError({ statusCode: 400, message: 'userId가 필요합니다' })
    }

    const [groupRes, readRes, commentRes] = await Promise.all([
      serviceClient.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('left_at', null),
      serviceClient.from('user_reading_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('finished_at', 'is', null),
      serviceClient.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ])

    return {
      group_count: groupRes.count || 0,
      read_count: readRes.count || 0,
      comment_count: commentRes.count || 0
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[Admin] User stats error:', err)
    throw createError({ statusCode: 500, message: '사용자 통계 조회 중 오류가 발생했습니다' })
  }
})
