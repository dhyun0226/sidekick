-- 1. Comments: Add parent_id for threaded replies
alter table public.comments 
add column parent_id uuid references public.comments(id) on delete cascade;

-- 2. Reactions (Likes, etc.)
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  type text not null, -- 'like', 'love', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, comment_id, type)
);

-- 3. Reviews (Star Rating & Content)
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  book_id text references public.books(isbn) on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

-- 4. Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null, -- Receiver
  type text not null, -- 'reply', 'like', 'notice'
  source_id uuid not null, -- ID of the comment/reaction/etc.
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reactions enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- Policies

-- Reactions
create policy "Reactions viewable by everyone." on public.reactions for select using (true);
create policy "Authenticated users can react." on public.reactions for insert with check (auth.role() = 'authenticated');
create policy "Users can remove own reactions." on public.reactions for delete using (auth.uid() = user_id);

-- Reviews
create policy "Reviews viewable by everyone." on public.reviews for select using (true);
create policy "Authenticated users can review." on public.reviews for insert with check (auth.role() = 'authenticated');
create policy "Users can update own reviews." on public.reviews for update using (auth.uid() = user_id);

-- Notifications
create policy "Users can view own notifications." on public.notifications for select using (auth.uid() = user_id);
create policy "System/Users can insert notifications." on public.notifications for insert with check (true); -- Simplified for MVP
create policy "Users can update own notifications (mark read)." on public.notifications for update using (auth.uid() = user_id);
