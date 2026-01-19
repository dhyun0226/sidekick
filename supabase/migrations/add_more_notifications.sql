-- 1. 새 책 추가 시 알림 생성 함수
CREATE OR REPLACE FUNCTION public.create_notification_on_book_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
declare
  member_id uuid;
  group_name_var text;
  book_title_var text;
  adder_nickname text;
begin
  -- 그룹 이름 가져오기
  select name into group_name_var from public.groups where id = new.group_id;
  
  -- 책 제목 가져오기
  select title into book_title_var from public.books where isbn = new.isbn;

  -- 모든 그룹 멤버에게 알림 (추가한 사람 제외)
  for member_id in
    select user_id from public.group_members 
    where group_id = new.group_id and left_at is null
  loop
    -- 자기에겐 알림 안 보냄 (auth.uid()는 트리거에서 null일 수 있으므로 로직상 체크)
    -- 여기서는 단순히 모든 멤버에게 발송하는 시스템 알림으로 처리
    insert into public.notifications (user_id, type, title, message, source_id, link)
    values (
      member_id,
      'book_added',
      '새로운 책이 추가되었습니다',
      '"' || group_name_var || '" 그룹에 새로운 책 "' || book_title_var || '"이(가) 등록되었습니다. 함께 읽으러 가볼까요?',
      new.id,
      '/group/' || new.group_id || '?bookId=' || new.id
    );
  end loop;

  return new;
end;
$$;

-- 새 책 추가 트리거
DROP TRIGGER IF EXISTS on_book_added ON public.group_books;
CREATE TRIGGER on_book_added
  AFTER INSERT ON public.group_books
  FOR EACH ROW EXECUTE PROCEDURE public.create_notification_on_book_added();


-- 2. 그룹 종료 시 알림 생성 함수
CREATE OR REPLACE FUNCTION public.create_notification_on_group_archived()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
declare
  member_id uuid;
begin
  -- deleted_at이 null에서 값으로 바뀐 경우 (즉, 종료된 경우)
  if (old.deleted_at is null and new.deleted_at is not null) then
    for member_id in
      select user_id from public.group_members 
      where group_id = new.id and left_at is null
    loop
      insert into public.notifications (user_id, type, title, message, source_id, link)
      values (
        member_id,
        'system',
        '그룹 활동이 종료되었습니다',
        '"' || new.name || '" 그룹의 활동이 종료되어 보관함(지난 그룹)으로 이동되었습니다. 그동안 고생 많으셨습니다!',
        new.id,
        '/group/' || new.id
      );
    end loop;
  end if;

  return new;
end;
$$;

-- 그룹 종료 트리거
DROP TRIGGER IF EXISTS on_group_archived ON public.groups;
CREATE TRIGGER on_group_archived
  AFTER UPDATE OF deleted_at ON public.groups
  FOR EACH ROW EXECUTE PROCEDURE public.create_notification_on_group_archived();

-- 3. 기존 유저들에게 새 알림 설정 기본값 추가
UPDATE public.users 
SET notification_settings = notification_settings || jsonb_build_object('group_archived', true)
WHERE notification_settings->>'group_archived' IS NULL;

-- 4. 신규 가입자를 위한 테이블 기본값 업데이트
ALTER TABLE public.users 
ALTER COLUMN notification_settings SET DEFAULT jsonb_build_object(
  'comment_reply', true,
  'reaction', true,
  'member_join', true,
  'completion', true,
  'book_added', true,
  'group_archived', true
);
