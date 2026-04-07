/**
 * Admin middleware - 관리자 권한 체크
 * /admin/* 경로 접근 시 subscription_tier = 'admin' 체크
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const client = useSupabaseClient()

  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    return navigateTo('/')
  }

  // users 테이블에서 subscription_tier 확인
  const { data: userData, error: userError } = await client
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    return navigateTo('/')
  }

  if (userData.subscription_tier !== 'admin') {
    return navigateTo('/')
  }
})
