-- =============================================
-- Validation Constraints (데이터 무결성 보장)
-- =============================================

-- 1. Users 테이블
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_nickname_length_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_nickname_length_check
  CHECK (
    nickname IS NULL OR (
      char_length(trim(nickname)) >= 2 AND
      char_length(trim(nickname)) <= 15
    )
  );

-- 2. Groups 테이블
ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_name_length_check;

ALTER TABLE public.groups
  ADD CONSTRAINT groups_name_length_check
  CHECK (
    char_length(trim(name)) >= 2 AND
    char_length(trim(name)) <= 20
  );

-- 3. Comments 테이블
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_content_length_check;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_content_length_check
  CHECK (
    char_length(trim(content)) >= 1 AND
    char_length(trim(content)) <= 500
  );

-- 4. Reviews 테이블
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_content_length_check;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_range_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_content_length_check
  CHECK (
    content IS NULL OR (
      char_length(trim(content)) >= 10 AND
      char_length(trim(content)) <= 2000
    )
  );

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_range_check
  CHECK (
    rating >= 0.5 AND rating <= 5.0 AND
    (rating * 2) = floor(rating * 2)
  );

-- 테스트: 제약조건 확인
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'groups', 'comments', 'reviews')
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;
