-- 기존 테이블 삭제 (이미 있으면)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- 구독 플랜 테이블 (개선)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'premium_monthly', 'premium_yearly'
  display_name TEXT NOT NULL, -- '프리미엄 월간', '프리미엄 연간'
  tier TEXT NOT NULL, -- 'premium' (미래에 'pro', 'enterprise' 등 추가 가능)
  billing_period TEXT NOT NULL, -- 'monthly', 'yearly'
  billing_period_months INTEGER NOT NULL, -- 1 (월간), 12 (연간)
  price INTEGER NOT NULL, -- 월 2500원, 년 19000원
  discount_percentage INTEGER DEFAULT 0, -- 연간의 경우 할인율 표시용
  features JSONB, -- 제공 기능 목록
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 구독 정보 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  billing_key TEXT, -- 토스 빌링키 (자동결제용)
  cancelled_at TIMESTAMPTZ, -- 취소한 날짜
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 내역 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES subscription_plans(id), -- 어떤 플랜을 구매했는지
  order_id TEXT UNIQUE NOT NULL, -- 주문 고유 ID
  payment_key TEXT UNIQUE, -- 토스 payment key
  amount INTEGER NOT NULL,
  method TEXT, -- 'card', 'transfer', 'easy_payment'
  status TEXT NOT NULL, -- 'pending', 'done', 'cancelled', 'failed'
  approved_at TIMESTAMPTZ,
  toss_response JSONB, -- 토스 응답 전체 저장
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);

-- RLS 정책
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 플랜 조회 가능
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- 본인 구독만 조회 가능
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- 기본 플랜 데이터 삽입
INSERT INTO subscription_plans (name, display_name, tier, billing_period, billing_period_months, price, discount_percentage, features) VALUES
  (
    'premium_monthly',
    '프리미엄 월간',
    'premium',
    'monthly',
    1,
    2500,
    0,
    '["무제한 그룹 생성", "무제한 책 추가", "고급 통계", "우선 지원"]'::jsonb
  ),
  (
    'premium_yearly',
    '프리미엄 연간',
    'premium',
    'yearly',
    12,
    19000,
    37,
    '["무제한 그룹 생성", "무제한 책 추가", "고급 통계", "우선 지원", "연간 37% 할인"]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- 구독 만료 체크 함수 (선택사항 - Cron으로 실행)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  -- 만료된 구독 상태 변경
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND end_date < NOW()
    AND auto_renew = false;

  -- 만료된 구독의 사용자를 무료 등급으로 변경
  UPDATE users
  SET subscription_tier = 'free'
  WHERE id IN (
    SELECT user_id
    FROM subscriptions
    WHERE status = 'expired'
      AND updated_at > NOW() - INTERVAL '1 minute'
  );
END;
$$ LANGUAGE plpgsql;
