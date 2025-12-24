-- 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- 'premium'
  display_name TEXT NOT NULL, -- '프리미엄'
  price INTEGER NOT NULL, -- 월 가격 (원)
  features JSONB, -- 제공 기능 목록
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 구독 정보 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'cancelled', 'expired'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  billing_key TEXT, -- 토스 빌링키 (자동결제용)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 내역 테이블
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS 정책
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 플랜 조회 가능
CREATE POLICY "Anyone can view plans" ON subscription_plans
  FOR SELECT USING (true);

-- 본인 구독만 조회 가능
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- 기본 플랜 데이터 삽입
INSERT INTO subscription_plans (name, display_name, price, features) VALUES
  ('premium', '프리미엄', 9900, '["무제한 그룹 생성", "무제한 책 추가", "고급 통계", "우선 지원"]'::jsonb)
ON CONFLICT DO NOTHING;
