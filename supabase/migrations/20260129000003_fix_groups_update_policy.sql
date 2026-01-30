-- =============================================
-- Fix groups policies for soft delete
-- =============================================

-- 1. Drop existing policies
drop policy if exists "Group admins can update groups" on public.groups;
drop policy if exists "Everyone can view active groups" on public.groups;

-- 2. SELECT: 활성 그룹 + 본인이 멤버인 그룹 (종료된 그룹 포함)
create policy "Users can view their groups"
  on public.groups for select
  using (
    deleted_at is null
    or exists (
      select 1 from public.group_members
      where group_id = groups.id
      and user_id = auth.uid()
    )
  );

-- 3. UPDATE: 그룹 admin만 (with check true로 어떤 값이든 허용)
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
  )
  with check (true);
