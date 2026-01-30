/**
 * 관리자 전용 - 모든 사용자 목록 조회 API
 */

import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
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
      message: '관리자 권한이 필요합니다.'
    })
  }

  // 모든 사용자 조회

  const { data: usersData, error: usersError } = await serviceClient
    .from('users')
    .select(`
      *,
      group_members(count)
    `)
    .order('created_at', { ascending: false })

  if (usersError) throw usersError

  // Transform data to include group_count and username alias
  const users = (usersData || []).map((user: any) => ({
    ...user,
    username: user.nickname || user.email || '이름 없음',
    email: user.email || null,
    group_count: user.group_members?.[0]?.count || 0
  }))

  return {
    users
  }
})
