/**
 * 문의 답변 API (어드민 전용)
 * POST /api/admin/inquiries/reply
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: '인증이 필요합니다.' })
  }

  const { data: userData } = await client
    .from('users')
    .select('subscription_tier')
    .eq('id', user.sub)
    .single()

  if (userData?.subscription_tier !== 'admin') {
    throw createError({ statusCode: 403, message: '관리자 권한이 필요합니다.' })
  }

  const { inquiryId, reply, status } = await readBody(event)

  if (!inquiryId || !reply) {
    throw createError({ statusCode: 400, message: '문의 ID와 답변 내용이 필요합니다.' })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  const { data, error } = await serviceClient
    .from('inquiries')
    .update({
      admin_reply: reply,
      status: status || 'replied',
      replied_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', inquiryId)
    .select()
    .single()

  if (error) {
    console.error('[Admin Inquiry] Reply error:', error)
    throw createError({ statusCode: 500, message: '답변 등록에 실패했습니다.' })
  }

  // 유저에게 알림
  const { data: inquiry } = await serviceClient
    .from('inquiries')
    .select('user_id, title')
    .eq('id', inquiryId)
    .single()

  if (inquiry) {
    await serviceClient.from('notifications').insert({
      user_id: inquiry.user_id,
      type: 'system',
      title: '문의에 답변이 등록되었습니다',
      message: `"${inquiry.title}" 문의에 답변이 등록되었습니다.`,
      link: '/settings'
    })
  }

  return { success: true, inquiry: data }
})
