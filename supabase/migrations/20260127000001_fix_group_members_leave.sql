-- Fix group_members infinite recursion when leaving groups
-- Admin 정책이 users 테이블을 참조하면서 무한 재귀 발생
-- 해결: Admin 작업은 서버 API (Service Role)에서만 수행

-- =====================================================
-- 문제가 되는 Admin 정책만 삭제
-- =====================================================

-- Admins can view all group members (users 테이블 참조로 무한 재귀 발생)
DROP POLICY IF EXISTS "Admins can view all group members" ON public.group_members;

-- Admins can manage members (users 테이블 참조로 무한 재귀 발생)
DROP POLICY IF EXISTS "Admins can manage members." ON public.group_members;

-- =====================================================
-- 참고:
-- =====================================================
-- 나머지 정책들은 정상 작동하므로 그대로 유지
-- 관리자 작업은 /server/api/admin/ 에서 Service Role로 수행
