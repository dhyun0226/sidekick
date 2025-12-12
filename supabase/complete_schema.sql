-- =============================================
-- Sidekick - Complete Database Schema
-- Supabase PostgreSQL with RLS & Permissions
-- =============================================
-- 이 스크립트는 전체 데이터베이스를 처음부터 재구성합니다.
-- RLS 정책, 트리거, 함수, Storage까지 모두 포함되어 있습니다.
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- For text search performance

-- =============================================
-- 2. DROP EXISTING (개발용 - 주의!)
-- =============================================
-- 프로덕션에서는 이 섹션을 주석 처리하세요!
drop policy if exists "Public profiles are viewable by everyone." on public.users;
drop policy if exists "Users can insert their own profile." on public.users;
drop policy if exists "Users can update own profile." on public.users;
drop policy if exists "Users can delete own profile." on public.users;

drop policy if exists "Everyone can view groups." on public.groups;
drop policy if exists "Authenticated users can create groups." on public.groups;
drop policy if exists "Members can update groups." on public.groups;
drop policy if exists "Admins can delete groups." on public.groups;

drop policy if exists "Group members viewable by everyone." on public.group_members;
drop policy if exists "Users can join groups." on public.group_members;
drop policy if exists "Members can leave groups." on public.group_members;
drop policy if exists "Admins can manage members." on public.group_members;

drop policy if exists "Books are viewable by everyone." on public.books;
drop policy if exists "Authenticated users can add books." on public.books;
drop policy if exists "Authenticated users can update books." on public.books;

drop policy if exists "Group Books viewable by members." on public.group_books;
drop policy if exists "Group members can add books." on public.group_books;
drop policy if exists "Group members can update books." on public.group_books;
drop policy if exists "Admins can delete group books" on public.group_books;

drop policy if exists "Comments viewable by group members." on public.comments;
drop policy if exists "Group members can comment." on public.comments;
drop policy if exists "Users can update own comments." on public.comments;
drop policy if exists "Users can delete own comments." on public.comments;

drop policy if exists "Reactions viewable by everyone." on public.reactions;
drop policy if exists "Authenticated users can react." on public.reactions;
drop policy if exists "Users can remove own reactions." on public.reactions;

drop policy if exists "Reviews viewable by everyone." on public.reviews;
drop policy if exists "Authenticated users can review." on public.reviews;
drop policy if exists "Users can update own reviews." on public.reviews;
drop policy if exists "Users can delete own reviews." on public.reviews;

drop policy if exists "Users can view own notifications." on public.notifications;
drop policy if exists "System/Users can insert notifications." on public.notifications;
drop policy if exists "Users can update own notifications (mark read)." on public.notifications;
drop policy if exists "Users can delete own notifications." on public.notifications;

drop policy if exists "Users can view all progress in their groups" on public.user_reading_progress;
drop policy if exists "Users can insert own progress" on public.user_reading_progress;
drop policy if exists "Users can update own progress" on public.user_reading_progress;

drop table if exists public.notifications cascade;
drop table if exists public.user_reading_progress cascade;
drop table if exists public.reactions cascade;
drop table if exists public.reviews cascade;
drop table if exists public.comments cascade;
drop table if exists public.group_books cascade;
drop table if exists public.books cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.users cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.create_notification_on_comment_reply() cascade;
drop function if exists public.create_notification_on_reaction() cascade;
drop function if exists public.create_notification_on_member_join() cascade;
drop function if exists public.create_notification_on_completion() cascade;
drop function if exists public.update_updated_at_column() cascade;

-- =============================================
-- 3. TABLES
-- =============================================

