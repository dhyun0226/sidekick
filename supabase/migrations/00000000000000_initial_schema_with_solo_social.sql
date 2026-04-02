-- =============================================
-- Sidekick - Complete Initial Schema (Solo/Social)
-- 방안 1: Soft Delete로 기록 보존
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- For text search performance

-- =============================================
-- 2. HELPER FUNCTIONS (Before tables)
-- =============================================

-- Function to generate unique invite codes (with duplicate check)
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
  v_attempts integer := 0;
begin
  loop
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    select exists(select 1 from public.groups where invite_code = v_code) into v_exists;

    if not v_exists then
      return v_code;
    end if;

    v_attempts := v_attempts + 1;
    if v_attempts > 100 then
      raise exception 'Failed to generate unique invite code after 100 attempts';
    end if;
  end loop;
end;
$$;

-- =============================================
-- 3. TABLES
-- =============================================

-- 3.1 Users
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text check (nickname is null or char_length(trim(both from nickname)) >= 2 and char_length(trim(both from nickname)) <= 15),
  avatar_url text,
  subscription_tier text check (subscription_tier in ('free', 'premium', 'admin')) default 'free' not null,
  yearly_reading_goal integer default 50,
  notification_settings jsonb not null default jsonb_build_object(
    'comment_reply', true,
    'reaction', true,
    'member_join', true,
    'completion', true,
    'book_added', true,
    'group_archived', true
  ),
  app_settings jsonb not null default jsonb_build_object(
    'library_view_mode', 'year',
    'calendar_include_comments', true
  ),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 3.2 Subscription Plans
create table public.subscription_plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  display_name text not null,
  tier text not null check (tier in ('free', 'premium', 'admin')),
  billing_period text not null,
  billing_period_months integer not null,
  price integer not null,
  discount_percentage integer default 0,
  features jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3.3 Subscription Limits
create table public.subscription_limits (
  tier text primary key check (tier in ('free', 'premium', 'admin')),
  max_groups_created integer not null,
  max_books_per_group integer not null,
  has_statistics_access boolean default false not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default limits
insert into public.subscription_limits (tier, max_groups_created, max_books_per_group, has_statistics_access) values
  ('free', -1, 10, false),  -- -1 = unlimited (free users can join unlimited social groups)
  ('premium', -1, -1, true),
  ('admin', -1, -1, true);

-- 3.4 Subscriptions
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  status text not null check (status in ('active', 'expired', 'cancelled')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  auto_renew boolean default true,
  billing_key text,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3.5 Payments
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id),
  plan_id uuid references public.subscription_plans(id),
  order_id text not null unique,
  payment_key text unique,
  amount integer not null,
  method text,
  status text not null,
  approved_at timestamptz,
  toss_response jsonb,
  created_at timestamptz default now()
);

-- 3.6 Groups (with group_type and status from start)
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null check (char_length(trim(both from name)) >= 2 and char_length(trim(both from name)) <= 20),
  invite_code text unique, -- nullable: solo groups don't need invite codes
  group_type text check (group_type in ('solo', 'social')) default 'social' not null,
  status text check (status in ('active', 'paused', 'archived')) default 'active' not null,
  created_by uuid references public.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Auto-generate invite code only for social groups
create or replace function auto_generate_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.group_type = 'social' and new.invite_code is null then
    new.invite_code := generate_invite_code();
  end if;
  return new;
end;
$$;

create trigger trigger_auto_invite_code
  before insert on public.groups
  for each row execute function auto_generate_invite_code();

-- 3.7 Group Members (with left_at from start)
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamptz not null default timezone('utc'::text, now()),
  left_at timestamptz,
  unique(group_id, user_id)
);

-- 3.8 Books
create table public.books (
  isbn text not null primary key,
  title text not null,
  author text,
  publisher text,
  cover_url text,
  -- Pages (draft/official for approval system)
  draft_pages integer,
  official_pages integer,
  -- TOC (draft/official for approval system)
  draft_toc jsonb,
  official_toc jsonb,
  -- Genre (draft/official for approval system)
  draft_genre text,
  official_genre text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 3.9 Group Books (그룹에서 어떤 책을 읽고 있는지 - 목록 역할)
create table public.group_books (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  isbn text references public.books(isbn) on delete cascade not null,
  -- Snapshots (사용자 입력값, official은 가이드일 뿐)
  pages_snapshot integer,
  toc_snapshot jsonb,
  genre_snapshot text,
  status text not null default 'reading' check (status in ('reading', 'done')),
  started_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz,
  target_start_date date,
  target_end_date date,
  deleted_at timestamptz,  -- Soft delete: 그룹에서 책 삭제 시
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(group_id, isbn, deleted_at)  -- 같은 그룹에서 같은 책 중복 방지 (삭제된 건 제외)
);

-- 3.10 Comments (group_book_id 기반, soft delete로 보존)
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(trim(both from content)) <= 500),
  anchor_text text,
  position_pct integer not null check (position_pct >= 0 and position_pct <= 100),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 3.11 Reactions
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  type text not null check (type in ('like', 'love', 'fire', 'thinking')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, comment_id, type)
);

