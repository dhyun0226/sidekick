import { randomBytes } from 'node:crypto'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

interface SharePayload {
  sessionId: string
  quote?: string
}

const createToken = () => randomBytes(12).toString('base64url')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const body = await readBody<SharePayload>(event)
  if (!body?.sessionId) {
    throw createError({ statusCode: 400, message: '세션 정보가 필요합니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const userId = user.sub

  const { data: session, error: sessionError } = await client
    .from('reading_sessions')
    .select('id, user_id, share_token')
    .eq('id', body.sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (sessionError) throw sessionError
  if (!session) {
    throw createError({ statusCode: 404, message: '공유할 독서 세션을 찾을 수 없습니다.' })
  }

  const shareToken = session.share_token || createToken()
  const quote = String(body.quote || '').trim().slice(0, 220)

  const { data: sharedSession, error: updateError } = await client
    .from('reading_sessions')
    .update({
      share_token: shareToken,
      shared_at: new Date().toISOString(),
      share_quote: quote || null
    })
    .eq('id', session.id)
    .eq('user_id', userId)
    .select('id, share_token, shared_at')
    .single()

  if (updateError) throw updateError

  return {
    sessionId: sharedSession.id,
    token: sharedSession.share_token,
    url: `/share/session/${sharedSession.share_token}`
  }
})
