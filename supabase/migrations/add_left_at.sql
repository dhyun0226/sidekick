-- group_members 테이블에 left_at 컬럼 추가 (Soft Delete를 위함)
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;
