-- Sidekick v2 reading companion foundation
-- Adds timed reading sessions and companion preferences.

create table if not exists public.reading_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade,
  mode text check (mode in ('solo', 'group')) not null default 'solo',
  companion_code text not null default 'pipi',
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  start_progress integer check (start_progress >= 0 and start_progress <= 100),
  end_progress integer check (end_progress >= 0 and end_progress <= 100),
  pages_read integer not null default 0 check (pages_read >= 0),
  memo_count integer not null default 0 check (memo_count >= 0),
  quote_count integer not null default 0 check (quote_count >= 0),
  focus_rating integer check (focus_rating between 1 and 5),
  mood text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_reading_sessions_user_id on public.reading_sessions(user_id);
create index if not exists idx_reading_sessions_group_book_id on public.reading_sessions(group_book_id);
create index if not exists idx_reading_sessions_started_at on public.reading_sessions(started_at desc);
create index if not exists idx_reading_sessions_user_started_at on public.reading_sessions(user_id, started_at desc);

create table if not exists public.user_companion_settings (
  user_id uuid references public.users(id) on delete cascade primary key,
  active_companion_code text not null default 'pipi',
  active_wallpaper_code text not null default 'morning-desk',
  reaction_intensity text not null default 'normal',
  sound_enabled boolean not null default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_companion_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  companion_code text not null,
  total_duration_seconds integer not null default 0 check (total_duration_seconds >= 0),
  session_count integer not null default 0 check (session_count >= 0),
  note_count integer not null default 0 check (note_count >= 0),
  completed_books_count integer not null default 0 check (completed_books_count >= 0),
  affinity_level integer not null default 1 check (affinity_level >= 1),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, companion_code)
);

create index if not exists idx_user_companion_stats_user_id on public.user_companion_stats(user_id);

alter table public.reading_sessions enable row level security;
alter table public.user_companion_settings enable row level security;
alter table public.user_companion_stats enable row level security;

drop policy if exists "Users can view their own reading sessions" on public.reading_sessions;
create policy "Users can view their own reading sessions"
  on public.reading_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own reading sessions" on public.reading_sessions;
create policy "Users can insert their own reading sessions"
  on public.reading_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their companion settings" on public.user_companion_settings;
create policy "Users can view their companion settings"
  on public.user_companion_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert their companion settings" on public.user_companion_settings;
create policy "Users can upsert their companion settings"
  on public.user_companion_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their companion stats" on public.user_companion_stats;
create policy "Users can view their companion stats"
  on public.user_companion_stats for select
  using (auth.uid() = user_id);

drop trigger if exists update_reading_sessions_updated_at on public.reading_sessions;
create trigger update_reading_sessions_updated_at
  before update on public.reading_sessions
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_user_companion_settings_updated_at on public.user_companion_settings;
create trigger update_user_companion_settings_updated_at
  before update on public.user_companion_settings
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_user_companion_stats_updated_at on public.user_companion_stats;
create trigger update_user_companion_stats_updated_at
  before update on public.user_companion_stats
  for each row
  execute function update_updated_at_column();