-- 3.12 Reviews (group_book_id 기반, soft delete로 보존)
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  rating numeric not null check (rating >= 0.5 and rating <= 5),
  content text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, group_book_id)  -- 같은 사용자가 같은 그룹책에 하나의 리뷰
);

-- 3.13 Reading Progress (group_book_id 기반, soft delete로 보존)
create table public.user_reading_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_book_id uuid references public.group_books(id) on delete cascade not null,
  progress_pct integer not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  last_read_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz,
  hidden boolean not null default false,  -- 프로필 서재에서 숨김 여부
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, group_book_id)  -- 같은 사용자가 같은 그룹책에 하나의 진행률
);

-- 3.14 Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('reply', 'reaction', 'mention', 'system', 'book_added', 'group', 'info', 'warning', 'urgent')),
  title text not null,
  message text,
  source_id uuid,
  link text,
  is_read boolean default false not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 3.15 User Wishlists (읽고 싶은 책 목록)
create table public.user_wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  isbn text references public.books(isbn) on delete cascade not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique(user_id, isbn)
);

-- =============================================
-- 4. INDEXES
-- =============================================

-- Users
create index idx_users_subscription_tier on public.users(subscription_tier);
create index idx_users_nickname on public.users using gin (nickname gin_trgm_ops);

-- Groups
create index idx_groups_invite_code on public.groups(invite_code);
create index idx_groups_status on public.groups(status);
create index idx_groups_type on public.groups(group_type);
create index idx_groups_deleted_at on public.groups(deleted_at);
create index idx_groups_created_by on public.groups(created_by);

-- Group Members
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_group_members_role on public.group_members(role);
create index idx_group_members_left_at on public.group_members(left_at);

-- Books
create index idx_books_title on public.books using gin (title gin_trgm_ops);
create index idx_books_author on public.books using gin (author gin_trgm_ops);

-- Group Books
create index idx_group_books_group on public.group_books(group_id);
create index idx_group_books_status on public.group_books(status);
create index idx_group_books_isbn on public.group_books(isbn);
create index idx_group_books_deleted_at on public.group_books(deleted_at);

-- Comments
create index idx_comments_user on public.comments(user_id);
create index idx_comments_group_book on public.comments(group_book_id);
create index idx_comments_parent on public.comments(parent_id);
create index idx_comments_position on public.comments(position_pct);

-- Reactions
create index idx_reactions_comment on public.reactions(comment_id);
create index idx_reactions_user on public.reactions(user_id);

-- Reviews
create index idx_reviews_user on public.reviews(user_id);
create index idx_reviews_group_book on public.reviews(group_book_id);

-- Subscriptions
create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);
create index idx_subscriptions_end_date on public.subscriptions(end_date);

-- Payments
create index idx_payments_user on public.payments(user_id);
create index idx_payments_status on public.payments(status);

-- Notifications
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(is_read);
create index idx_notifications_created_at on public.notifications(created_at desc);

-- Reading Progress
create index idx_reading_progress_user on public.user_reading_progress(user_id);
create index idx_reading_progress_group_book on public.user_reading_progress(group_book_id);

-- User Wishlists
create index idx_user_wishlists_user_id on public.user_wishlists(user_id);

-- =============================================
-- 5. FUNCTIONS
-- =============================================

-- 5.1 Auto-create user profile + Solo group on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_group_id uuid;
  user_nickname text;
begin
  -- 1. Create user profile
  insert into public.users (id, nickname, avatar_url, subscription_tier)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'free'
  )
  on conflict (id) do nothing;

  -- 2. Get user nickname
  select nickname into user_nickname from public.users where id = new.id;

  -- 3. Create Solo group
  insert into public.groups (name, group_type, status, created_by)
  values (
    coalesce(user_nickname, '내') || '의 서재',
    'solo',
    'active',
    new.id
  )
  returning id into new_group_id;

  -- 4. Add user as admin to Solo group
  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, new.id, 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5.2 Update timestamps
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

create trigger update_reviews_updated_at before update on public.reviews
  for each row execute procedure public.update_updated_at_column();

