/**
 * 방장 되기 API
 * Paused 상태의 그룹을 Active로 전환하고 본인을 admin으로 설정
 */

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { groupId } = body

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required'
    })
  }

  try {
    // 1. 그룹 정보 조회
    const { data: group, error: groupError } = await client
      .from('groups')
      .select('id, name, status, group_type')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      throw createError({
        statusCode: 404,
        message: 'Group not found'
      })
    }

    // 2. Solo 그룹은 방장 되기 불가
    if (group.group_type === 'solo') {
      throw createError({
        statusCode: 400,
        message: 'Cannot become owner of solo group'
      })
    }

    // 3. Paused 상태가 아니면 불가
    if (group.status !== 'paused') {
      throw createError({
        statusCode: 400,
        message: 'Group is not paused'
      })
    }

    // 4. 유저가 그룹 멤버인지 확인
    const { data: membership, error: memberError } = await client
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .maybeSingle()

    if (memberError || !membership) {
      throw createError({
        statusCode: 403,
        message: 'You are not a member of this group'
      })
    }

    // 5. 유저가 프리미엄인지 확인
    const { data: userData, error: userError } = await client
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch user data'
      })
    }

    if (!['premium', 'admin'].includes(userData.subscription_tier)) {
      throw createError({
        statusCode: 403,
        message: 'Only premium users can become group owner'
      })
    }

    // 6. 그룹을 Active로 전환
    const { error: updateGroupError } = await client
      .from('groups')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)

    if (updateGroupError) {
      throw createError({
        statusCode: 500,
        message: 'Failed to activate group'
      })
    }

    // 7. 본인을 admin으로 설정
    const { error: updateMemberError } = await client
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (updateMemberError) {
      throw createError({
        statusCode: 500,
        message: 'Failed to update member role'
      })
    }

    // 8. 모든 멤버에게 알림
    const { data: allMembers } = await client
      .from('group_members')
      .select('user_id, users!inner(nickname)')
      .eq('group_id', groupId)
      .is('left_at', null)

    if (allMembers && allMembers.length > 0) {
      const newOwnerNickname = allMembers.find(m => m.user_id === user.id)?.users?.nickname || '새 방장'

      const notifications = allMembers.map(m => ({
        user_id: m.user_id,
        type: 'info',
        title: '그룹 활성화',
        message: m.user_id === user.id
          ? `"${group.name}" 그룹의 새 방장이 되었습니다!`
          : `${newOwnerNickname}님이 새 방장이 되어 "${group.name}" 그룹이 다시 활성화되었습니다!`,
        link: `/group/${groupId}`
      }))

      await client.from('notifications').insert(notifications)
    }

    return {
      success: true,
      message: 'Successfully became group owner',
      groupId,
      groupName: group.name
    }

  } catch (error: any) {
    console.error('[BecomeOwner] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to become group owner'
    })
  }
})
