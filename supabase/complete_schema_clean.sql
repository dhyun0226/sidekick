-- =============================================
-- Sidekick - Complete Database Schema (Clean Install)
-- Supabase PostgreSQL with RLS & Permissions
-- =============================================
-- 처음 설치용 - DROP 구문 없이 깨끗하게 설치
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- For text search performance

-- =============================================
-- 2. TABLES
-- =============================================

-- 2.1 Users (Public Profiles)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.2 Groups
create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default substr(md5(random()::text), 0, 9) not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.3 Group Members (Join Table)
create table if not exists public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- 2.4 Books (Shared Resource)
create table if not exists public.books (
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

-- 2.5 Group Books (Reading Sessions)
create table if not exists public.group_books (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  isbn text references public.books(isbn) on delete cascade not null,
  toc_snapshot jsonb, -- Snapshot of TOC at start (immutable)
  status text check (status in ('reading', 'done')) default 'reading' not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  finished_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.6 Comments (Discussion with Threading)
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade, -- For replies
  content text not null,
  anchor_text text, -- Selected text being commented on
  position_pct float not null check (position_pct >= 0 and position_pct <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.7 Reactions (Likes, etc.)
create table if not exists public.reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  type text not null check (type in ('like', 'love', 'fire', 'thinking')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, comment_id, type)
);

-- 2.8 Reviews (Star Rating & Content)
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  book_id text references public.books(isbn) on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, book_id)
);

-- 2.9 Notifications
create table if not exists public.notifications (
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
-- 3. INDEXES (Performance Optimization)
-- =============================================

-- Users
create index if not exists idx_users_nickname on public.users using gin (nickname gin_trgm_ops);

-- Groups
create index if not exists idx_groups_invite_code on public.groups(invite_code);
create index if not exists idx_groups_created_by on public.groups(created_by);

-- Group Members
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_members_role on public.group_members(role);

-- Books
create index if not exists idx_books_title on public.books using gin (title gin_trgm_ops);
create index if not exists idx_books_author on public.books using gin (author gin_trgm_ops);

-- Group Books
create index if not exists idx_group_books_group on public.group_books(group_id);
create index if not exists idx_group_books_status on public.group_books(status);
create index if not exists idx_group_books_isbn on public.group_books(isbn);

-- Comments
create index if not exists idx_comments_group_book on public.comments(group_book_id);
create index if not exists idx_comments_user on public.comments(user_id);
create index if not exists idx_comments_parent on public.comments(parent_id);
create index if not exists idx_comments_position on public.comments(position_pct);

-- Reactions
create index if not exists idx_reactions_comment on public.reactions(comment_id);
create index if not exists idx_reactions_user on public.reactions(user_id);

-- Reviews
create index if not exists idx_reviews_book on public.reviews(book_id);
create index if not exists idx_reviews_user on public.reviews(user_id);

-- Notifications
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- =============================================
-- 4. FUNCTIONS & TRIGGERS
-- =============================================

-- 4.1 Auto-create user profile on signup
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4.2 Create notification on comment reply
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

drop trigger if exists on_comment_reply on public.comments;
create trigger on_comment_reply
  after insert on public.comments
  for each row execute procedure public.create_notification_on_comment_reply();

-- 4.3 Create notification on reaction
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

drop trigger if exists on_reaction_created on public.reactions;
create trigger on_reaction_created
  after insert on public.reactions
  for each row execute procedure public.create_notification_on_reaction();

-- 4.4 Update timestamps
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at before update on public.users
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_groups_updated_at on public.groups;
create trigger update_groups_updated_at before update on public.groups
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_books_updated_at on public.books;
create trigger update_books_updated_at before update on public.books
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_group_books_updated_at on public.group_books;
create trigger update_group_books_updated_at before update on public.group_books
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_comments_updated_at on public.comments;
create trigger update_comments_updated_at before update on public.comments
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_reviews_updated_at on public.reviews;
create trigger update_reviews_updated_at before update on public.reviews
  for each row execute procedure public.update_updated_at_column();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.books enable row level security;
alter table public.group_books enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- =============================================
-- 5.1 USERS POLICIES
-- =============================================

create policy "Public profiles are viewable by everyone."
  on public.users for select
  using (true);

create policy "Users can insert their own profile."
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile."
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile."
  on public.users for delete
  using (auth.uid() = id);

-- =============================================
-- 5.2 GROUPS POLICIES
-- =============================================

create policy "Everyone can view groups."
  on public.groups for select
  using (true);

create policy "Authenticated users can create groups."
  on public.groups for insert
  with check (auth.role() = 'authenticated');

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
-- 5.3 GROUP MEMBERS POLICIES
-- =============================================

create policy "Group members viewable by everyone."
  on public.group_members for select
  using (true);

create policy "Users can join groups."
  on public.group_members for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
  );

