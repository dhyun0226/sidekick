/**
 * 목차 수정 API
 * draft_toc 업데이트
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

  // Request body
  const body = await readBody(event)
  const { isbn, totalPages, toc, tocType } = body

  if (!isbn || !totalPages || !toc || !tocType) {
    throw createError({
      statusCode: 400,
      message: '필수 정보가 누락되었습니다.'
    })
  }

  // Validate tocType
  if (tocType !== 'draft' && tocType !== 'official') {
    throw createError({
      statusCode: 400,
      message: '잘못된 목차 타입입니다.'
    })
  }

  // 1. 책 정보 업데이트
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  // ✅ Update the appropriate TOC and Pages fields
  if (tocType === 'official') {
    updateData.official_toc = JSON.stringify(toc)
    updateData.official_pages = totalPages
  } else {
    updateData.draft_toc = JSON.stringify(toc)
    updateData.draft_pages = totalPages
  }

  const { error: updateError } = await serviceClient
    .from('books')
    .update(updateData)
    .eq('isbn', isbn)

  if (updateError) {
    console.error('[Admin API] TOC update error:', updateError)
    throw createError({
      statusCode: 500,
      message: '목차 수정에 실패했습니다.'
    })
  }

  const message = tocType === 'official'
    ? '승인된 목차가 수정되었습니다.'
    : '목차가 수정되었습니다.'

  return {
    success: true,
    message
  }
})
