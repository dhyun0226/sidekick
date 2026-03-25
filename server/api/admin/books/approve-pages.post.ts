/**
 * 페이지수 승인 API
 * draft_pages → official_pages 복사
 */

import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: '인증이 필요합니다' })
    }

    const serviceClient = serverSupabaseServiceRole(event)

    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('subscription_tier')
      .eq('id', user.sub)
      .single()

    if (userError || userData?.subscription_tier !== 'admin') {
      throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다' })
    }

    const { isbn } = await readBody(event)
    if (!isbn) {
      throw createError({ statusCode: 400, message: 'ISBN이 필요합니다' })
    }

    const { data: book, error: fetchError } = await serviceClient
      .from('books')
      .select('isbn, title, draft_pages')
      .eq('isbn', isbn)
      .single()

    if (fetchError || !book) {
      throw createError({ statusCode: 404, message: '책을 찾을 수 없습니다' })
    }

    if (!book.draft_pages) {
      throw createError({ statusCode: 400, message: '승인할 페이지수가 없습니다' })
    }

    const { error: updateError } = await serviceClient
      .from('books')
      .update({
        official_pages: book.draft_pages,
        updated_at: new Date().toISOString()
      })
      .eq('isbn', isbn)

    if (updateError) {
      throw createError({ statusCode: 500, message: '페이지수 승인에 실패했습니다' })
    }

    return {
      success: true,
      message: `"${book.title}" 페이지수(${book.draft_pages}p)가 승인되었습니다`
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, message: '페이지수 승인 중 오류가 발생했습니다' })
  }
})
