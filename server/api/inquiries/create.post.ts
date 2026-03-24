/**
 * 문의 작성 API (유저용)
 * POST /api/inquiries/create
 */
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const { category, title, content } = await readBody(event)

  if (!category || !title?.trim() || !content?.trim()) {
    throw createError({ statusCode: 400, message: '카테고리, 제목, 내용을 모두 입력해주세요.' })
  }

  const validCategories = ['payment', 'bug', 'feature', 'account', 'other']
  if (!validCategories.includes(category)) {
    throw createError({ statusCode: 400, message: '올바른 카테고리를 선택해주세요.' })
  }

  if (title.length > 100 || content.length > 2000) {
    throw createError({ statusCode: 400, message: '제목은 100자, 내용은 2000자 이내로 작성해주세요.' })
  }

  const { data, error } = await client
    .from('inquiries')
    .insert({
      user_id: user.sub,
      category,
      title,
      content
    })
    .select()
    .single()

  if (error) {
    console.error('[Inquiry] Create error:', error)
    throw createError({ statusCode: 500, message: '문의 등록에 실패했습니다.' })
  }

  return { success: true, inquiry: data }
})
