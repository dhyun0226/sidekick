-- Fix 1: can_add_book_to_group function was missing membership check
-- This caused RLS policy violation when adding books to solo groups
--
-- Fix 2: Solo groups don't need invite codes
-- Remove not null constraint and auto-generate only for social groups
--
-- Fix 3: generate_invite_code should check for duplicates

-- =============================================
-- Fix 3: Add duplicate check to generate_invite_code
-- =============================================

create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
  v_attempts integer := 0;
begin
  loop
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    select exists(select 1 from public.groups where invite_code = v_code) into v_exists;

    if not v_exists then
      return v_code;
    end if;

    v_attempts := v_attempts + 1;
    if v_attempts > 100 then
      raise exception 'Failed to generate unique invite code after 100 attempts';
    end if;
  end loop;
end;
$$;

-- =============================================
-- Fix 1: Add membership check to can_add_book_to_group
-- =============================================

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
  v_max_books integer;
  v_current_count integer;
begin
  -- Check membership first (must be active member)
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

  -- Get user tier
  select subscription_tier into v_tier from public.users where id = p_user_id;

  -- Solo groups: members can add books (no tier restriction)
  if v_group_type = 'solo' then
    return true;
  end if;

  -- Social groups: only premium can add books
  if v_tier not in ('premium', 'admin') then
    return false;
  end if;

  -- Check book limit
  select max_books_per_group into v_max_books
  from public.subscription_limits where tier = v_tier;

  -- -1 means unlimited
  if v_max_books = -1 then
    return true;
  end if;

  -- Count current books
  select count(*) into v_current_count
  from public.group_books where group_id = p_group_id;

  return v_current_count < v_max_books;
end;
$$;

-- =============================================
-- Fix 2: Solo groups don't need invite codes
-- =============================================

-- Make invite_code nullable
alter table public.groups alter column invite_code drop not null;
alter table public.groups alter column invite_code drop default;

-- Create trigger function to auto-generate invite code only for social groups
create or replace function auto_generate_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.group_type = 'social' and new.invite_code is null then
    new.invite_code := generate_invite_code();
  end if;
  return new;
end;
$$;

-- Create trigger (drop first if exists)
drop trigger if exists trigger_auto_invite_code on public.groups;
create trigger trigger_auto_invite_code
  before insert on public.groups
  for each row execute function auto_generate_invite_code();

-- Clear invite codes from existing solo groups
update public.groups set invite_code = null where group_type = 'solo';

-- =============================================
-- Fix 4: Add DELETE policy for group_books
-- =============================================

-- Allow admins to delete books in social groups, and members to delete in solo groups
create policy "Admins can delete group books"
  on public.group_books for delete
  using (
    exists (
      select 1 from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = group_books.group_id
      and gm.user_id = auth.uid()
      and gm.left_at is null
      and (
        gm.role = 'admin'  -- Social 그룹: admin만 삭제 가능
        or g.group_type = 'solo'  -- Solo 그룹: 멤버(본인)가 삭제 가능
      )
    )
  );
