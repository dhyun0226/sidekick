-- =====================================================
-- 구독 등급 시스템 통합 스키마
-- =====================================================
-- 이 스크립트는 무료/프리미엄 구독 등급 시스템을 구현합니다.
--
-- 주요 기능:
-- 1. users 테이블에 subscription_tier 컬럼 추가
-- 2. subscription_limits 테이블로 tier별 제한 정의
-- 3. 그룹 생성/책 추가 제한 검사 함수
-- 4. RLS 정책으로 tier 기반 접근 제어
-- =====================================================

-- 1. users 테이블에 subscription_tier 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT
CHECK (subscription_tier IN ('free', 'premium', 'admin'))
DEFAULT 'free' NOT NULL;

-- 인덱스 생성 (빠른 tier 조회)
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);

-- 기존 사용자 tier 설정 (NULL → 'free')
UPDATE public.users
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL;

-- 2. 구독 제한 설정 테이블
CREATE TABLE IF NOT EXISTS public.subscription_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'premium', 'admin')),
  max_groups_created INTEGER NOT NULL, -- -1 = 무제한
  max_books_per_group INTEGER NOT NULL, -- -1 = 무제한
  has_statistics_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제한 데이터 삽입
INSERT INTO public.subscription_limits (tier, max_groups_created, max_books_per_group, has_statistics_access) VALUES
  ('free', 2, 10, false),
  ('premium', -1, -1, true),  -- -1 = 무제한
  ('admin', -1, -1, true)
ON CONFLICT (tier) DO NOTHING;

-- RLS 활성화 (모든 사용자가 제한 정보 조회 가능)
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view subscription limits"
  ON public.subscription_limits FOR SELECT
  USING (true);

-- 3. 그룹 생성 제한 검사 함수
CREATE OR REPLACE FUNCTION can_create_group(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max_groups INTEGER;
  v_current_count INTEGER;
BEGIN
  -- 사용자의 구독 등급 조회
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- Admin은 무조건 허용
  IF v_tier = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 해당 tier의 최대 그룹 수 조회
  SELECT max_groups_created INTO v_max_groups
  FROM public.subscription_limits
  WHERE tier = v_tier;

  -- 무제한(-1)이면 허용
  IF v_max_groups = -1 THEN
    RETURN TRUE;
  END IF;

  -- 현재 생성한 그룹 수 카운트
  SELECT COUNT(*) INTO v_current_count
  FROM public.groups
  WHERE created_by = p_user_id;

  -- 제한 미만이면 허용
  RETURN v_current_count < v_max_groups;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 책 추가 제한 검사 함수
CREATE OR REPLACE FUNCTION can_add_book_to_group(p_user_id UUID, p_group_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_max_books INTEGER;
  v_current_count INTEGER;
BEGIN
  -- 사용자의 구독 등급 조회
  SELECT subscription_tier INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  -- Admin은 무조건 허용
  IF v_tier = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 해당 tier의 그룹당 최대 책 수 조회
  SELECT max_books_per_group INTO v_max_books
  FROM public.subscription_limits
  WHERE tier = v_tier;

  -- 무제한(-1)이면 허용
  IF v_max_books = -1 THEN
    RETURN TRUE;
  END IF;

  -- 그룹에 현재 있는 책 수 카운트
  SELECT COUNT(*) INTO v_current_count
  FROM public.group_books
  WHERE group_id = p_group_id;

  -- 제한 미만이면 허용
  RETURN v_current_count < v_max_books;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 사용자 구독 현황 조회 함수
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

-- 6. RLS 정책 업데이트: 그룹 생성 제한 적용
DROP POLICY IF EXISTS "Authenticated users can create groups." ON public.groups;

CREATE POLICY "Users can create groups within tier limit"
  ON public.groups FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
    AND can_create_group(auth.uid())
  );

-- 7. RLS 정책 업데이트: 책 추가 제한 적용
DROP POLICY IF EXISTS "Group members can add books." ON public.group_books;

CREATE POLICY "Group members can add books within tier limit"
  ON public.group_books FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
        AND gm.user_id = auth.uid()
    )
    AND can_add_book_to_group(auth.uid(), group_books.group_id)
  );

-- =====================================================
-- 완료!
-- =====================================================
-- 실행 방법:
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 메뉴 선택
-- 3. 이 파일 내용 붙여넣기
-- 4. Run 버튼 클릭
--
-- 확인 방법:
-- SELECT * FROM subscription_limits;
-- SELECT can_create_group('your-user-uuid');
-- =====================================================
