-- Sidekick v2 persisted badges
-- Stores badge definitions and per-user awarded badges.

create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  title text not null,
  description text not null,
  category text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  source_type text,
  source_id uuid,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

create index if not exists idx_badges_code on public.badges(code);
create index if not exists idx_badges_sort_order on public.badges(sort_order);
create index if not exists idx_user_badges_user_id on public.user_badges(user_id);
create index if not exists idx_user_badges_badge_id on public.user_badges(badge_id);
create index if not exists idx_user_badges_earned_at on public.user_badges(earned_at desc);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Anyone can view active badges" on public.badges;
create policy "Anyone can view active badges"
  on public.badges for select
  using (is_active = true);

drop policy if exists "Users can view their own badges" on public.user_badges;
create policy "Users can view their own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

drop trigger if exists update_badges_updated_at on public.badges;
create trigger update_badges_updated_at
  before update on public.badges
  for each row
  execute function update_updated_at_column();

insert into public.badges (code, title, description, category, sort_order)
values
  ('first-session', '첫 동행', '캐릭터와 첫 독서 세션을 마쳤어요.', 'session', 10),
  ('focus-30', '30분 집중', '한 번에 30분 이상 책에 머물렀어요.', 'session', 20),
  ('note-keeper', '문장 수집가', '메모와 인용구를 5개 이상 남겼어요.', 'notes', 30),
  ('steady-reader', '꾸준한 독자', '서로 다른 3일에 독서 세션을 기록했어요.', 'habit', 40),
  ('companion-bond', '친밀도 3', '한 캐릭터와 충분히 오래 읽었어요.', 'companion', 50),
  ('finisher', '완독자', '완독한 책이 생겼어요.', 'completion', 60)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = timezone('utc'::text, now());
