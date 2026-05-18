-- Expands v2 badge definitions for reading-room motivation.

insert into public.badges (code, title, description, category, sort_order)
values
  ('session-5', '다섯 번의 동행', '캐릭터와 독서 세션을 5번 기록했어요.', 'session', 70),
  ('deep-focus-3', '깊은 집중 3회', '25분 이상 집중한 세션을 3번 만들었어요.', 'session', 80),
  ('hour-reader', '한 시간 독자', '누적 독서 세션 시간이 1시간을 넘었어요.', 'habit', 90),
  ('early-reader', '아침 독서가', '오전 독서 세션을 2번 기록했어요.', 'habit', 100),
  ('night-reader', '밤 독서가', '밤 독서 세션을 2번 기록했어요.', 'habit', 110),
  ('time-traveler', '여러 시간대의 독자', '서로 다른 4개 시간대에 책을 읽었어요.', 'habit', 120),
  ('share-maker', '공유 카드 첫 장', '독서 세션 공유 카드를 처음 만들었어요.', 'share', 130)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = timezone('utc'::text, now());
