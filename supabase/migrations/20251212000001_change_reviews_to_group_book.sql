-- =============================================
-- Change reviews table from book-based to group_book-based
-- =============================================
-- This allows users to write different reviews for the same book
-- in different groups, preserving group reading history

-- Drop existing policies
drop policy if exists "Reviews viewable by everyone." on public.reviews;
drop policy if exists "Authenticated users can review." on public.reviews;
drop policy if exists "Users can update own reviews." on public.reviews;
drop policy if exists "Users can delete own reviews." on public.reviews;

-- Drop the old table and recreate with new structure
drop table if exists public.reviews cascade;

-- Recreate reviews table with group_book_id instead of book_id
-- This allows multiple reviews for same book when read in different groups
-- or when group admin adds the same book again for re-reading
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  rating numeric(2, 1) not null check (rating >= 0.5 and rating <= 5),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_book_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- RLS Policies
create policy "Reviews viewable by everyone."
  on public.reviews for select
  using (true);

create policy "Authenticated users can review."
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews."
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews."
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger set_updated_at
  before update on public.reviews
  for each row
  execute procedure public.update_updated_at_column();

-- Add index for common queries
create index idx_reviews_user_id on public.reviews(user_id);
create index idx_reviews_group_book_id on public.reviews(group_book_id);

-- Comment
comment on table public.reviews is 'User reviews for books read in specific groups. Allows multiple reviews per book (one per group).';
