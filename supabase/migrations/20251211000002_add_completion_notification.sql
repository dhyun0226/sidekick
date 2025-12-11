-- =============================================
-- Add notification trigger for book completion
-- =============================================
-- When a member completes a book (100%), notify other group members

create or replace function public.create_notification_on_completion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  member_id uuid;
  completer_nickname text;
  book_title_var text;
  group_id_var uuid;
begin
  -- Only proceed if finished (100% and finished_at is set)
  if new.progress_pct = 100 and new.finished_at is not null and
     (old.progress_pct < 100 or old.finished_at is null) then

    -- Get completer's nickname
    select nickname into completer_nickname
    from public.users
    where id = new.user_id;

    -- Get book title and group_id
    select gb.group_id, b.title into group_id_var, book_title_var
    from public.group_books gb
    join public.books b on gb.isbn = b.isbn
    where gb.id = new.group_book_id;

    -- Notify all group members (except the person who completed)
    for member_id in
      select gm.user_id
      from public.group_members gm
      where gm.group_id = group_id_var
        and gm.user_id != new.user_id
    loop
      insert into public.notifications (user_id, type, title, message, source_id, link)
      values (
        member_id,
        'system',
        '완독 축하',
        coalesce(completer_nickname, '멤버') || '님이 "' || book_title_var || '"을(를) 완독했습니다! 🎉',
        new.group_book_id,
        '/group/' || group_id_var
      );
    end loop;
  end if;

  return new;
end;
$$;

-- Create trigger
create trigger on_book_completion
  after update on public.user_reading_progress
  for each row execute procedure public.create_notification_on_completion();
