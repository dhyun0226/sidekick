/**
 * 만료된 구독 처리 Cron Job
 * 매일 실행하여 end_date가 지난 구독을 만료 처리
 *
 * Vercel Cron: vercel.json에 설정
 */

import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin 다운그레이드 시 그룹 처리
 * - 다른 프리미엄 admin이 있으면 → 본인만 member로 강등
 * - 없으면 → 그룹을 Paused로 전환
 */
async function handleAdminDowngrade(client: SupabaseClient, userId: string) {
  try {
    console.log(`[AdminDowngrade] Processing groups for user ${userId}`)

    // 1. 해당 유저가 admin인 모든 social 그룹 조회
    const { data: adminGroups, error: fetchError } = await client
      .from('group_members')
      .select('group_id, groups!inner(id, name, group_type, status)')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .is('left_at', null)
      .eq('groups.group_type', 'social')
      .eq('groups.status', 'active')

    if (fetchError) {
      console.error(`[AdminDowngrade] Error fetching admin groups:`, fetchError)
      return
    }

    if (!adminGroups || adminGroups.length === 0) {
      console.log(`[AdminDowngrade] User ${userId} has no active admin groups`)
      return
    }

    console.log(`[AdminDowngrade] Found ${adminGroups.length} admin groups for user ${userId}`)

    // 2. 각 그룹별로 처리
    for (const groupMember of adminGroups) {
      const groupId = groupMember.group_id
      const groupName = groupMember.groups.name

      // 3. 다른 프리미엄 admin이 있는지 확인
      const { data: otherPremiumAdmins, error: adminCheckError } = await client
        .from('group_members')
        .select('user_id, users!inner(subscription_tier)')
        .eq('group_id', groupId)
        .eq('role', 'admin')
        .is('left_at', null)
        .neq('user_id', userId)
        .in('users.subscription_tier', ['premium', 'admin'])

      if (adminCheckError) {
        console.error(`[AdminDowngrade] Error checking admins for group ${groupId}:`, adminCheckError)
        continue
      }

      if (otherPremiumAdmins && otherPremiumAdmins.length > 0) {
        // ✅ 다른 프리미엄 admin 있음 → 본인만 member로 강등
        console.log(`[AdminDowngrade] Group ${groupId} has ${otherPremiumAdmins.length} other premium admins, demoting user`)

        const { error: demoteError } = await client
          .from('group_members')
          .update({ role: 'member' })
          .eq('group_id', groupId)
          .eq('user_id', userId)

        if (demoteError) {
          console.error(`[AdminDowngrade] Error demoting user in group ${groupId}:`, demoteError)
        } else {
          console.log(`[AdminDowngrade] User ${userId} demoted to member in group ${groupId}`)

          // 알림 생성
          await client.from('notifications').insert({
            user_id: userId,
            type: 'info',
            title: '방장 권한 해제',
            message: `"${groupName}" 그룹의 방장 권한이 해제되었습니다. 프리미엄을 갱신하면 다시 방장이 될 수 있습니다.`,
            link: `/group/${groupId}`
          })
        }
      } else {
        // ❌ 다른 프리미엄 admin 없음 → 그룹 Paused 전환
        console.log(`[AdminDowngrade] Group ${groupId} has no other premium admins, pausing group`)

        const { error: pauseError } = await client
          .from('groups')
          .update({
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', groupId)

        if (pauseError) {
          console.error(`[AdminDowngrade] Error pausing group ${groupId}:`, pauseError)
        } else {
          console.log(`[AdminDowngrade] Group ${groupId} paused successfully`)

          // 본인 강등
          await client
            .from('group_members')
            .update({ role: 'member' })
            .eq('group_id', groupId)
            .eq('user_id', userId)

          // 모든 멤버에게 알림
          const { data: allMembers } = await client
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .is('left_at', null)

          if (allMembers && allMembers.length > 0) {
            const notifications = allMembers.map(m => ({
              user_id: m.user_id,
              type: 'warning',
              title: '그룹 일시 정지',
              message: m.user_id === userId
                ? `"${groupName}" 그룹의 방장 구독이 만료되어 그룹이 일시 정지되었습니다.`
                : `"${groupName}" 그룹의 방장 구독이 만료되어 그룹이 일시 정지되었습니다. 프리미엄 멤버가 [방장 되기]를 통해 그룹을 다시 활성화할 수 있습니다.`,
              link: `/group/${groupId}`
            }))

            await client.from('notifications').insert(notifications)
          }
        }
      }
    }

    console.log(`[AdminDowngrade] Completed processing groups for user ${userId}`)
  } catch (error) {
    console.error(`[AdminDowngrade] Unexpected error for user ${userId}:`, error)
  }
}

export default defineEventHandler(async (event) => {
  // Cron Secret으로 인증 (보안)
  const authHeader = getHeader(event, 'authorization')
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET

  // 개발 환경에서는 인증 건너뛰기
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  console.log('[Cron] Starting subscription expiration process...')

  try {
    const now = new Date().toISOString()

    // 1. 만료된 구독 조회 (end_date가 현재 시간보다 이전 + status가 active)
    const { data: expiredSubs, error: fetchError } = await serviceClient
      .from('subscriptions')
      .select('id, user_id, end_date')
      .eq('status', 'active')
      .lt('end_date', now)

    if (fetchError) throw fetchError

    console.log(`[Cron] Found ${expiredSubs?.length || 0} expired subscriptions`)

    if (!expiredSubs || expiredSubs.length === 0) {
      return {
        message: 'No subscriptions to expire',
        processed: 0
      }
    }

    // 2. 각 구독을 만료 처리
    let successCount = 0
    let failCount = 0

    for (const sub of expiredSubs) {
      try {
        console.log(`[Cron] Expiring subscription ${sub.id} for user ${sub.user_id}`)

        // 구독 상태를 expired로 변경
        const { error: updateSubError } = await serviceClient
          .from('subscriptions')
          .update({
            status: 'expired',
            auto_renew: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id)

        if (updateSubError) {
          console.error(`[Cron] Failed to expire subscription ${sub.id}:`, updateSubError)
          failCount++
          continue
        }

        // 사용자 등급을 free로 변경
        const { error: updateUserError } = await serviceClient
          .from('users')
          .update({
            subscription_tier: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.user_id)

        if (updateUserError) {
          console.error(`[Cron] Failed to downgrade user ${sub.user_id}:`, updateUserError)
          // 사용자 등급 변경 실패해도 구독은 이미 만료 처리됨
        }

        // 🎯 Admin 다운그레이드 처리: 그룹 관리
        await handleAdminDowngrade(serviceClient, sub.user_id)

        // 만료 알림 생성
        await serviceClient.from('notifications').insert({
          user_id: sub.user_id,
          type: 'system',
          title: '구독 만료',
          message: '프리미엄 구독이 만료되었습니다. 계속 이용하시려면 구독을 갱신해주세요.',
          link: '/subscription'
        })

        console.log(`[Cron] Subscription ${sub.id} expired successfully`)
        successCount++

      } catch (error: any) {
        console.error(`[Cron] Error processing subscription ${sub.id}:`, error)
        failCount++
      }
    }

    return {
      message: 'Expiration process completed',
      processed: expiredSubs.length,
      success: successCount,
      failed: failCount
    }

  } catch (error: any) {
    console.error('[Cron] Error:', error)
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
