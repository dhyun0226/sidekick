/**
 * 인증 미들웨어
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const client = useSupabaseClient()

  // 로그인이 필요없는 공개 페이지들
  const publicPages = ['/login', '/auth/callback']
  const isPublicPage = publicPages.some(page => to.path.startsWith(page))

  if (isPublicPage) {
    return // 공개 페이지는 통과
  }

  // 세션 확인
  const { data: { session }, error } = await client.auth.getSession()

  if (error || !session) {
    console.log('[Auth Middleware] No session, redirecting to login')
    return navigateTo('/login')
  }

  console.log('[Auth Middleware] User authenticated:', session.user.id)
})
