-- Fix Admin RLS Policies
-- 관리자가 모든 테이블에 접근할 수 있도록 RLS 정책 수정

-- =====================================================
-- 1. Books 테이블 - 관리자 전체 권한 추가
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Books are viewable by everyone." ON public.books;
DROP POLICY IF EXISTS "Authenticated users can add books." ON public.books;
DROP POLICY IF EXISTS "Authenticated users can update books." ON public.books;

-- 새 정책 생성
-- 1.1 조회: 모두 가능
CREATE POLICY "Books are viewable by everyone."
  ON public.books FOR SELECT
  USING (true);

-- 1.2 삽입: 인증된 사용자
CREATE POLICY "Authenticated users can add books."
  ON public.books FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 1.3 수정: 인증된 사용자 OR 관리자
CREATE POLICY "Authenticated users can update books."
  ON public.books FOR UPDATE
  USING (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- 1.4 삭제: 관리자만 가능
CREATE POLICY "Admins can delete books."
  ON public.books FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- =====================================================
-- 2. Users 테이블 - 관리자 권한 추가
-- =====================================================

-- 기존 정책 확인 및 관리자 정책 추가
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- 2.1 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.subscription_tier = 'admin'
    )
  );

-- 2.2 관리자는 모든 사용자 수정 가능
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.subscription_tier = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.subscription_tier = 'admin'
    )
  );

-- =====================================================
-- 3. Groups 테이블 - 관리자 조회 권한 추가
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;

-- 3.1 관리자는 모든 그룹 조회 가능
CREATE POLICY "Admins can view all groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- =====================================================
-- 4. Group Members 테이블 - 관리자 조회 권한 추가
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all group members" ON public.group_members;

-- 4.1 관리자는 모든 그룹 멤버 조회 가능
CREATE POLICY "Admins can view all group members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- =====================================================
-- 5. Subscriptions 테이블 - 관리자 권한 추가
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;

-- 5.1 관리자는 모든 구독 조회 가능
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- 5.2 관리자는 모든 구독 수정 가능
CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- =====================================================
-- 6. Payments 테이블 - 관리자 권한 추가
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;

-- 6.1 관리자는 모든 결제 조회 가능
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- 6.2 관리자는 모든 결제 수정 가능
CREATE POLICY "Admins can update all payments"
  ON public.payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- =====================================================
-- 7. Subscription Limits 테이블 - 관리자 권한 추가
-- =====================================================

DROP POLICY IF EXISTS "Admins can view subscription limits" ON public.subscription_limits;
DROP POLICY IF EXISTS "Admins can update subscription limits" ON public.subscription_limits;

-- 7.1 관리자는 구독 제한 조회 가능
CREATE POLICY "Admins can view subscription limits"
  ON public.subscription_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );

-- 7.2 관리자는 구독 제한 수정 가능
CREATE POLICY "Admins can update subscription limits"
  ON public.subscription_limits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND subscription_tier = 'admin'
    )
  );