create policy "Members can leave groups."
  on public.group_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
  );

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

-- =============================================
-- 5.4 BOOKS POLICIES
-- =============================================

create policy "Books are viewable by everyone."
  on public.books for select
  using (true);

create policy "Authenticated users can add books."
  on public.books for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update books."
  on public.books for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =============================================
-- 5.5 GROUP BOOKS POLICIES
-- =============================================

create policy "Group Books viewable by members."
  on public.group_books for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = group_books.group_id
        and user_id = auth.uid()
    )
  );

create policy "Group members can add books."
  on public.group_books for insert
  with check (
    exists (
      select 1 from public.group_members
      where group_id = group_books.group_id
        and user_id = auth.uid()
    )
  );

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

-- =============================================
-- 5.6 COMMENTS POLICIES
-- =============================================

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

create policy "Users can update own comments."
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own comments."
  on public.comments for delete
  using (auth.uid() = user_id);

-- =============================================
-- 5.7 REACTIONS POLICIES
-- =============================================

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

create policy "Users can remove own reactions."
  on public.reactions for delete
  using (auth.uid() = user_id);

-- =============================================
-- 5.8 REVIEWS POLICIES
-- =============================================

create policy "Reviews viewable by everyone."
  on public.reviews for select
  using (true);

create policy "Authenticated users can review."
  on public.reviews for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = user_id
  );

create policy "Users can update own reviews."
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own reviews."
  on public.reviews for delete
  using (auth.uid() = user_id);

-- =============================================
-- 5.9 NOTIFICATIONS POLICIES
-- =============================================

create policy "Users can view own notifications."
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications."
  on public.notifications for insert
  with check (true);

create policy "Users can update own notifications."
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own notifications."
  on public.notifications for delete
  using (auth.uid() = user_id);

-- =============================================
-- 6. STORAGE (Avatars)
-- =============================================
-- 주의: Storage는 SQL Editor에서 실행할 수 없습니다!
-- 아래 내용은 Supabase Dashboard에서 수동으로 설정해야 합니다.
-- Dashboard > Storage에서 진행하세요.
-- =============================================

-- STEP 1: Storage Bucket 생성 (Dashboard에서)
-- - Bucket name: avatars
-- - Public: Yes
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- STEP 2: Storage Policies 설정 (Dashboard > Storage > avatars > Policies)
--
-- Policy 1: "Public Access for Avatars" (SELECT)
-- - Target roles: public
-- - Policy definition:
--   bucket_id = 'avatars'
--
-- Policy 2: "Users can upload own avatar" (INSERT)
-- - Target roles: authenticated
-- - Policy definition:
--   bucket_id = 'avatars'
--   AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 3: "Users can update own avatar" (UPDATE)
-- - Target roles: authenticated
-- - Policy definition:
--   bucket_id = 'avatars'
--   AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 4: "Users can delete own avatar" (DELETE)
-- - Target roles: authenticated
-- - Policy definition:
--   bucket_id = 'avatars'
--   AND auth.uid()::text = (storage.foldername(name))[1]

-- =============================================
-- 7. GRANTS (Permissions)
-- =============================================

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all sequences in schema public to postgres, service_role;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema public to postgres, anon, authenticated, service_role;

-- =============================================
-- COMPLETE!
-- =============================================
-- 이제 OAuth 설정하고 앱을 테스트하시면 됩니다!
-- =============================================