create trigger update_reading_progress_updated_at before update on public.user_reading_progress
  for each row execute procedure public.update_updated_at_column();

create trigger update_subscriptions_updated_at before update on public.subscriptions
  for each row execute procedure public.update_updated_at_column();

create trigger update_subscription_limits_updated_at before update on public.subscription_limits
  for each row execute procedure public.update_updated_at_column();

-- 5.3 Subscription check functions
create or replace function public.can_create_group(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_max_groups integer;
  v_current_count integer;
begin
  -- Get user tier
  select subscription_tier into v_tier from public.users where id = p_user_id;

  -- Get limit
  select max_groups_created into v_max_groups
  from public.subscription_limits where tier = v_tier;

  -- -1 means unlimited
  if v_max_groups = -1 then
    return true;
  end if;

  -- Count current SOCIAL groups where user is admin
  select count(*) into v_current_count
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = p_user_id
    and gm.role = 'admin'
    and g.group_type = 'social'
    and g.deleted_at is null
    and gm.left_at is null;

  return v_current_count < v_max_groups;
end;
$$;

create or replace function public.can_join_group(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_max_groups integer;
  v_current_count integer;
begin
  -- Get user tier
  select subscription_tier into v_tier from public.users where id = p_user_id;

  -- Premium and admin can join unlimited groups
  if v_tier in ('premium', 'admin') then
    return true;
  end if;

  -- Get limit
  select max_groups_created into v_max_groups
  from public.subscription_limits where tier = 'free';

  -- Count current active groups (including solo)
  select count(*) into v_current_count
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.user_id = p_user_id
    and gm.left_at is null
    and g.deleted_at is null
    and g.status in ('active', 'paused');

  return v_current_count < v_max_groups;
end;
$$;

create or replace function public.can_add_book_to_group(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_group_type text;
  v_group_status text;
  v_is_member boolean;
  v_max_books integer;
  v_current_count integer;
begin
  -- ✅ Check membership first (must be active member)
  select exists(
    select 1 from public.group_members
    where user_id = p_user_id
    and group_id = p_group_id
    and left_at is null
  ) into v_is_member;

  if not v_is_member then
    return false;
  end if;

  -- Get group info
  select group_type, status into v_group_type, v_group_status
  from public.groups where id = p_group_id;

  -- Group must be active
  if v_group_status != 'active' then
    return false;
  end if;

  -- Get user tier
  select subscription_tier into v_tier from public.users where id = p_user_id;

  -- Solo groups: members can add books (no tier restriction)
  if v_group_type = 'solo' then
    return true;
  end if;

  -- Social groups: only premium can add books
  if v_tier not in ('premium', 'admin') then
    return false;
  end if;

  -- Check book limit
  select max_books_per_group into v_max_books
  from public.subscription_limits where tier = v_tier;

  -- -1 means unlimited
  if v_max_books = -1 then
    return true;
  end if;

  -- Count current books (not deleted)
  select count(*) into v_current_count
  from public.group_books
  where group_id = p_group_id
  and deleted_at is null;

  return v_current_count < v_max_books;
end;
$$;

create or replace function public.can_perform_social_action(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_tier text;
  v_group_type text;
  v_group_status text;
begin
  -- Get group info
  select group_type, status into v_group_type, v_group_status
  from public.groups where id = p_group_id;

  -- Group must be active
  if v_group_status != 'active' then
    return false;
  end if;

  -- Solo groups: always allowed
  if v_group_type = 'solo' then
    return true;
  end if;

  -- Social groups: only premium
  select subscription_tier into v_tier from public.users where id = p_user_id;

  return v_tier in ('premium', 'admin');
end;
$$;

-- 5.4 Notification triggers
create or replace function public.create_notification_on_comment_reply()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  parent_user_id uuid;
  replier_nickname text;
  v_group_id uuid;
begin
  if new.parent_id is not null then
    select user_id into parent_user_id from public.comments where id = new.parent_id;
    select nickname into replier_nickname from public.users where id = new.user_id;
    select group_id into v_group_id from public.group_books where id = new.group_book_id;

    if parent_user_id != new.user_id then
      insert into public.notifications (user_id, type, title, message, source_id, link)
      values (
        parent_user_id,
        'reply',
        '새 댓글 알림',
        coalesce(replier_nickname, '누군가') || '님이 회원님의 댓글에 답글을 남겼습니다.',
        new.id,
        '/group/' || v_group_id
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger on_comment_reply
  after insert on public.comments
  for each row execute procedure public.create_notification_on_comment_reply();

create or replace function public.create_notification_on_reaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  comment_author_id uuid;
  comment_group_book_id uuid;
  v_group_id uuid;
  reactor_nickname text;
begin
  select user_id, group_book_id into comment_author_id, comment_group_book_id from public.comments where id = new.comment_id;
  select group_id into v_group_id from public.group_books where id = comment_group_book_id;
  select nickname into reactor_nickname from public.users where id = new.user_id;

  if comment_author_id != new.user_id then
    insert into public.notifications (user_id, type, title, message, source_id, link)
    values (
      comment_author_id,
      'reaction',
      '반응 알림',
      coalesce(reactor_nickname, '누군가') || '님이 회원님의 댓글에 반응했습니다.',
      new.comment_id,
      '/group/' || v_group_id
    );
  end if;

  return new;
end;
$$;

create trigger on_reaction_created
  after insert on public.reactions
  for each row execute procedure public.create_notification_on_reaction();

-- 5.5 Helper functions for admin management
create or replace function public.get_premium_admins_in_group(p_group_id uuid)
returns table (user_id uuid, nickname text)
language sql
security definer
as $$
  select gm.user_id, u.nickname
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = p_group_id
    and gm.role = 'admin'
    and gm.left_at is null
    and u.subscription_tier in ('premium', 'admin');
$$;

create or replace function public.is_last_premium_admin(p_user_id uuid, p_group_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_premium_admin_count integer;
  v_user_is_premium_admin boolean;
begin
  -- Count premium admins
  select count(*) into v_premium_admin_count
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = p_group_id
    and gm.role = 'admin'
    and gm.left_at is null
    and u.subscription_tier in ('premium', 'admin');

  -- Check if this user is a premium admin
  select exists (
    select 1
    from public.group_members gm
    join public.users u on u.id = gm.user_id
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.role = 'admin'
      and gm.left_at is null
      and u.subscription_tier in ('premium', 'admin')
  ) into v_user_is_premium_admin;

  return v_user_is_premium_admin and v_premium_admin_count = 1;
end;
$$;

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
alter table public.reactions enable row level security;
alter table public.reviews enable row level security;
alter table public.user_reading_progress enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscription_limits enable row level security;
alter table public.user_wishlists enable row level security;

-- 6.1 Users policies
create policy "Users can view all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- 6.2 Groups policies
create policy "Users can view their groups"
  on public.groups for select
  using (
    deleted_at is null
    or exists (
      select 1 from public.group_members
      where group_id = groups.id
      and user_id = auth.uid()
    )
  );

create policy "Premium users can create social groups"
  on public.groups for insert
  with check (
    auth.role() = 'authenticated'
    and (
      group_type = 'solo' -- Solo created by trigger
      or exists (
        select 1 from public.users
        where id = auth.uid()
        and subscription_tier in ('premium', 'admin')
      )
    )
  );

create policy "Group admins can update groups"
  on public.groups for update
  using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id
      and user_id = auth.uid()
      and role = 'admin'
      and left_at is null
    )
  )
  with check (true);

-- 6.3 Group Members policies
create policy "Everyone can view group members"
  on public.group_members for select using (true);

create policy "Users can join groups within limit"
  on public.group_members for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
    and can_join_group(auth.uid(), group_id)
  );

create policy "Members can leave groups"
  on public.group_members for update
  using (auth.uid() = user_id);

create policy "Admins can manage members"
  on public.group_members for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
      and gm.left_at is null
    )
  );

create policy "Admins can remove members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
      and gm.left_at is null
    )
  );

