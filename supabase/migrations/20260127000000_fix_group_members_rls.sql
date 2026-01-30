-- Fix group_members infinite recursion in RLS policies
-- group_members 테이블의 무한 재귀 문제 해결

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Group members viewable by everyone." ON public.group_members;
DROP POLICY IF EXISTS "Users can insert themselves as group members." ON public.group_members;
DROP POLICY IF EXISTS "Users can update their own membership." ON public.group_members;
DROP POLICY IF EXISTS "Group creators can manage members." ON public.group_members;

-- 간단한 정책으로 재생성
CREATE POLICY "Group members viewable by everyone."
  ON public.group_members FOR SELECT
  USING (true);

CREATE POLICY "Users can insert themselves as group members."
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership."
  ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE는 서버 API에서만 (Service Role)
