import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const allowedCompanions = new Set(['pipi', 'momo', 'rumi', 'toto', 'nori'])

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const body = await readBody<{ companionCode?: string; wallpaperCode?: string }>(event)
  const companionCode = body?.companionCode || 'pipi'
  if (!allowedCompanions.has(companionCode)) {
    throw createError({ statusCode: 400, message: '지원하지 않는 캐릭터입니다.' })
  }

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('user_companion_settings')
    .upsert({
      user_id: user.sub,
      active_companion_code: companionCode,
      active_wallpaper_code: body?.wallpaperCode || 'morning-desk',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: '캐릭터 설정 저장에 실패했습니다.' })
  }

  return { settings: data }
})