-- 6.4 Books policies
create policy "Everyone can view books"
  on public.books for select using (true);

create policy "Authenticated users can add books"
  on public.books for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update books"
  on public.books for update
  using (auth.role() = 'authenticated');

-- 6.5 Group Books policies
create policy "Everyone can view group books"
  on public.group_books for select using (true);

create policy "Members can add books in active groups"
  on public.group_books for insert
  with check (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.groups g
      where g.id = group_id
      and g.status = 'active'
      and can_add_book_to_group(auth.uid(), g.id)
    )
  );

create policy "Members can update group books"
  on public.group_books for update
  using (
    exists (
      select 1 from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = group_books.group_id
      and gm.user_id = auth.uid()
      and gm.left_at is null
      and g.status = 'active'
    )
  );

create policy "Admins can delete group books"
  on public.group_books for delete
  using (
    exists (
      select 1 from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = group_books.group_id
      and gm.user_id = auth.uid()
      and gm.left_at is null
      and (
        gm.role = 'admin'  -- Social 그룹: admin만 삭제 가능
        or g.group_type = 'solo'  -- Solo 그룹: 멤버(본인)가 삭제 가능
      )
    )
  );

-- 6.6 Comments policies (group_book_id 기반)
create policy "Everyone can view comments"
  on public.comments for select using (true);

