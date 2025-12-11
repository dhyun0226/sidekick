-- Change position_pct and progress_pct from float to integer
-- All percentages are displayed and used as integers (0-100)
-- Existing float values will be rounded

-- 1. Change comments.position_pct to integer
ALTER TABLE public.comments
  ALTER COLUMN position_pct TYPE integer
  USING ROUND(position_pct)::integer;

-- 2. Change user_reading_progress.progress_pct to integer
ALTER TABLE public.user_reading_progress
  ALTER COLUMN progress_pct TYPE integer
  USING ROUND(progress_pct)::integer;

-- Note: CHECK constraints already exist and will continue to work with integer type
-- position_pct: CHECK (position_pct >= 0 AND position_pct <= 100)
-- progress_pct: CHECK (progress_pct >= 0 AND progress_pct <= 100)
