-- =============================================
-- Add Solo/Social Group System (Data Preserving)
-- 2026-01-28: Admin=방장, 유예 제거, Solo/Social 구분
-- =============================================

-- =============================================
-- 1. ADD NEW COLUMNS TO EXISTING TABLES
-- =============================================

-- 1.1 Add group_type and status to groups table
alter table public.groups
  add column if not exists group_type text
    check (group_type in ('solo', 'social'))
    default 'social' not null;

alter table public.groups
  add column if not exists status text
    check (status in ('active', 'paused', 'archived'))
    default 'active' not null;

-- 1.2 Create indexes for new columns
create index if not exists idx_groups_type on public.groups(group_type);
create index if not exists idx_groups_status on public.groups(status);

-- =============================================
-- 2. MIGRATE EXISTING DATA
-- =============================================

-- 2.1 Set all existing groups to 'social' and 'active'
update public.groups
set
  group_type = 'social',
  status = case
    when deleted_at is not null then 'archived'
    else 'active'
  end
where group_type is null or status is null;

-- 2.2 Create Solo group for each existing user (if they don't have one)
do $$
declare
  user_record record;
  solo_group_id uuid;
  user_nickname text;
begin
  for user_record in
    select id, nickname from public.users
  loop
    -- Check if user already has a solo group
    if not exists (
      select 1 from public.groups g
      join public.group_members gm on gm.group_id = g.id
      where gm.user_id = user_record.id
        and g.group_type = 'solo'
        and gm.left_at is null
    ) then
      -- Create solo group for this user
      user_nickname := coalesce(user_record.nickname, '내');

      insert into public.groups (name, group_type, status, created_by)
      values (user_nickname || '의 서재', 'solo', 'active', user_record.id)
      returning id into solo_group_id;

      -- Add user as admin
      insert into public.group_members (group_id, user_id, role)
      values (solo_group_id, user_record.id, 'admin');

      raise notice 'Created solo group for user %', user_record.id;
    end if;
  end loop;
end $$;

-- =============================================
-- 3. UPDATE FUNCTIONS
-- =============================================

-- 3.1 Update handle_new_user to create Solo group
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_group_id uuid;
  user_nickname text;
begin
  -- 1. Create user profile (if not exists)
  insert into public.users (id, nickname, avatar_url, subscription_tier)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'free'
  )
  on conflict (id) do nothing;

  -- 2. Get user nickname
  select nickname into user_nickname from public.users where id = new.id;

  -- 3. Create Solo group
  insert into public.groups (name, group_type, status, created_by)
  values (
    coalesce(user_nickname, '내') || '의 서재',
    'solo',
    'active',
    new.id
  )
  returning id into new_group_id;

  -- 4. Add user as admin to Solo group
  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, new.id, 'admin');

  -- 5. Create notification settings (if not exists)
  insert into public.users (id, notification_settings)
  values (new.id, jsonb_build_object(
    'comment_reply', true,
    'reaction', true,
    'member_join', true,
    'completion', true,
    'book_added', true,
    'group_archived', true
  ))
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3.2 Update can_create_group function
create or replace function public.can_create_group(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_max_groups integer;
  v_current_count integer;
begin
  -- Get user tier
  select subscription_tier into v_tier
  from public.users
  where id = p_user_id;

  -- Get limit
  select max_groups_created into v_max_groups
  from public.subscription_limits
  where tier = v_tier;

  -- -1 means unlimited
  if v_max_groups = -1 then
    return true;
  end if;

  -- Count current SOCIAL groups where user is admin
  select count(*) into v_current_count
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = p_user_id
    and gm.role = 'admin'
    and g.group_type = 'social'
    and g.deleted_at is null
    and gm.left_at is null;

  return v_current_count < v_max_groups;
end;
$$;

-- 3.3 Update can_join_group function
create or replace function public.can_join_group(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_max_groups integer;
  v_current_count integer;
begin
  -- Get user tier
  select subscription_tier into v_tier
  from public.users
  where id = p_user_id;

  -- Premium and admin can join unlimited groups
  if v_tier in ('premium', 'admin') then
    return true;
  end if;

  -- Get limit for free tier
  select max_groups_created into v_max_groups
  from public.subscription_limits
  where tier = 'free';

  -- Count current active groups (including solo)
  select count(*) into v_current_count
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = p_user_id
    and gm.left_at is null
    and g.deleted_at is null
    and g.status in ('active', 'paused');

  return v_current_count < v_max_groups;
end;
$$;

-- 3.4 Update can_add_book_to_group function
create or replace function public.can_add_book_to_group(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_group_type text;
  v_group_status text;
  v_max_books integer;
  v_current_count integer;
begin
  -- Get group info
  select group_type, status into v_group_type, v_group_status
  from public.groups
  where id = p_group_id;

  -- Group must be active
  if v_group_status != 'active' then
    return false;
  end if;

  -- Get user tier
  select subscription_tier into v_tier
  from public.users
  where id = p_user_id;

  -- Solo groups: anyone (admin) can add books
  if v_group_type = 'solo' then
    return true;
  end if;

  -- Social groups: only premium can add books
  if v_tier not in ('premium', 'admin') then
    return false;
  end if;

  -- Check book limit
  select max_books_per_group into v_max_books
  from public.subscription_limits
  where tier = v_tier;

  -- -1 means unlimited
  if v_max_books = -1 then
    return true;
  end if;

  -- Count current books in group
  select count(*) into v_current_count
  from public.group_books
  where group_id = p_group_id;

  return v_current_count < v_max_books;
end;
$$;

-- 3.5 Add function to check if user can perform social actions (comments, reactions)
create or replace function public.can_perform_social_action(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_group_type text;
  v_group_status text;
begin
  -- Get group info
  select group_type, status into v_group_type, v_group_status
  from public.groups
  where id = p_group_id;

  -- Group must be active
  if v_group_status != 'active' then
    return false;
  end if;

  -- Solo groups: always allowed
  if v_group_type = 'solo' then
    return true;
  end if;

  -- Social groups: only premium
  select subscription_tier into v_tier
  from public.users
  where id = p_user_id;

  return v_tier in ('premium', 'admin');
end;
$$;

-- =============================================
-- 4. UPDATE RLS POLICIES
-- =============================================

-- 4.1 Drop old policies
drop policy if exists "Authenticated users can create groups" on public.groups;
drop policy if exists "Members can update groups." on public.groups;
drop policy if exists "Admins can delete groups." on public.groups;

-- 4.2 Create new policies (role-based)

-- Only premium users can create social groups (solo created by trigger)
create policy "Premium users can create social groups"
  on public.groups for insert
  with check (
    auth.role() = 'authenticated'
    and (
      group_type = 'solo' -- Solo groups created by trigger only
      or exists (
        select 1 from public.users
        where id = auth.uid()
        and subscription_tier in ('premium', 'admin')
      )
    )
  );

-- Admins (role='admin') can update groups
create policy "Group admins can update groups"
  on public.groups for update
  using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id
      and user_id = auth.uid()
      and role = 'admin'
      and left_at is null
    )
  );

-- Admins can archive groups (soft delete via deleted_at or status='archived')
create policy "Group admins can archive groups"
  on public.groups for update
  using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id
      and user_id = auth.uid()
      and role = 'admin'
      and left_at is null
    )
  );

