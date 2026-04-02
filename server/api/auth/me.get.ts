/**
 * 현재 로그인한 사용자 정보 확인 (디버깅용)
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

  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', user.sub)
    .single()

  return {
    auth_user: user,
    db_user: userData,
    error: userError
  }
})
