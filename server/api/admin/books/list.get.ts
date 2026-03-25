/**
 * 관리자 전용 - 모든 도서 목록 조회 API
 */

import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

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

    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('subscription_tier')
      .eq('id', user.sub)
      .single()

    if (userError) {
      throw createError({
        statusCode: 500,
        message: `유저 조회 실패: ${userError.message}`
      })
    }

    if (userData?.subscription_tier !== 'admin') {
      throw createError({
        statusCode: 403,
        message: '관리자 권한이 필요합니다'
      })
    }

    const { data, error } = await serviceClient
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({
        statusCode: 500,
        message: `도서 조회 실패: ${error.message}`
      })
    }

    return { books: data || [] }
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || '알 수 없는 에러'
    })
  }
})
