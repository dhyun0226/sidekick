-- =====================================================
-- Subscription Plans 테이블 및 데이터 추가
-- =====================================================

-- 1. subscription_plans 테이블 생성
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  price INTEGER NOT NULL, -- 원화 단위
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. payments 테이블 생성 (아직 없는 경우)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  order_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_key TEXT,
  payment_method TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. subscriptions 테이블 생성 (아직 없는 경우)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  payment_id UUID REFERENCES public.payments(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 기본 플랜 데이터 삽입
INSERT INTO public.subscription_plans (name, display_name, price, billing_period, is_active, features) VALUES
  ('premium_monthly', '프리미엄 월간', 9900, 'monthly', true, '{"max_groups": -1, "max_books": -1, "statistics": true, "priority_support": true}'::jsonb),
  ('premium_yearly', '프리미엄 연간', 99000, 'yearly', true, '{"max_groups": -1, "max_books": -1, "statistics": true, "priority_support": true, "discount": "17%"}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price = EXCLUDED.price,
  billing_period = EXCLUDED.billing_period,
  is_active = EXCLUDED.is_active,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON public.subscription_plans(name);

-- =====================================================
-- 완료!
-- =====================================================
