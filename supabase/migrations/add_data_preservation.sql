-- 1. 그룹 소프트 삭제를 위한 컬럼 추가
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 회원 탈퇴 시 기록 보존을 위한 제약 조건 변경
-- (user_id를 NULL 허용으로 바꾸고, 유저 삭제 시 NULL로 세팅)

-- Comments 테이블
ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Reviews 테이블
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- User Reading Progress 테이블 (완독 기록 보존을 원할 경우)
ALTER TABLE public.user_reading_progress ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_reading_progress DROP CONSTRAINT IF EXISTS user_reading_progress_user_id_fkey;
ALTER TABLE public.user_reading_progress ADD CONSTRAINT user_reading_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
