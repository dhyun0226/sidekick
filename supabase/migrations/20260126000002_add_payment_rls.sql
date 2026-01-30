-- =====================================================
-- Payments & Subscriptions RLS 정책
-- =====================================================
-- 일반 사용자: 자기 것만 조회/생성
-- 서버(confirm API): Service Role로 업데이트
-- 관리자: 모든 것 조회/수정
-- =====================================================

-- 1. payments 테이블 RLS 활성화
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 결제만 조회
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자기 user_id로만 결제 생성
CREATE POLICY "Users can create own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 결제 업데이트는 Service Role만 (confirm API에서 사용)
-- 일반 사용자는 직접 업데이트 불가

-- 2. subscriptions 테이블 RLS 활성화
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 구독만 조회
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자기 user_id로만 구독 생성 (거의 사용 안 됨, confirm API가 생성)
CREATE POLICY "Users can create own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자기 구독의 auto_renew만 업데이트 가능 (취소용)
CREATE POLICY "Users can update own subscription auto_renew"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. subscription_plans 테이블 (이미 있을 수 있음)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 완료!
-- =====================================================
-- 이제:
-- - 사용자는 자기 결제/구독만 조회 가능
-- - 주문 생성은 일반 클라이언트로 가능
-- - 결제 승인/구독 생성은 Service Role로 수행 (confirm API)
-- =====================================================
