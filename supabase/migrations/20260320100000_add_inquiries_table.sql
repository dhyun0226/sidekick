-- ============================================
-- 고객 문의 테이블
-- ============================================

create table public.inquiries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null check (category in ('payment', 'bug', 'feature', 'account', 'other')),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'replied', 'closed')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.inquiries enable row level security;

-- 유저: 본인 문의만 조회
create policy "Users can view own inquiries"
  on public.inquiries for select
  using (auth.uid() = user_id);

-- 유저: 본인 문의 작성
create policy "Users can create own inquiries"
  on public.inquiries for insert
  with check (auth.uid() = user_id);

-- 인덱스
create index idx_inquiries_user_id on public.inquiries(user_id);
create index idx_inquiries_status on public.inquiries(status);
create index idx_inquiries_created_at on public.inquiries(created_at desc);
