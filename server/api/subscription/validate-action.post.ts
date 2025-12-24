/**
 * 사용자 액션 권한 검증 API
 *
 * POST /api/subscription/validate-action
 * Body: { action: 'create_group' | 'add_book' | 'access_statistics', groupId?: string }
 *
 * Returns:
 * - allowed: boolean - 액션 허용 여부
 * - reason: string - 불허 시 이유
 */

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get session to extract user
  const { data: { session }, error: sessionError } = await client.auth.getSession()

  if (sessionError || !session || !session.user) {
    throw createError({
      statusCode: 401,
      message: '인증이 필요합니다.'
    })
  }

  const user = session.user
  const body = await readBody(event)
  const { action, groupId } = body

  if (!action) {
    throw createError({
      statusCode: 400,
      message: 'action 파라미터가 필요합니다.'
    })
  }

  try {
    let canPerform = false
    let reason = ''

    switch (action) {
      case 'create_group': {
        // Check if user can create another group
        const { data: canCreate, error } = await client
          .rpc('can_create_group', { p_user_id: user.id })

        if (error) throw error

        canPerform = canCreate

        if (!canPerform) {
          // Get current usage to show in error message
          const { data: usage } = await client
            .rpc('get_user_subscription_usage', { p_user_id: user.id })
            .single()

          if (usage) {
            reason = `무료 플랜은 최대 ${usage.max_groups}개 그룹만 생성 가능합니다. 현재 ${usage.groups_created}개 생성됨.`
          } else {
            reason = '그룹 생성 제한에 도달했습니다.'
          }
        }
        break
      }

      case 'add_book': {
        if (!groupId) {
          throw createError({
            statusCode: 400,
            message: 'add_book 액션은 groupId가 필요합니다.'
          })
        }

        // Check if user can add another book to this group
        const { data: canAdd, error } = await client
          .rpc('can_add_book_to_group', {
            p_user_id: user.id,
            p_group_id: groupId
          })

        if (error) throw error

        canPerform = canAdd

        if (!canPerform) {
          // Get user tier to show appropriate message
          const { data: userData } = await client
            .from('users')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

          if (userData && userData.subscription_tier === 'free') {
            reason = '무료 플랜은 그룹당 최대 10권까지 추가 가능합니다.'
          } else {
            reason = '책 추가 제한에 도달했습니다.'
          }
        }
        break
      }

      case 'access_statistics': {
        // Get user's tier and check statistics access
        const { data: userData, error: userError } = await client
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()

        if (userError) throw userError

        const { data: limits, error: limitsError } = await client
          .from('subscription_limits')
          .select('has_statistics_access')
          .eq('tier', userData.subscription_tier)
          .single()

        if (limitsError) throw limitsError

        canPerform = limits.has_statistics_access

        if (!canPerform) {
          reason = '통계 기능은 프리미엄 구독자만 이용 가능합니다.'
        }
        break
      }

      default:
        throw createError({
          statusCode: 400,
          message: `알 수 없는 액션: ${action}`
        })
    }

    return {
      allowed: canPerform,
      reason
    }
  } catch (error: any) {
    console.error('[Subscription] Validate action error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '권한 검증에 실패했습니다.'
    })
  }
})
