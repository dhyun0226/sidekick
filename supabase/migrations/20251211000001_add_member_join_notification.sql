-- =============================================
-- Add notification trigger for new member joins
-- =============================================
-- When a new member joins a group, notify the group admin(s)

create or replace function public.create_notification_on_member_join()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_id uuid;
  group_name_var text;
  new_member_nickname text;
begin
  -- Get the group name
  select name into group_name_var
  from public.groups
  where id = new.group_id;

  -- Get new member's nickname
  select nickname into new_member_nickname
  from public.users
  where id = new.user_id;

  -- Notify all admins in the group (except the person who joined)
  for admin_id in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = new.group_id
      and gm.role = 'admin'
      and gm.user_id != new.user_id  -- Don't notify if the joiner is admin
  loop
    insert into public.notifications (user_id, type, title, message, source_id, link)
    values (
      admin_id,
      'system',
      '새 멤버 가입',
      coalesce(new_member_nickname, '새 멤버') || '님이 "' || group_name_var || '" 그룹에 참여했습니다.',
      new.group_id,
      '/group/' || new.group_id
    );
  end loop;

  return new;
end;
$$;

-- Create trigger
create trigger on_member_join
  after insert on public.group_members
  for each row execute procedure public.create_notification_on_member_join();