-- 3.1 Users (Public Profiles)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text,
  avatar_url text,
  notification_settings jsonb default jsonb_build_object(
    'comment_reply', true,
    'reaction', true,
    'member_join', true,
    'completion', true
  ) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.2 Groups
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default substr(md5(random()::text), 0, 9) not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.3 Group Members (Join Table)
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- 3.4 Books (Shared Resource)
create table public.books (
  isbn text primary key,
  title text not null,
  author text,
  publisher text,
  cover_url text,
  total_pages int,
  official_toc jsonb, -- Admin approved TOC
  draft_toc jsonb, -- User submitted TOC (pending approval)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.5 Group Books (Reading Sessions)
create table public.group_books (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  isbn text references public.books(isbn) on delete cascade not null,
  toc_snapshot jsonb, -- Snapshot of TOC at start (immutable)
  status text check (status in ('reading', 'done')) default 'reading' not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  finished_at timestamp with time zone,
  target_start_date date, -- Group reading start goal
  target_end_date date, -- Group reading end goal
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.6 Comments (Discussion with Threading)
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade, -- For replies
  content text not null,
  anchor_text text, -- Selected text being commented on
  position_pct integer not null check (position_pct >= 0 and position_pct <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.7 User Reading Progress (Individual Progress Tracking)
create table public.user_reading_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  progress_pct integer not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  last_read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  finished_at timestamp with time zone, -- When user finished reading (100%)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_book_id)
);

-- 3.8 Reactions (Likes, etc.)
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  type text not null check (type in ('like', 'love', 'fire', 'thinking')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, comment_id, type)
);

-- 3.9 Reviews (Star Rating & Content)
-- Reviews are tied to group_books (not just books) to preserve group reading history
-- This allows multiple reviews for the same book when:
--   1. Read in different groups
--   2. Group admin adds the same book again for re-reading (creates new group_book_id)
-- Completion time is tracked in user_reading_progress.finished_at
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

-- 3.10 Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null, -- Receiver
  type text not null check (type in ('reply', 'reaction', 'mention', 'system')),
  title text not null,
  message text,
  source_id uuid, -- ID of the comment/reaction/etc.
  link text, -- Deep link to the source
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- 4. INDEXES (Performance Optimization)
-- =============================================

-- Users
create index idx_users_nickname on public.users using gin (nickname gin_trgm_ops);

-- Groups
create index idx_groups_invite_code on public.groups(invite_code);
create index idx_groups_created_by on public.groups(created_by);

-- Group Members
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_group_members_role on public.group_members(role);

-- Books
create index idx_books_title on public.books using gin (title gin_trgm_ops);
create index idx_books_author on public.books using gin (author gin_trgm_ops);

-- Group Books
create index idx_group_books_group on public.group_books(group_id);
create index idx_group_books_status on public.group_books(status);
create index idx_group_books_isbn on public.group_books(isbn);

-- Comments
create index idx_comments_group_book on public.comments(group_book_id);
create index idx_comments_user on public.comments(user_id);
create index idx_comments_parent on public.comments(parent_id);
create index idx_comments_position on public.comments(position_pct);

-- User Reading Progress
create index idx_user_reading_progress_user_book on public.user_reading_progress(user_id, group_book_id);

-- Reactions
create index idx_reactions_comment on public.reactions(comment_id);
create index idx_reactions_user on public.reactions(user_id);

-- Reviews
create index idx_reviews_book on public.reviews(book_id);
create index idx_reviews_user on public.reviews(user_id);

-- Notifications
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(is_read);
create index idx_notifications_created_at on public.notifications(created_at desc);

-- =============================================
-- 5. FUNCTIONS & TRIGGERS
-- =============================================

-- 5.1 Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5.2 Create notification on comment reply
create or replace function public.create_notification_on_comment_reply()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  parent_user_id uuid;
  replier_nickname text;
