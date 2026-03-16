-- ============================================================
-- 운영 DB 마이그레이션: dev 스키마와 동기화
-- 생성일: 2026-03-13
-- ============================================================
-- 실행 전 반드시 백업하세요!
-- 순서: 컬럼 추가 → 데이터 마이그레이션 → 컬럼 삭제 → nullable 변경
-- ============================================================

BEGIN;

-- ============================================================
-- 1. books: total_pages → draft_pages + official_pages 분리
-- ============================================================
-- 새 컬럼 추가
ALTER TABLE books ADD COLUMN IF NOT EXISTS draft_pages integer;
ALTER TABLE books ADD COLUMN IF NOT EXISTS official_pages integer;

-- 기존 데이터 마이그레이션: total_pages 값을 official_pages로 복사
UPDATE books SET official_pages = total_pages WHERE total_pages IS NOT NULL;

-- 기존 컬럼 삭제
ALTER TABLE books DROP COLUMN IF EXISTS total_pages;


-- ============================================================
-- 2. group_books: genre → genre_snapshot 이름 변경 + 새 컬럼 추가
-- ============================================================
-- genre → genre_snapshot 이름 변경
ALTER TABLE group_books RENAME COLUMN genre TO genre_snapshot;

-- 새 컬럼 추가
ALTER TABLE group_books ADD COLUMN IF NOT EXISTS pages_snapshot integer;
ALTER TABLE group_books ADD COLUMN IF NOT EXISTS deleted_at timestamptz;


-- ============================================================
-- 3. groups: group_type, status 추가 + invite_code nullable 변경
-- ============================================================
-- 새 컬럼 추가 (기본값 포함)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'social';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- invite_code: NOT NULL → nullable로 변경, default 제거
ALTER TABLE groups ALTER COLUMN invite_code DROP NOT NULL;
ALTER TABLE groups ALTER COLUMN invite_code DROP DEFAULT;


-- ============================================================
-- 4. subscription_limits: updated_at 추가 + has_statistics_access NOT NULL
-- ============================================================
-- updated_at 컬럼 추가
ALTER TABLE subscription_limits ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- has_statistics_access: nullable → NOT NULL 변경
-- 먼저 NULL 값을 기본값으로 채운 후 NOT NULL 설정
UPDATE subscription_limits SET has_statistics_access = false WHERE has_statistics_access IS NULL;
ALTER TABLE subscription_limits ALTER COLUMN has_statistics_access SET NOT NULL;


-- ============================================================
-- 5. user_reading_progress: hidden 컬럼 추가
-- ============================================================
ALTER TABLE user_reading_progress ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;


-- ============================================================
-- 6. users: subscription_tier NOT NULL 변경
-- ============================================================
-- 먼저 NULL 값을 기본값으로 채운 후 NOT NULL 설정
UPDATE users SET subscription_tier = 'free' WHERE subscription_tier IS NULL;
ALTER TABLE users ALTER COLUMN subscription_tier SET NOT NULL;


COMMIT;
