-- Adds v2 reading goals and recommendation feedback.

create table if not exists public.reading_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  target_minutes integer not null default 25 check (target_minutes between 1 and 600),
  target_pages integer not null default 0 check (target_pages >= 0),
  target_progress integer check (target_progress between 0 and 100),
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_book_id)
);

create table if not exists public.recommendation_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  isbn text not null,
  feedback text not null check (feedback in ('want_to_read', 'not_interested')),
  source text not null default 'v2',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, isbn)
);

create index if not exists idx_reading_goals_user_id on public.reading_goals(user_id);
create index if not exists idx_reading_goals_group_book_id on public.reading_goals(group_book_id);
create index if not exists idx_recommendation_feedback_user_id on public.recommendation_feedback(user_id);
create index if not exists idx_recommendation_feedback_isbn on public.recommendation_feedback(isbn);

alter table public.reading_goals enable row level security;
alter table public.recommendation_feedback enable row level security;

drop policy if exists "Users can manage their own reading goals" on public.reading_goals;
create policy "Users can manage their own reading goals"
  on public.reading_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own recommendation feedback" on public.recommendation_feedback;
create policy "Users can manage their own recommendation feedback"
  on public.recommendation_feedback for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists update_reading_goals_updated_at on public.reading_goals;
create trigger update_reading_goals_updated_at
  before update on public.reading_goals
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_recommendation_feedback_updated_at on public.recommendation_feedback;
create trigger update_recommendation_feedback_updated_at
  before update on public.recommendation_feedback
  for each row
  execute function update_updated_at_column();