-- 4.3 Update group_books policies
drop policy if exists "Members can add books in active groups" on public.group_books;

create policy "Members can add books in active groups"
  on public.group_books for insert
  with check (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.groups g
      where g.id = group_id
      and g.status = 'active'
      and can_add_book_to_group(auth.uid(), g.id)
    )
  );

-- 4.4 Update comments policies (social actions require premium in social groups)
drop policy if exists "Members can add comments in active groups" on public.comments;

create policy "Members can add comments in active groups"
  on public.comments for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
    and exists (
      select 1 from public.group_books gb
      join public.groups g on g.id = gb.group_id
      join public.group_members gm on gm.group_id = g.id
      where gb.id = group_book_id
      and gm.user_id = auth.uid()
      and gm.left_at is null
      and can_perform_social_action(auth.uid(), g.id)
    )
  );

-- 4.5 Update reactions policies
drop policy if exists "Members can add reactions in active groups" on public.reactions;

create policy "Members can add reactions in active groups"
  on public.reactions for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
    and exists (
      select 1 from public.comments c
      join public.group_books gb on gb.id = c.group_book_id
      join public.groups g on g.id = gb.group_id
      join public.group_members gm on gm.group_id = g.id
      where c.id = comment_id
      and gm.user_id = auth.uid()
      and gm.left_at is null
      and can_perform_social_action(auth.uid(), g.id)
    )
  );

-- =============================================
-- 5. ADD HELPER FUNCTIONS FOR ADMIN DOWNGRADE
-- =============================================

-- 5.1 Get premium admins in a group
create or replace function public.get_premium_admins_in_group(p_group_id uuid)
returns table (user_id uuid, nickname text)
language sql
security definer
as $$
  select gm.user_id, u.nickname
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = p_group_id
    and gm.role = 'admin'
    and gm.left_at is null
    and u.subscription_tier in ('premium', 'admin');
$$;

-- 5.2 Check if user is the last premium admin
create or replace function public.is_last_premium_admin(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_premium_admin_count integer;
  v_user_is_premium_admin boolean;
begin
  -- Count premium admins
  select count(*) into v_premium_admin_count
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = p_group_id
    and gm.role = 'admin'
    and gm.left_at is null
    and u.subscription_tier in ('premium', 'admin');

  -- Check if this user is a premium admin
  select exists (
    select 1
    from public.group_members gm
    join public.users u on u.id = gm.user_id
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.role = 'admin'
      and gm.left_at is null
      and u.subscription_tier in ('premium', 'admin')
  ) into v_user_is_premium_admin;

  return v_user_is_premium_admin and v_premium_admin_count = 1;
end;
$$;

-- =============================================
-- 6. NOTIFICATION TYPE UPDATE
-- =============================================

-- Add new notification types if not exists
do $$
begin
  -- Drop constraint if exists
  alter table public.notifications
    drop constraint if exists notifications_type_check;

  -- Add new constraint with extended types
  alter table public.notifications
    add constraint notifications_type_check
    check (type = any (array[
      'reply'::text,
      'reaction'::text,
      'mention'::text,
      'system'::text,
      'book_added'::text,
      'group'::text,
      'info'::text,
      'warning'::text,
      'urgent'::text
    ]));
end $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Summary:
-- ✅ Added group_type ('solo', 'social') to groups
-- ✅ Added status ('active', 'paused', 'archived') to groups
-- ✅ Created Solo group for all existing users
-- ✅ Updated handle_new_user() to auto-create Solo groups
-- ✅ Updated subscription check functions
-- ✅ Updated RLS policies (role-based instead of created_by)
-- ✅ Added helper functions for admin management
-- ✅ Social groups require premium for writing actions
