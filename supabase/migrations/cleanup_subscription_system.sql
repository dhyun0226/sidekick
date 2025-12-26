/**
 * 구독 시스템 완전 삭제 스크립트
 *
 * 주의: 이 스크립트는 구독 시스템 관련 모든 설정을 삭제합니다.
 * 실행 전 백업을 권장합니다.
 *
 * 실행 방법:
 * 1. Supabase Dashboard → SQL Editor
 * 2. 이 파일 내용 복사 → 붙여넣기 → Run
 */

-- ============================================
-- 1. Cron Job 삭제
-- ============================================

SELECT cron.unschedule('expire-subscriptions');

-- ============================================
-- 2. RLS 정책 삭제
-- ============================================

DROP POLICY IF EXISTS "Users can create groups within tier limit" ON public.groups;
DROP POLICY IF EXISTS "Group members can add books within tier limit" ON public.group_books;
DROP POLICY IF EXISTS "Anyone can view limits" ON public.subscription_limits;

-- ============================================
-- 3. 함수 삭제
-- ============================================

DROP FUNCTION IF EXISTS expire_subscriptions();
DROP FUNCTION IF EXISTS get_user_subscription_usage(UUID);
DROP FUNCTION IF EXISTS can_add_book_to_group(UUID, UUID);
DROP FUNCTION IF EXISTS can_create_group(UUID);

-- ============================================
-- 4. 테이블 삭제 (선택적)
-- ============================================

-- 주의: 이 테이블을 삭제하면 구독 제한 설정이 모두 사라집니다.
-- 필요한 경우에만 주석을 제거하고 실행하세요.
-- DROP TABLE IF EXISTS public.subscription_limits;

-- ============================================
-- 완료!
-- ============================================

SELECT 'Subscription system cleanup completed!' as status;
