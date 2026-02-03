-- =============================================
-- Add soft delete to group_books
-- 그룹에서 책 삭제 시 기록 보존을 위한 soft delete
-- =============================================

-- 1. Add deleted_at column to group_books
ALTER TABLE public.group_books ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_books_deleted_at ON public.group_books(deleted_at);

-- 3. Update initial schema file comment (for documentation)
COMMENT ON COLUMN public.group_books.deleted_at IS 'Soft delete timestamp. When set, book is hidden from group but user records are preserved.';
