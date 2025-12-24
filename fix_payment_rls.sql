-- RLS 정책 추가: INSERT/UPDATE 권한
-- 기존 정책은 SELECT만 허용하고 있어서 결제 생성이 안됨

-- payments 테이블: 본인 결제 생성 가능
CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- payments 테이블: 본인 결제 수정 가능 (서버에서 상태 업데이트용)
CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- subscriptions 테이블: 본인 구독 생성 가능
CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscriptions 테이블: 본인 구독 수정 가능
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
