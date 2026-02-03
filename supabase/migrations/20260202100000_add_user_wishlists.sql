-- 위시리스트 테이블 생성
create table public.user_wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  isbn text not null references public.books(isbn) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, isbn)
);

-- RLS 활성화
alter table public.user_wishlists enable row level security;

-- 사용자가 자신의 위시리스트만 관리할 수 있도록 정책 설정
create policy "Users can manage own wishlists"
  on public.user_wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 인덱스 생성
create index idx_user_wishlists_user_id on public.user_wishlists(user_id);
