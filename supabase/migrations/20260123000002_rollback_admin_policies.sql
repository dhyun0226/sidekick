-- Rollback Admin RLS Policies
-- 첫 번째 마이그레이션으로 인한 문제 완전 롤백

-- =====================================================
-- 1. Users 테이블 - 잘못된 정책 완전 제거 및 원상복구
-- =====================================================

-- 제가 추가한 잘못된 정책들 삭제
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- 원래 정책 확실히 복구
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 2. Books 테이블 - Admin 정책 제거 (원상복구)
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete books." ON public.books;
-- 원래는 admin delete 정책이 없었으므로 재생성하지 않음

-- =====================================================
-- 3. Groups 테이블 - Admin 정책 제거 (원상복구)
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
-- 원래는 "Everyone can view groups" 정책만 있었음 (이미 존재)

-- =====================================================
-- 4. Group Members 테이블 - Admin 정책 제거
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all group members" ON public.group_members;

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
-- 결론: 관리자는 Service Role 클라이언트를 통해서만 모든 데이터 접근
-- 클라이언트에서는 RLS를 통해 일반 사용자와 동일하게 제한됨
-- =====================================================
