/**
 * 구독 시스템 - DB 중심 버전 (최종 수정본)
 *
 * 🔧 정확한 순서로 삭제 및 재생성:
 *   1. RLS 정책 삭제 (함수에 의존)
 *   2. 함수 삭제
 *   3. 함수 재생성
 *   4. RLS 정책 재생성
 *
 * 🎯 핵심: subscription_limits 테이블만 수정하면 모든 제한이 자동 반영됨
 */

-- ============================================
-- 1. RLS 정책 먼저 삭제 (함수에 의존하므로)
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create groups." ON public.groups;
DROP POLICY IF EXISTS "Users can create groups within tier limit" ON public.groups;

DROP POLICY IF EXISTS "Users can join groups." ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups within tier limit" ON public.group_members;

DROP POLICY IF EXISTS "Group members can add books." ON public.group_books;
DROP POLICY IF EXISTS "Group members can add books within tier limit" ON public.group_books;
DROP POLICY IF EXISTS "Group members can add books based on tier" ON public.group_books;

-- ============================================
-- 2. 이제 함수 삭제 가능
-- ============================================

DROP FUNCTION IF EXISTS get_user_subscription_usage(UUID);
DROP FUNCTION IF EXISTS can_join_group(UUID, UUID);
DROP FUNCTION IF EXISTS can_create_group(UUID);
DROP FUNCTION IF EXISTS can_add_book_to_group(UUID, UUID);

-- ============================================
-- 3. 그룹 참가 제한 검사 함수 (DB 기반)
-- ============================================

CREATE FUNCTION can_join_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max_groups INTEGER;
  v_current_group_count INTEGER;
BEGIN
  -- 사용자 등급 가져오기
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- ⭐ subscription_limits 테이블에서 최대 그룹 수 읽기
  SELECT max_groups_created INTO v_max_groups
  FROM public.subscription_limits
  WHERE tier = v_tier;

  -- 무제한이면 true (-1 = unlimited)
  IF v_max_groups = -1 THEN
    RETURN TRUE;
  END IF;

  -- 현재 참가 중인 그룹 수 확인
  SELECT COUNT(*) INTO v_current_group_count
  FROM public.group_members
  WHERE user_id = p_user_id;

  -- 제한보다 적으면 true
  RETURN v_current_group_count < v_max_groups;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 그룹 생성 제한 검사 함수 (DB 기반)
-- ============================================

CREATE FUNCTION can_create_group(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max_groups INTEGER;
  v_current_group_count INTEGER;
BEGIN
  -- 사용자 등급 가져오기
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- ⭐ subscription_limits 테이블에서 최대 그룹 수 읽기
  SELECT max_groups_created INTO v_max_groups
  FROM public.subscription_limits
  WHERE tier = v_tier;

  -- 무제한이면 true
  IF v_max_groups = -1 THEN
    RETURN TRUE;
  END IF;

  -- 현재 참가 중인 모든 그룹 수 확인
  SELECT COUNT(*) INTO v_current_group_count
  FROM public.group_members
  WHERE user_id = p_user_id;

  -- 제한보다 적으면 true
  RETURN v_current_group_count < v_max_groups;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 책 추가 제한 검사 함수 (DB 기반) ⭐
-- ============================================

CREATE FUNCTION can_add_book_to_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_tier TEXT;
  v_max_books INTEGER;
  v_current_books INTEGER;
BEGIN
  -- 사용자 등급 확인
  SELECT subscription_tier INTO v_user_tier
  FROM public.users
  WHERE id = p_user_id;

  -- ⭐ subscription_limits 테이블에서 최대 책 수 읽기
  SELECT max_books_per_group INTO v_max_books
  FROM public.subscription_limits
  WHERE tier = v_user_tier;

  -- 무제한이면 true (-1 = unlimited)
  IF v_max_books = -1 THEN
    RETURN TRUE;
  END IF;

  -- 현재 그룹의 책 수 확인
  SELECT COUNT(*) INTO v_current_books
  FROM public.group_books
  WHERE group_id = p_group_id;

  -- ⭐ 제한보다 적으면 true (하드코딩 없음!)
  RETURN v_current_books < v_max_books;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 사용자 구독 현황 조회 함수 (DB 기반)
-- ============================================

CREATE FUNCTION get_user_subscription_usage(p_user_id UUID)
RETURNS TABLE (
  tier TEXT,
  groups_joined INTEGER,
  max_groups INTEGER,
  max_books_per_group INTEGER,
  can_join_more_groups BOOLEAN,
  has_statistics_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.subscription_tier,
    (SELECT COUNT(*)::INTEGER FROM public.group_members WHERE user_id = p_user_id),
    sl.max_groups_created,
    sl.max_books_per_group,  -- ⭐ 책 제한도 반환
    CASE
      WHEN sl.max_groups_created = -1 THEN TRUE
      ELSE (SELECT COUNT(*) FROM public.group_members WHERE user_id = p_user_id) < sl.max_groups_created
    END,
    sl.has_statistics_access
  FROM public.users u
  JOIN public.subscription_limits sl ON u.subscription_tier = sl.tier
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. RLS 정책 재생성 - 그룹 생성
-- ============================================

CREATE POLICY "Users can create groups within tier limit"
  ON public.groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
    AND can_create_group(auth.uid())
  );

-- ============================================
-- 8. RLS 정책 재생성 - 그룹 참가
-- ============================================

CREATE POLICY "Users can join groups within tier limit"
  ON public.group_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
    AND can_join_group(auth.uid(), group_id)
  );

