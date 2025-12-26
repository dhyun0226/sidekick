/**
 * 구독 시스템 최종 업데이트
 *
 * 주요 변경사항:
 * 1. Free 유저: 그룹 1개만 참가 (생성 or 초대)
 * 2. Free 유저: 책 추가는 그룹이 10권 미만일 때만
 * 3. Free 유저: 책 보기는 개인 등급에 따라 (프론트엔드 필터)
 * 4. 개인 등급 기반 시스템 (그룹 등급 개념 없음)
 */

-- ============================================
-- 1. 그룹 참가 제한 검사 함수 (신규)
-- ============================================

CREATE OR REPLACE FUNCTION can_join_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_current_group_count INTEGER;
BEGIN
  -- 사용자 등급 가져오기
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- Admin은 무제한
  IF v_tier = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 현재 참가 중인 그룹 수 확인
  SELECT COUNT(*) INTO v_current_group_count
  FROM public.group_members
  WHERE user_id = p_user_id;

  -- Free 유저는 1개 그룹만
  IF v_tier = 'free' AND v_current_group_count >= 1 THEN
    RETURN FALSE;
  END IF;

  -- Premium은 무제한
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. 그룹 생성 제한 검사 함수 (수정)
-- ============================================

CREATE OR REPLACE FUNCTION can_create_group(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_current_group_count INTEGER;
BEGIN
  -- 사용자 등급 가져오기
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- Admin은 무제한
  IF v_tier = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 현재 참가 중인 모든 그룹 수 확인 (생성한 것 + 초대받은 것)
  SELECT COUNT(*) INTO v_current_group_count
  FROM public.group_members
  WHERE user_id = p_user_id;

  -- Free 유저는 이미 1개 그룹에 참가 중이면 생성 불가
  IF v_tier = 'free' AND v_current_group_count >= 1 THEN
    RETURN FALSE;
  END IF;

  -- Premium은 무제한
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. 책 추가 제한 검사 함수 (수정)
-- ============================================

CREATE OR REPLACE FUNCTION can_add_book_to_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_tier TEXT;
  v_current_books INTEGER;
BEGIN
  -- 사용자 등급 확인
  SELECT subscription_tier INTO v_user_tier
  FROM public.users
  WHERE id = p_user_id;

  -- Admin과 Premium은 무제한
  IF v_user_tier IN ('admin', 'premium') THEN
    RETURN TRUE;
  END IF;

  -- Free 유저: 그룹의 현재 책 수 확인
  SELECT COUNT(*) INTO v_current_books
  FROM public.group_books
  WHERE group_id = p_group_id;

  -- Free 유저는 그룹에 10권 미만일 때만 추가 가능
  RETURN v_current_books < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 사용자 구독 현황 조회 함수 (수정)
-- ============================================

CREATE OR REPLACE FUNCTION get_user_subscription_usage(p_user_id UUID)
RETURNS TABLE (
  tier TEXT,
  groups_joined INTEGER,
  max_groups INTEGER,
  can_join_more_groups BOOLEAN,
  has_statistics_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.subscription_tier,
    (SELECT COUNT(*)::INTEGER FROM public.group_members WHERE user_id = p_user_id),
    CASE
      WHEN u.subscription_tier = 'free' THEN 1
      ELSE -1
    END,
    CASE
      WHEN u.subscription_tier IN ('admin', 'premium') THEN TRUE
      WHEN u.subscription_tier = 'free' THEN
        (SELECT COUNT(*) FROM public.group_members WHERE user_id = p_user_id) < 1
    END,
    sl.has_statistics_access
  FROM public.users u
  JOIN public.subscription_limits sl ON u.subscription_tier = sl.tier
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RLS 정책 업데이트 - 그룹 생성 제한
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create groups." ON public.groups;
DROP POLICY IF EXISTS "Users can create groups within tier limit" ON public.groups;

CREATE POLICY "Users can create groups within tier limit"
  ON public.groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
    AND can_create_group(auth.uid())
  );

-- ============================================
-- 6. RLS 정책 업데이트 - 그룹 참가 제한
-- ============================================

DROP POLICY IF EXISTS "Users can join groups." ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups within tier limit" ON public.group_members;

CREATE POLICY "Users can join groups within tier limit"
  ON public.group_members
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
    AND can_join_group(auth.uid(), group_id)
  );

-- ============================================
-- 7. RLS 정책 업데이트 - 책 추가 제한
-- ============================================

DROP POLICY IF EXISTS "Group members can add books." ON public.group_books;
DROP POLICY IF EXISTS "Group members can add books within tier limit" ON public.group_books;
DROP POLICY IF EXISTS "Group members can add books based on tier" ON public.group_books;

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
-- 8. subscription_limits 테이블 업데이트
-- ============================================

-- max_groups_created 값 업데이트 (이제 "참가 가능한 그룹 수"를 의미)
UPDATE public.subscription_limits
SET max_groups_created = 1
WHERE tier = 'free';

UPDATE public.subscription_limits
SET max_groups_created = -1
WHERE tier IN ('premium', 'admin');

-- ============================================
-- 완료! 설치 확인
-- ============================================

SELECT 'can_join_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_join_group')
       THEN '✅ 생성됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'can_create_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_create_group')
       THEN '✅ 업데이트됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'can_add_book_to_group 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'can_add_book_to_group')
       THEN '✅ 업데이트됨' ELSE '❌ 실패' END as status
UNION ALL
SELECT 'get_user_subscription_usage 함수' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_subscription_usage')
       THEN '✅ 업데이트됨' ELSE '❌ 실패' END as status;
