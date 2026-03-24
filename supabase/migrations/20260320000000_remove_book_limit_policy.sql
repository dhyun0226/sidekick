-- ============================================
-- 정책 변경: 10권 제한 제거
-- - 내 서재(solo): 무료/프리미엄 모두 책 무제한 추가
-- - 소셜 그룹: 프리미엄만 책 추가 가능 (무료는 읽기전용)
-- ============================================

-- 1. subscription_limits 테이블에서 free 티어 max_books_per_group을 -1(무제한)로 변경
update public.subscription_limits
set max_books_per_group = -1, updated_at = now()
where tier = 'free';

-- 2. can_add_book_to_group RPC 단순화 (book count 체크 제거)
create or replace function public.can_add_book_to_group(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_group_type text;
  v_group_status text;
  v_is_member boolean;
begin
  -- Check membership (must be active member)
  select exists(
    select 1 from public.group_members
    where user_id = p_user_id
    and group_id = p_group_id
    and left_at is null
  ) into v_is_member;

  if not v_is_member then
    return false;
  end if;

  -- Get group info
  select group_type, status into v_group_type, v_group_status
  from public.groups where id = p_group_id;

  -- Group must be active
  if v_group_status != 'active' then
    return false;
  end if;

  -- Solo groups: all members can add books (no limit)
  if v_group_type = 'solo' then
    return true;
  end if;

  -- Social groups: only premium/admin can add books
  select subscription_tier into v_tier from public.users where id = p_user_id;
  return v_tier in ('premium', 'admin');
end;
$$;