create policy "Members can add comments in active groups"
  on public.comments for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
    and exists (
      select 1 from public.group_books gb
      join public.groups g on g.id = gb.group_id
      join public.group_members gm on gm.group_id = g.id
      where gb.id = group_book_id
      and gm.user_id = auth.uid()
      and gm.left_at is null
      and gb.deleted_at is null
      and can_perform_social_action(auth.uid(), g.id)
    )
  );

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- 6.7 Reactions policies
create policy "Everyone can view reactions"
  on public.reactions for select using (true);

create policy "Members can add reactions"
  on public.reactions for insert
  with check (
    auth.role() = 'authenticated'
    and user_id = auth.uid()
  );

create policy "Users can delete own reactions"
  on public.reactions for delete using (auth.uid() = user_id);

-- 6.8 Reviews policies (group_book_id 기반)
create policy "Everyone can view reviews"
  on public.reviews for select using (true);

create policy "Members can add reviews"
  on public.reviews for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "Users can update own reviews"
  on public.reviews for update using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete using (auth.uid() = user_id);

-- 6.9 Reading Progress policies (group_book_id 기반)
create policy "Users can view all progress"
  on public.user_reading_progress for select using (true);

create policy "Users can insert own progress"
  on public.user_reading_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_reading_progress for update using (auth.uid() = user_id);

-- 6.10 Notifications policies
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

-- 6.11 Subscriptions policies
create policy "Users can view own subscriptions"
  on public.subscriptions for select using (auth.uid() = user_id);

-- 6.12 Payments policies
create policy "Users can view own payments"
  on public.payments for select using (auth.uid() = user_id);

-- 6.13 Public policies
create policy "Everyone can view subscription plans"
  on public.subscription_plans for select using (true);

create policy "Everyone can view subscription limits"
  on public.subscription_limits for select using (true);

-- 6.14 Payments INSERT/UPDATE policies
create policy "Users can create own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- 6.15 Subscriptions INSERT/UPDATE policies
create policy "Users can create own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscription auto_renew"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6.16 User Wishlists policies
create policy "Users can manage own wishlists"
  on public.user_wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- 7. INITIAL DATA
-- =============================================

-- 7.1 Subscription Plans 데이터
INSERT INTO public.subscription_plans (id, name, display_name, tier, billing_period, billing_period_months, price, discount_percentage, features, is_active, created_at) VALUES
  ('cb15993e-5c37-4fc2-834a-44bb596a5924', 'premium_monthly', '프리미엄 월간', 'premium', 'monthly', 1, 2500, 0, '["무제한 그룹 생성", "무제한 책 추가", "고급 통계", "우선 지원"]', true, NOW()),
  ('e29007fc-1370-4e6c-826b-648185c18515', 'premium_yearly', '프리미엄 연간', 'premium', 'yearly', 12, 19000, 37, '["무제한 그룹 생성", "무제한 책 추가", "고급 통계", "우선 지원", "연간 37% 할인"]', true, NOW());

-- 7.2 Subscription Limits 데이터
-- Free: 무제한 그룹 참가 가능, 하지만 Social 그룹에서는 읽기 전용
-- Premium/Admin: 모든 기능 사용 가능
INSERT INTO public.subscription_limits (tier, max_groups_created, max_books_per_group, has_statistics_access) VALUES
  ('free', -1, 10, false),
  ('premium', -1, -1, true),
  ('admin', -1, -1, true)
ON CONFLICT (tier) DO UPDATE SET
  max_groups_created = EXCLUDED.max_groups_created,
  max_books_per_group = EXCLUDED.max_books_per_group,
  has_statistics_access = EXCLUDED.has_statistics_access;

-- =============================================
-- 8. STORAGE BUCKETS
-- =============================================

-- 8.1 Create avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,  -- public bucket (프로필 사진은 공개)
  5242880,  -- 5MB limit
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- 8.2 Storage policies for avatars
-- Allow authenticated users to upload their own avatar
create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatar
create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access (프로필 사진은 누구나 볼 수 있음)
create policy "Anyone can view avatars"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- =============================================
-- 9. GRANTS
-- =============================================

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- =============================================
-- COMPLETE - 방안 1: Soft Delete로 기록 보존
-- 책 삭제 시 deleted_at만 설정, 기록은 그대로 유지
-- n회차 읽기도 자연스럽게 분리됨
-- =============================================
