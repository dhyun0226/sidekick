/**
 * 관리자 전용 - 통계 데이터 조회 API
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

  // 통계 데이터 수집
  const [
    { count: pendingTocCount },
    { count: totalBooksCount },
    { count: totalUsersCount }
  ] = await Promise.all([
    // 승인 대기 목차
    serviceClient
      .from('books')
      .select('*', { count: 'exact', head: true })
      .not('draft_toc', 'is', null)
      .is('official_toc', null),

    // 전체 도서
    serviceClient
      .from('books')
      .select('*', { count: 'exact', head: true }),

    // 전체 사용자
    serviceClient
      .from('users')
      .select('*', { count: 'exact', head: true })
  ])

  return {
    pendingToc: pendingTocCount || 0,
    totalBooks: totalBooksCount || 0,
    totalUsers: totalUsersCount || 0
  }
})
