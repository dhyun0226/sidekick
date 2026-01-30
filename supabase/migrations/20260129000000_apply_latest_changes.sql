-- =============================================
-- Apply Latest Changes to New DB
-- =============================================
-- 새 DB에 필요한 모든 변경사항 적용

-- =============================================
-- 1. books 테이블: total_pages → draft_pages/official_pages 분리
-- =============================================

-- Check if columns exist before adding
DO $$
BEGIN
  -- Add draft_pages if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'draft_pages'
  ) THEN
    ALTER TABLE public.books ADD COLUMN draft_pages integer;
  END IF;

  -- Add official_pages if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'official_pages'
  ) THEN
    ALTER TABLE public.books ADD COLUMN official_pages integer;
  END IF;
END $$;

-- Migrate existing data if total_pages column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'total_pages'
  ) THEN
    -- Copy data from total_pages to draft_pages
    UPDATE public.books SET draft_pages = total_pages WHERE total_pages IS NOT NULL;

    -- Drop old column
    ALTER TABLE public.books DROP COLUMN total_pages;
  END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN public.books.draft_pages IS '미승인 페이지수 (사용자 제보)';
COMMENT ON COLUMN public.books.official_pages IS '승인된 페이지수 (관리자 승인, 가이드로 사용)';
COMMENT ON COLUMN public.books.draft_toc IS '미승인 목차 (사용자 제보)';
COMMENT ON COLUMN public.books.official_toc IS '승인된 목차 (관리자 승인, 가이드로 사용)';
COMMENT ON COLUMN public.books.draft_genre IS '미승인 장르 (사용자 제보)';
COMMENT ON COLUMN public.books.official_genre IS '승인된 장르 (관리자 승인, 가이드로 사용)';

-- =============================================
-- 2. group_books 테이블: snapshot 컬럼 추가
-- =============================================

DO $$
BEGIN
  -- Add pages_snapshot if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_books' AND column_name = 'pages_snapshot'
  ) THEN
    ALTER TABLE public.group_books ADD COLUMN pages_snapshot integer;
    COMMENT ON COLUMN public.group_books.pages_snapshot IS '그룹별 커스텀 페이지수 (사용자 입력값)';
  END IF;

  -- Add genre_snapshot if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_books' AND column_name = 'genre_snapshot'
  ) THEN
    ALTER TABLE public.group_books ADD COLUMN genre_snapshot text;
    COMMENT ON COLUMN public.group_books.genre_snapshot IS '그룹별 커스텀 장르 (사용자 입력값)';
  END IF;
END $$;

-- =============================================
-- 3. subscription_limits 수정 (free tier 무제한 그룹 참가)
-- =============================================

UPDATE public.subscription_limits
SET max_groups_created = -1  -- -1 = unlimited
WHERE tier = 'free';

COMMENT ON COLUMN public.subscription_limits.max_groups_created IS '생성 가능한 그룹 수 (-1 = 무제한). Free는 Solo 1개 + Social 무제한 참가 가능';

-- =============================================
-- 4. RLS 정책 재생성 (group_books)
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Members can add books in active groups" ON public.group_books;
DROP POLICY IF EXISTS "Everyone can view group books" ON public.group_books;
DROP POLICY IF EXISTS "Admins can update group books" ON public.group_books;
DROP POLICY IF EXISTS "Admins can delete group books" ON public.group_books;

-- Recreate policies
CREATE POLICY "Everyone can view group books"
  ON public.group_books FOR SELECT
  USING (true);

CREATE POLICY "Members can add books in active groups"
  ON public.group_books FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_books.group_id
      AND g.status = 'active'
      AND can_add_book_to_group(auth.uid(), g.id)
    )
  );

CREATE POLICY "Admins can update group books"
  ON public.group_books FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
      AND gm.left_at IS NULL
    )
  );

CREATE POLICY "Admins can delete group books"
  ON public.group_books FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
      AND gm.left_at IS NULL
    )
  );

-- =============================================
-- 5. can_add_book_to_group 함수 재생성 (최신 버전)
-- =============================================

CREATE OR REPLACE FUNCTION public.can_add_book_to_group(p_user_id uuid, p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier text;
  v_group_type text;
  v_group_status text;
  v_max_books integer;
  v_current_count integer;
BEGIN
  -- Get group info
  SELECT group_type, status INTO v_group_type, v_group_status
  FROM public.groups WHERE id = p_group_id;

  -- Group must be active
  IF v_group_status != 'active' THEN
    RETURN false;
  END IF;

  -- Get user tier
  SELECT subscription_tier INTO v_tier FROM public.users WHERE id = p_user_id;

  -- Solo groups: anyone (admin) can add books
  IF v_group_type = 'solo' THEN
    RETURN true;
  END IF;

  -- Social groups: only premium can add books
  IF v_tier NOT IN ('premium', 'admin') THEN
    RETURN false;
  END IF;

  -- Check book limit
  SELECT max_books_per_group INTO v_max_books
  FROM public.subscription_limits WHERE tier = v_tier;

  -- -1 means unlimited
  IF v_max_books = -1 THEN
    RETURN true;
  END IF;

  -- Count current books
  SELECT COUNT(*) INTO v_current_count
  FROM public.group_books
  WHERE group_id = p_group_id
    AND status IN ('reading', 'done');

  RETURN v_current_count < v_max_books;
END;
$$;