-- ============================================
-- 9. RLS 정책 재생성 - 책 추가
-- ============================================

CREATE POLICY "Group members can add books based on tier"
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
-- 10. subscription_limits 기본값 설정
-- ============================================

INSERT INTO public.subscription_limits (tier, max_groups_created, max_books_per_group, has_statistics_access)
VALUES
  ('free', 1, 10, false),
  ('premium', -1, -1, true),
  ('admin', -1, -1, true)
ON CONFLICT (tier)
DO UPDATE SET
  max_groups_created = EXCLUDED.max_groups_created,
  max_books_per_group = EXCLUDED.max_books_per_group,
  has_statistics_access = EXCLUDED.has_statistics_access;

-- ============================================
-- 완료! 설치 확인
-- ============================================

SELECT '======================================' as "";
SELECT '    ✅ 구독 시스템 설치 완료!        ' as "";
SELECT '======================================' as "";
SELECT '' as "";

SELECT '=== 함수 생성 확인 ===' as info;

SELECT 'can_join_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_join_group')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'can_create_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_create_group')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'can_add_book_to_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_add_book_to_group')
       THEN '✅ 생성됨 (DB 기반)' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'get_user_subscription_usage 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_subscription_usage')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'subscription_limits 데이터' as check_item,
       CASE WHEN (SELECT COUNT(*) FROM public.subscription_limits) >= 3
       THEN '✅ 설정됨 (3개 tier)' ELSE '❌ 실패' END as status;

SELECT '' as "";
SELECT '=== 현재 구독 제한 설정 ===' as info;

SELECT
  tier as "등급",
  max_groups_created as "최대 그룹",
  max_books_per_group as "그룹당 최대 책",
  has_statistics_access as "통계 접근"
FROM public.subscription_limits
ORDER BY
  CASE tier
    WHEN 'free' THEN 1
    WHEN 'premium' THEN 2
    WHEN 'admin' THEN 3
  END;

SELECT '' as "";
SELECT '======================================' as "";
SELECT '  📝 제한 변경 방법                   ' as "";
SELECT '======================================' as "";
SELECT 'UPDATE subscription_limits' as "책 제한 변경 예시";
SELECT 'SET max_books_per_group = 5' as "";
SELECT 'WHERE tier = ''free'';' as "";
SELECT '' as "";
SELECT 'UPDATE subscription_limits' as "그룹 제한 변경 예시";
SELECT 'SET max_groups_created = 2' as "";
SELECT 'WHERE tier = ''free'';' as "";
