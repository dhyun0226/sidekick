-- progress_pct / position_pct 정밀도 향상
-- INTEGER → NUMERIC(6,3): 페이지↔퍼센트 왕복 시 round 손실 제거
-- 페이지 36 입력 → 35로 표시되는 버그 해결

-- user_reading_progress.progress_pct
alter table public.user_reading_progress
  alter column progress_pct drop default;
alter table public.user_reading_progress
  alter column progress_pct type numeric(6,3)
  using progress_pct::numeric(6,3);
alter table public.user_reading_progress
  alter column progress_pct set default 0;
alter table public.user_reading_progress
  drop constraint if exists user_reading_progress_progress_pct_check;
alter table public.user_reading_progress
  add constraint user_reading_progress_progress_pct_check
  check (progress_pct >= 0 and progress_pct <= 100);

-- comments.position_pct
alter table public.comments
  alter column position_pct type numeric(6,3)
  using position_pct::numeric(6,3);
alter table public.comments
  drop constraint if exists comments_position_pct_check;
alter table public.comments
  add constraint comments_position_pct_check
  check (position_pct >= 0 and position_pct <= 100);
