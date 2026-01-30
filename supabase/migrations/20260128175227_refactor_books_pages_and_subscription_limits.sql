-- =============================================
-- Refactor Books Pages and Subscription Limits
-- =============================================
--
-- 변경 사항:
-- 1. books 테이블: total_pages → draft_pages/official_pages 분리
-- 2. subscription_limits: free tier 무제한 그룹 참가 허용
--
-- ⚠️ 주의: group_books 스냅샷 관련은 이미 적용됨
-- ⚠️ 기존 total_pages 데이터는 draft_pages로 마이그레이션됨
-- =============================================

-- =============================================
-- 1. books 테이블 수정
-- =============================================

-- 1.1 새 컬럼 추가
ALTER TABLE public.books
  ADD COLUMN draft_pages integer,
  ADD COLUMN official_pages integer;

-- 1.2 기존 데이터 마이그레이션 (total_pages → draft_pages)
UPDATE public.books
SET draft_pages = total_pages
WHERE total_pages IS NOT NULL;

-- 1.3 기존 total_pages 컬럼 삭제
ALTER TABLE public.books
  DROP COLUMN total_pages;

-- 1.4 컬럼 설명 추가
COMMENT ON COLUMN public.books.draft_pages IS '미승인 페이지수 (사용자 제보)';
COMMENT ON COLUMN public.books.official_pages IS '승인된 페이지수 (관리자 승인, 가이드로 사용)';
COMMENT ON COLUMN public.books.draft_toc IS '미승인 목차 (사용자 제보)';
COMMENT ON COLUMN public.books.official_toc IS '승인된 목차 (관리자 승인, 가이드로 사용)';
COMMENT ON COLUMN public.books.draft_genre IS '미승인 장르 (사용자 제보)';
COMMENT ON COLUMN public.books.official_genre IS '승인된 장르 (관리자 승인, 가이드로 사용)';

-- =============================================
-- 2. subscription_limits 수정 (free tier 무제한 그룹 참가)
-- =============================================

UPDATE public.subscription_limits
SET max_groups_created = -1  -- -1 = unlimited
WHERE tier = 'free';

COMMENT ON COLUMN public.subscription_limits.max_groups_created IS '생성 가능한 그룹 수 (-1 = 무제한). Free는 Solo 1개 + Social 무제한 참가 가능';
