/**
 * 장르 승인 API
 * draft_genre → official_genre 복사
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

  // Request body에서 ISBN과 선택적 장르 받기
  const body = await readBody(event)
  const { isbn, genre } = body

  if (!isbn) {
    throw createError({
      statusCode: 400,
      message: 'ISBN이 필요합니다.'
    })
  }

  // 1. 책 정보 가져오기 (장르 정보 포함)
  const { data: book, error: fetchError } = await serviceClient
    .from('books')
    .select('isbn, title, draft_genre')
    .eq('isbn', isbn)
    .single()

  if (fetchError || !book) {
    throw createError({
      statusCode: 404,
      message: '책을 찾을 수 없습니다.'
    })
  }

  // 사용할 장르 결정 (파라미터로 받은 장르 -> 없으면 draft_genre)
  const finalGenre = genre || book.draft_genre

  if (!finalGenre) {
    throw createError({
      statusCode: 400,
      message: '승인할 장르 정보가 없습니다.'
    })
  }

  // 2. official_genre 업데이트
  const { error: updateError } = await serviceClient
    .from('books')
    .update({
      official_genre: finalGenre,
      updated_at: new Date().toISOString()
    })
    .eq('isbn', isbn)

  if (updateError) {
    console.error('[Admin API] Genre approval error:', updateError)
    throw createError({
      statusCode: 500,
      message: '장르 승인에 실패했습니다.'
    })
  }

  return {
    success: true,
    message: `"${book.title}" 장르가 승인되었습니다.`
  }
})
