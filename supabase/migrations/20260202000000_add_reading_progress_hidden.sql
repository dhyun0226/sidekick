-- =============================================
-- Add hidden field to user_reading_progress
-- 프로필 서재에서 책 숨김 기능
-- =============================================

-- 1. Add hidden column
ALTER TABLE public.user_reading_progress
ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- 2. Add comment
COMMENT ON COLUMN public.user_reading_progress.hidden IS 'When true, this book is hidden from the user profile library';