begin
  -- Only proceed if this is a reply (has parent_id)
  if new.parent_id is not null then
    -- Get the parent comment's author
    select user_id into parent_user_id
    from public.comments
    where id = new.parent_id;

    -- Get replier's nickname
    select nickname into replier_nickname
    from public.users
    where id = new.user_id;

    -- Don't notify yourself
    if parent_user_id != new.user_id then
      insert into public.notifications (user_id, type, title, message, source_id, link)
      values (
        parent_user_id,
        'reply',
        '새 댓글 알림',
        coalesce(replier_nickname, '누군가') || '님이 회원님의 댓글에 답글을 남겼습니다.',
        new.id,
        '/group/' || (select group_id from public.group_books where id = new.group_book_id)
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger on_comment_reply
  after insert on public.comments
  for each row execute procedure public.create_notification_on_comment_reply();

-- 5.3 Create notification on reaction
create or replace function public.create_notification_on_reaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  comment_author_id uuid;
  reactor_nickname text;
begin
  -- Get the comment's author
  select user_id into comment_author_id
  from public.comments
  where id = new.comment_id;

  -- Get reactor's nickname
  select nickname into reactor_nickname
  from public.users
  where id = new.user_id;

  -- Don't notify yourself
  if comment_author_id != new.user_id then
    insert into public.notifications (user_id, type, title, message, source_id, link)
    values (
      comment_author_id,
      'reaction',
      '반응 알림',
      coalesce(reactor_nickname, '누군가') || '님이 회원님의 댓글에 반응했습니다.',
      new.comment_id,
      '/group/' || (select gb.group_id from public.comments c join public.group_books gb on c.group_book_id = gb.id where c.id = new.comment_id)
    );
  end if;

  return new;
end;
$$;

create trigger on_reaction_created
  after insert on public.reactions
  for each row execute procedure public.create_notification_on_reaction();

-- 5.4 Create notification on member join
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

create trigger on_member_join
  after insert on public.group_members
  for each row execute procedure public.create_notification_on_member_join();

-- 5.5 Create notification on book completion
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

create trigger on_book_completion
  after update on public.user_reading_progress
  for each row execute procedure public.create_notification_on_completion();

-- 5.6 Update timestamps
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger update_users_updated_at before update on public.users
  for each row execute procedure public.update_updated_at_column();

create trigger update_groups_updated_at before update on public.groups
  for each row execute procedure public.update_updated_at_column();

create trigger update_books_updated_at before update on public.books
  for each row execute procedure public.update_updated_at_column();

create trigger update_group_books_updated_at before update on public.group_books
  for each row execute procedure public.update_updated_at_column();

create trigger update_comments_updated_at before update on public.comments
  for each row execute procedure public.update_updated_at_column();

create trigger update_user_reading_progress_updated_at before update on public.user_reading_progress
  for each row execute procedure public.update_updated_at_column();

create trigger update_reviews_updated_at before update on public.reviews
  for each row execute procedure public.update_updated_at_column();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.books enable row level security;
alter table public.group_books enable row level security;
alter table public.comments enable row level security;
alter table public.user_reading_progress enable row level security;
alter table public.reactions enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- =============================================
-- 6.1 USERS POLICIES
-- =============================================

-- Anyone can view public profiles
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using (true);

-- Users can insert their own profile (via trigger)
create policy "Users can insert their own profile."
  on public.users for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile."
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can delete their own profile
create policy "Users can delete own profile."
  on public.users for delete
  using (auth.uid() = id);

-- =============================================
-- 6.2 GROUPS POLICIES
-- =============================================

-- Anyone can view groups (for discovery/join)
create policy "Everyone can view groups."
  on public.groups for select
  using (true);

-- Authenticated users can create groups
create policy "Authenticated users can create groups."
  on public.groups for insert
  with check (auth.role() = 'authenticated');

-- Group admins can update group info
create policy "Admins can update groups."
  on public.groups for update
  using (
    exists (
      select 1 from public.group_members
      where group_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.group_members
      where group_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- Group admins can delete groups
create policy "Admins can delete groups."
  on public.groups for delete
  using (
    exists (
      select 1 from public.group_members
      where group_id = id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- =============================================
-- 6.3 GROUP MEMBERS POLICIES
-- =============================================

-- Anyone can view group members
create policy "Group members viewable by everyone."
  on public.group_members for select
  using (true);

-- Authenticated users can join groups
create policy "Users can join groups."
  on public.group_members for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
  );

-- Users can leave groups (delete their own membership)
create policy "Members can leave groups."
  on public.group_members for delete
  using (auth.uid() = user_id);

-- Admins can manage members (update roles, kick members)
create policy "Admins can manage members."
  on public.group_members for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

create policy "Admins can remove members."
  on public.group_members for delete
  using (
    auth.uid() = user_id -- Self removal
    or exists ( -- Admin removal
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- =============================================
-- 6.4 BOOKS POLICIES
-- =============================================

-- Anyone can view books
create policy "Books are viewable by everyone."
  on public.books for select
  using (true);

-- Authenticated users can add books
create policy "Authenticated users can add books."
  on public.books for insert
  with check (auth.role() = 'authenticated');

-- Authenticated users can update books (TOC submissions)
create policy "Authenticated users can update books."
  on public.books for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================
-- 6.5 GROUP BOOKS POLICIES
-- =============================================

-- Group members can view group books
create policy "Group Books viewable by members."
  on public.group_books for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = group_books.group_id
        and user_id = auth.uid()
    )
  );

-- Group members can add books to their group
create policy "Group members can add books."
  on public.group_books for insert
  with check (
    exists (
      select 1 from public.group_members
      where group_id = group_books.group_id
        and user_id = auth.uid()
    )
  );

-- Group members can update group books (mark as done, etc.)
create policy "Group members can update books."
  on public.group_books for update
  using (
    exists (
      select 1 from public.group_members
      where group_id = group_books.group_id
        and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.group_members
      where group_id = group_books.group_id
        and user_id = auth.uid()
    )
  );

-- Admins can delete group books
create policy "Admins can delete group books"
  on public.group_books for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_books.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

-- =============================================
-- 6.6 COMMENTS POLICIES
-- =============================================

-- Group members can view comments
create policy "Comments viewable by group members."
  on public.comments for select
  using (
    exists (
      select 1 from public.group_books gb
      join public.group_members gm on gb.group_id = gm.group_id
      where gb.id = comments.group_book_id
        and gm.user_id = auth.uid()
    )
  );

-- Group members can create comments
create policy "Group members can comment."
  on public.comments for insert
  with check (
    exists (
      select 1 from public.group_books gb
      join public.group_members gm on gb.group_id = gm.group_id
      where gb.id = group_book_id
        and gm.user_id = auth.uid()
    )
    and auth.uid() = user_id
  );

-- Users can update their own comments
create policy "Users can update own comments."
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete own comments."
  on public.comments for delete
  using (auth.uid() = user_id);

-- =============================================
-- 6.7 USER READING PROGRESS POLICIES
-- =============================================

-- Group members can view all progress in their groups
create policy "Users can view all progress in their groups."
  on public.user_reading_progress for select
  using (
    exists (
      select 1 from public.group_books gb
      join public.group_members gm on gb.group_id = gm.group_id
      where gb.id = user_reading_progress.group_book_id
        and gm.user_id = auth.uid()
    )
  );

-- Users can insert their own progress
create policy "Users can insert own progress."
  on public.user_reading_progress for insert
  with check (auth.uid() = user_id);

-- Users can update their own progress
create policy "Users can update own progress."
  on public.user_reading_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- 6.8 REACTIONS POLICIES
-- =============================================

-- Group members can view reactions
create policy "Reactions viewable by group members."
  on public.reactions for select
  using (
    exists (
      select 1 from public.comments c
      join public.group_books gb on c.group_book_id = gb.id
      join public.group_members gm on gb.group_id = gm.group_id
      where c.id = reactions.comment_id
        and gm.user_id = auth.uid()
    )
  );

-- Group members can create reactions
create policy "Group members can react."
  on public.reactions for insert
  with check (
    exists (
      select 1 from public.comments c
      join public.group_books gb on c.group_book_id = gb.id
      join public.group_members gm on gb.group_id = gm.group_id
      where c.id = comment_id
        and gm.user_id = auth.uid()
    )
    and auth.uid() = user_id
  );

-- Users can remove their own reactions
create policy "Users can remove own reactions."
  on public.reactions for delete
  using (auth.uid() = user_id);

-- =============================================
-- 6.9 REVIEWS POLICIES
-- =============================================

-- Anyone can view reviews
create policy "Reviews viewable by everyone."
  on public.reviews for select
  using (true);

-- Authenticated users can create reviews
create policy "Authenticated users can review."
  on public.reviews for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
  );

-- Users can update their own reviews
create policy "Users can update own reviews."
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own reviews
create policy "Users can delete own reviews."
  on public.reviews for delete
  using (auth.uid() = user_id);

-- =============================================
-- 6.10 NOTIFICATIONS POLICIES
-- =============================================

-- Users can only view their own notifications
create policy "Users can view own notifications."
  on public.notifications for select
  using (auth.uid() = user_id);

-- System can create notifications (via triggers with security definer)
create policy "System can insert notifications."
  on public.notifications for insert
  with check (true); -- Controlled by trigger functions

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications."
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own notifications
create policy "Users can delete own notifications."
  on public.notifications for delete
  using (auth.uid() = user_id);

-- =============================================
-- 7. STORAGE (Avatars)
-- =============================================

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Enable RLS for storage.objects
alter table storage.objects enable row level security;

-- Drop existing storage policies
drop policy if exists "Public Access for Avatars" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

-- Anyone can view avatars (public bucket)
create policy "Public Access for Avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload their own avatars
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
    and auth.role() = 'authenticated'
  );

-- Users can update their own avatars
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatars
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 8. GRANTS (Permissions)
-- =============================================

-- Grant usage on schema
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Grant access to all tables
grant all on all tables in schema public to postgres, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- Grant access to all sequences
grant all on all sequences in schema public to postgres, service_role;
grant usage on all sequences in schema public to authenticated;

-- Grant execute on functions
grant execute on all functions in schema public to postgres, anon, authenticated, service_role;

-- =============================================
-- 9. HELPFUL VIEWS (Optional)
-- =============================================

-- View: Active Reading Sessions per User
create or replace view user_active_readings as
select
  u.id as user_id,
  u.nickname,
  g.id as group_id,
  g.name as group_name,
  b.isbn,
  b.title as book_title,
  b.author,
  gb.started_at,
  gb.status
from public.users u
join public.group_members gm on u.id = gm.user_id
join public.groups g on gm.group_id = g.id
join public.group_books gb on g.id = gb.group_id
join public.books b on gb.isbn = b.isbn
where gb.status = 'reading';

-- =============================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =============================================

-- Uncomment to insert sample data for testing
/*
-- Sample user (must exist in auth.users first via OAuth)
-- insert into public.users (id, nickname, avatar_url) values
-- ('00000000-0000-0000-0000-000000000001', '테스트유저', 'https://i.pravatar.cc/150?img=1');

-- Sample group
-- insert into public.groups (id, name, created_by) values
-- ('10000000-0000-0000-0000-000000000001', '우리들의 독서모임', '00000000-0000-0000-0000-000000000001');

-- Sample group member
-- insert into public.group_members (group_id, user_id, role) values
-- ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin');

-- Sample book
-- insert into public.books (isbn, title, author, total_pages) values
-- ('9788934942467', '죽은 시인의 사회', 'N. H. 클라인바움', 200);
*/

-- =============================================
-- SCHEMA SETUP COMPLETE!
-- =============================================
-- 다음 단계:
-- 1. Supabase Dashboard에서 이 SQL을 실행하거나
-- 2. supabase db reset (로컬) 후 마이그레이션 적용
-- 3. OAuth providers 설정 (Google, Kakao)
-- 4. 환경변수 확인 (.env)
-- =============================================
