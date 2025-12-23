/**
 * 목차 승인 API
 * draft_toc → official_toc 복사
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  // 관리자 권한 체크
  const { data: userData, error: userError } = await client
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (userError || userData?.subscription_tier !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '관리자 권한이 필요합니다.'
    })
  }

  // Request body에서 ISBN 받기
  const body = await readBody(event)
  const { isbn } = body

  if (!isbn) {
    throw createError({
      statusCode: 400,
      message: 'ISBN이 필요합니다.'
    })
  }

  // 1. 책 정보 가져오기
  const { data: book, error: fetchError } = await client
    .from('books')
    .select('isbn, title, draft_toc')
    .eq('isbn', isbn)
    .single()

  if (fetchError || !book) {
    throw createError({
      statusCode: 404,
      message: '책을 찾을 수 없습니다.'
    })
  }

  if (!book.draft_toc) {
    throw createError({
      statusCode: 400,
      message: '승인할 목차가 없습니다.'
    })
  }

  // 2. draft_toc → official_toc 복사
  const { error: updateError } = await client
    .from('books')
    .update({
      official_toc: book.draft_toc,
      updated_at: new Date().toISOString()
    })
    .eq('isbn', isbn)

  if (updateError) {
    console.error('[Admin API] TOC approval error:', updateError)
    throw createError({
      statusCode: 500,
      message: '목차 승인에 실패했습니다.'
    })
  }

  return {
    success: true,
    message: `"${book.title}" 목차가 승인되었습니다.`
  }
})
