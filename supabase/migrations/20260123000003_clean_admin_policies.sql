-- Clean Admin Policies - 올바른 방법
-- RLS 정책은 간단하게, 관리자는 서버 API로만 처리

-- =====================================================
-- 1. Users 테이블 - 무한 재귀 정책 제거 및 기본 정책만 유지
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- 기본 정책만 유지
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 2. Books 테이블 - Admin 정책 제거, 원래 정책으로 복구
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Books are viewable by everyone." ON public.books;
DROP POLICY IF EXISTS "Authenticated users can add books." ON public.books;
DROP POLICY IF EXISTS "Authenticated users can update books." ON public.books;
DROP POLICY IF EXISTS "Admins can delete books." ON public.books;

-- 간단한 정책만 생성
CREATE POLICY "Books are viewable by everyone."
  ON public.books FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add books."
  ON public.books FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update books."
  ON public.books FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 삭제는 서버 API에서만 (Service Role)

-- =====================================================
-- 3. Groups 테이블 - Admin 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
-- "Everyone can view groups." 정책은 이미 존재하므로 그대로 유지

-- =====================================================
-- 4. Group Members 테이블 - Admin 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all group members" ON public.group_members;
-- "Group members viewable by everyone." 정책은 이미 존재하므로 그대로 유지

-- =====================================================
-- 5. Subscriptions 테이블 - Admin 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;

-- =====================================================
-- 6. Payments 테이블 - Admin 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;

-- =====================================================
-- 7. Subscription Limits 테이블 - Admin 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "Admins can view subscription limits" ON public.subscription_limits;
DROP POLICY IF EXISTS "Admins can update subscription limits" ON public.subscription_limits;

-- =====================================================
-- 결론
-- =====================================================
--
-- RLS 정책: 간단하고 명확하게 유지
-- - 모든 사용자가 조회 가능한 것은 USING (true)
-- - 본인만 수정 가능한 것은 USING (auth.uid() = id)
--
-- 관리자 기능: 서버 API + Service Role로만 처리
-- - /api/admin/* 경로의 API들
-- - serverSupabaseServiceRole(event)로 RLS 우회
-- - API 레벨에서 subscription_tier 체크
--
-- 장점:
-- 1. 무한 재귀 문제 없음
-- 2. 정책이 간단하고 이해하기 쉬움
-- 3. 관리자 권한이 서버에서만 처리되어 안전함
