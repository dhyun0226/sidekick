-- Fix Infinite Recursion in Admin RLS Policies
-- users 테이블의 무한 재귀 정책 제거 및 기본 정책 복구

-- =====================================================
-- 1. Users 테이블 - 무한 재귀 정책 제거
-- =====================================================

-- 문제가 되는 정책들 삭제
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- 관리자는 서버 API를 통해서만 다른 사용자 정보를 조회/수정하도록 변경
-- 클라이언트에서는 기본 정책으로 모든 사용자 프로필 조회 가능

-- =====================================================
-- 2. Users 테이블 기본 정책 복구 (혹시 삭제되었을 경우 대비)
-- =====================================================

-- 기존 정책이 없으면 생성
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 3. 다른 테이블의 Admin 정책 수정
-- =====================================================

-- 다른 테이블들의 admin 정책은 users 테이블을 참조하지만,
-- 자기 자신(auth.uid())만 조회하므로 재귀가 발생하지 않음
-- 따라서 그대로 유지
