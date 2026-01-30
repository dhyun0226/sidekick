/**
 * 관리자 전용 - 모든 그룹 목록 조회 API
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

  // 모든 그룹 조회

  const { data: groupsData, error: groupsError } = await serviceClient
    .from('groups')
    .select(`
      *,
      owner:users!groups_created_by_fkey(id, nickname),
      group_books(
        id,
        status,
        book:books(isbn, title, cover_url)
      ),
      group_members(count)
    `)
    .order('created_at', { ascending: false })

  if (groupsError) throw groupsError

  // Transform data
  const groups = (groupsData || []).map((group: any) => {
    // Find current reading book
    const currentBook = group.group_books?.find((gb: any) => gb.status === 'reading')

    return {
      ...group,
      owner: {
        username: group.owner?.nickname || '알 수 없음',
        email: null // email은 users 테이블에 없음
      },
      member_count: group.group_members?.[0]?.count || 0,
      current_book: currentBook?.book || null
    }
  })

  return {
    groups
  }
})
