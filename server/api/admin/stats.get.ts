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

  try {
    // 통계 데이터 수집
    const [pendingRes, booksRes, usersRes] = await Promise.all([
      serviceClient
        .from('books')
        .select('*', { count: 'exact', head: true })
        .not('draft_toc', 'is', null)
        .is('official_toc', null),

      serviceClient
        .from('books')
        .select('*', { count: 'exact', head: true }),

      serviceClient
        .from('users')
        .select('*', { count: 'exact', head: true })
    ])

    if (pendingRes.error || booksRes.error || usersRes.error) {
      throw createError({
        statusCode: 500,
        message: `DB 조회 실패: ${pendingRes.error?.message || booksRes.error?.message || usersRes.error?.message}`
      })
    }

    return {
      pendingToc: pendingRes.count || 0,
      totalBooks: booksRes.count || 0,
      totalUsers: usersRes.count || 0
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || '통계 조회에 실패했습니다'
    })
  }
})
