-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users (Public Profiles)
create table public.users (
  id uuid references auth.users not null primary key,
  nickname text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Groups
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Group Members (Join Table)
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- 4. Books (Shared Resource)
create table public.books (
  isbn text primary key,
  title text not null,
  author text,
  cover_url text,
  total_pages int not null,
  official_toc jsonb, -- Approved TOC
  draft_toc jsonb, -- User submitted TOC
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Group Books (Reading Sessions)
create table public.group_books (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  isbn text references public.books(isbn) not null,
  toc_snapshot jsonb, -- Snapshot of TOC at start
  status text check (status in ('reading', 'done')) default 'reading',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Comments (Discussion)
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  content text not null,
  anchor_text text,
  position_pct float not null check (position_pct >= 0 and position_pct <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.books enable row level security;
alter table public.group_books enable row level security;
alter table public.comments enable row level security;

-- Basic Policies
-- Users
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- Groups
create policy "Everyone can view groups." on public.groups for select using (true);
create policy "Authenticated users can create groups." on public.groups for insert with check (auth.role() = 'authenticated');
create policy "Members can update groups." on public.groups for update using (
  exists ( select 1 from public.group_members where group_id = id and user_id = auth.uid() )
);

-- Group Members
create policy "Group members viewable by everyone." on public.group_members for select using (true);
create policy "Users can join groups." on public.group_members for insert with check (auth.role() = 'authenticated');
create policy "Members can leave groups." on public.group_members for delete using (auth.uid() = user_id);

-- Books
create policy "Books are viewable by everyone." on public.books for select using (true);
create policy "Authenticated users can add books." on public.books for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update books." on public.books for update using (auth.role() = 'authenticated');

-- Group Books
create policy "Group Books viewable by everyone." on public.group_books for select using (true);
create policy "Group members can add books." on public.group_books for insert with check (
  exists ( select 1 from public.group_members where group_id = group_id and user_id = auth.uid() )
);

-- Comments
create policy "Comments viewable by everyone." on public.comments for select using (true);
create policy "Group members can comment." on public.comments for insert with check (
  exists (
    select 1 from public.group_books gb
    join public.group_members gm on gb.group_id = gm.group_id
    where gb.id = group_book_id and gm.user_id = auth.uid()
  )
);
