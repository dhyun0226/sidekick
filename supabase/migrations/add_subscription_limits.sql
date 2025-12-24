/**
 * 구독 제한 시스템 추가 마이그레이션
 *
 * 주의: subscription_tier 컬럼이 이미 users 테이블에 있다고 가정
 *
 * 실행 방법:
 * 1. Supabase Dashboard → SQL Editor
 * 2. 이 파일 내용 복사 → 붙여넣기 → Run
 */

-- ============================================
-- 1. 구독 제한 설정 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_limits (
  tier TEXT PRIMARY KEY,
  max_groups_created INTEGER NOT NULL,
  max_books_per_group INTEGER NOT NULL,
  has_statistics_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 데이터 삽입
INSERT INTO public.subscription_limits VALUES
  ('free', 2, 10, false),
  ('premium', -1, -1, true),
  ('admin', -1, -1, true)
ON CONFLICT (tier) DO NOTHING;

-- RLS 활성화
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능한 정책
DROP POLICY IF EXISTS "Anyone can view limits" ON public.subscription_limits;
CREATE POLICY "Anyone can view limits"
  ON public.subscription_limits
  FOR SELECT
  USING (true);

-- ============================================
-- 2. 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_subscription_tier
  ON public.users(subscription_tier);

-- ============================================
-- 3. 그룹 생성 제한 검사 함수
-- ============================================

CREATE OR REPLACE FUNCTION can_create_group(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max_groups INTEGER;
  v_current_count INTEGER;
BEGIN
  -- 사용자 등급 가져오기
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- 등급별 최대 그룹 수 가져오기
  SELECT max_groups_created INTO v_max_groups
  FROM public.subscription_limits
  WHERE tier = v_tier;

  -- 무제한이면 true 반환
  IF v_max_groups = -1 THEN
    RETURN TRUE;
  END IF;

  -- 현재 생성한 그룹 수 카운트
  SELECT COUNT(*) INTO v_current_count
  FROM public.groups
  WHERE created_by = p_user_id;

  -- 제한보다 적으면 true
  RETURN v_current_count < v_max_groups;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 책 추가 제한 검사 함수
-- ============================================

CREATE OR REPLACE FUNCTION can_add_book_to_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max_books INTEGER;
  v_current_count INTEGER;
BEGIN
  -- 사용자 등급 가져오기
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- 등급별 최대 책 수 가져오기
  SELECT max_books_per_group INTO v_max_books
  FROM public.subscription_limits
  WHERE tier = v_tier;

  -- 무제한이면 true 반환
  IF v_max_books = -1 THEN
    RETURN TRUE;
  END IF;

  -- 현재 그룹의 책 수 카운트
  SELECT COUNT(*) INTO v_current_count
  FROM public.group_books
  WHERE group_id = p_group_id;

  -- 제한보다 적으면 true
  RETURN v_current_count < v_max_books;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 사용자 구독 현황 조회 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_user_subscription_usage(p_user_id UUID)
RETURNS TABLE (
  tier TEXT,
  groups_created INTEGER,
  max_groups INTEGER,
  can_create_group BOOLEAN,
  has_statistics_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.subscription_tier,
    (SELECT COUNT(*)::INTEGER FROM public.groups WHERE created_by = p_user_id),
    sl.max_groups_created,
    can_create_group(p_user_id),
    sl.has_statistics_access
  FROM public.users u
  JOIN public.subscription_limits sl ON u.subscription_tier = sl.tier
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RLS 정책 업데이트 - 그룹 생성 제한 적용
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can create groups." ON public.groups;
DROP POLICY IF EXISTS "Users can create groups within tier limit" ON public.groups;

-- 새 정책: 등급 제한 내에서만 그룹 생성 가능
CREATE POLICY "Users can create groups within tier limit"
  ON public.groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
    AND can_create_group(auth.uid())
  );

-- ============================================
-- 7. RLS 정책 업데이트 - 책 추가 제한 적용
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Group members can add books." ON public.group_books;
DROP POLICY IF EXISTS "Group members can add books within tier limit" ON public.group_books;

-- 새 정책: 등급 제한 내에서만 책 추가 가능
CREATE POLICY "Group members can add books within tier limit"
  ON public.group_books
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
        AND gm.user_id = auth.uid()
    )
    AND can_add_book_to_group(auth.uid(), group_books.group_id)
  );

-- ============================================
-- 완료!
-- ============================================

-- 확인: 테이블과 함수가 제대로 생성되었는지 체크
SELECT 'subscription_limits 테이블' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_limits')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'can_create_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_create_group')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'can_add_book_to_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_add_book_to_group')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'get_user_subscription_usage 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_subscription_usage')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status;
