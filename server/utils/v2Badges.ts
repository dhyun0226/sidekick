export type V2Badge = {
  code: string
  title: string
  description: string
  category: string
  sort_order: number
  earned: boolean
  earnedAt: string | null
}

type BadgeRuleContext = {
  sessions: any[]
  companionStats: any[]
  finishedCount: number
  sharedCount: number
}

const toLocalDay = (value: string) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const computeStats = (sessions: any[]) => {
  const daySet = new Set(sessions.map((item: any) => toLocalDay(item.started_at)))
  const noteCount = sessions.reduce((sum: number, item: any) => sum + (item.memo_count || 0) + (item.quote_count || 0), 0)
  const hourSet = new Set(sessions.map((item: any) => new Date(item.started_at).getHours()))
  const earlyCount = sessions.filter((item: any) => new Date(item.started_at).getHours() < 9).length
  const nightCount = sessions.filter((item: any) => new Date(item.started_at).getHours() >= 21).length
  const totalSeconds = sessions.reduce((sum: number, item: any) => sum + Number(item.duration_seconds || 0), 0)
  const longSessionCount = sessions.filter((item: any) => Number(item.duration_seconds || 0) >= 1500).length
  return { daySet, noteCount, hourSet, earlyCount, nightCount, totalSeconds, longSessionCount }
}

export const evaluateBadgeRules = ({ sessions, companionStats, finishedCount, sharedCount }: BadgeRuleContext) => {
  const { daySet, noteCount, hourSet, earlyCount, nightCount, totalSeconds, longSessionCount } = computeStats(sessions)

  return new Map<string, boolean>([
    ['first-session', sessions.length > 0],
    ['focus-30', sessions.some((item: any) => (item.duration_seconds || 0) >= 1800)],
    ['note-keeper', noteCount >= 5],
    ['steady-reader', daySet.size >= 3],
    ['companion-bond', companionStats.some((item: any) => (item.affinity_level || 1) >= 3)],
    ['finisher', finishedCount > 0],
    ['session-5', sessions.length >= 5],
    ['deep-focus-3', longSessionCount >= 3],
    ['hour-reader', totalSeconds >= 3600],
    ['early-reader', earlyCount >= 2],
    ['night-reader', nightCount >= 2],
    ['time-traveler', hourSet.size >= 4],
    ['share-maker', sharedCount > 0]
  ])
}

export const fetchBadgeContext = async (client: any, userId: string) => {
  const { data: memberships } = await client
    .from('group_members')
    .select('group_id, groups(id, deleted_at)')
    .eq('user_id', userId)
    .is('left_at', null)

  const activeGroupIds = (memberships || [])
    .filter((item: any) => item.groups && !item.groups.deleted_at)
    .map((item: any) => item.group_id)

  const [sessionsRes, statsRes, finishedRes] = await Promise.all([
    client
      .from('reading_sessions')
      .select('id, duration_seconds, memo_count, quote_count, started_at, shared_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(500),
    client
      .from('user_companion_stats')
      .select('companion_code, affinity_level')
      .eq('user_id', userId),
    activeGroupIds.length > 0
      ? client
        .from('group_books')
        .select('id')
        .in('group_id', activeGroupIds)
        .eq('status', 'done')
      : Promise.resolve({ data: [], error: null })
  ])

  if (sessionsRes.error) throw sessionsRes.error
  if (statsRes.error) throw statsRes.error
  if (finishedRes.error) throw finishedRes.error

  return {
    sessions: sessionsRes.data || [],
    companionStats: statsRes.data || [],
    finishedCount: finishedRes.data?.length || 0,
    sharedCount: (sessionsRes.data || []).filter((item: any) => item.shared_at).length
  }
}

export const listUserBadges = async (client: any, userId: string): Promise<V2Badge[]> => {
  const [badgesRes, userBadgesRes, context] = await Promise.all([
    client
      .from('badges')
      .select('id, code, title, description, category, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    client
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', userId),
    fetchBadgeContext(client, userId)
  ])

  if (badgesRes.error) throw badgesRes.error
  if (userBadgesRes.error) throw userBadgesRes.error

  const awarded = new Map((userBadgesRes.data || []).map((item: any) => [item.badge_id, item.earned_at]))
  const ruleResults = evaluateBadgeRules(context)

  return (badgesRes.data || []).map((badge: any) => ({
    code: badge.code,
    title: badge.title,
    description: badge.description,
    category: badge.category,
    sort_order: badge.sort_order,
    earned: Boolean(awarded.has(badge.id) || ruleResults.get(badge.code)),
    earnedAt: awarded.get(badge.id) || null
  }))
}

export const awardUserBadges = async (client: any, userId: string, source?: { type: string; id?: string }) => {
  const [badgesRes, userBadgesRes, context] = await Promise.all([
    client
      .from('badges')
      .select('id, code, title, description, category, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    client
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId),
    fetchBadgeContext(client, userId)
  ])

  if (badgesRes.error) throw badgesRes.error
  if (userBadgesRes.error) throw userBadgesRes.error

  const existingBadgeIds = new Set((userBadgesRes.data || []).map((item: any) => item.badge_id))
  const ruleResults = evaluateBadgeRules(context)
  const newlyEarnable = (badgesRes.data || [])
    .filter((badge: any) => ruleResults.get(badge.code) && !existingBadgeIds.has(badge.id))

  if (newlyEarnable.length === 0) return []

  const { data, error } = await client
    .from('user_badges')
    .insert(newlyEarnable.map((badge: any) => ({
      user_id: userId,
      badge_id: badge.id,
      source_type: source?.type || null,
      source_id: source?.id || null
    })))
    .select('earned_at, badge:badges(code, title, description, category, sort_order)')

  if (error) throw error

  return (data || []).map((item: any) => ({
    code: item.badge?.code,
    title: item.badge?.title,
    description: item.badge?.description,
    category: item.badge?.category,
    sort_order: item.badge?.sort_order,
    earned: true,
    earnedAt: item.earned_at
  }))
}
