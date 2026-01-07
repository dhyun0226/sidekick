-- Add genre fields to books table for genre management system
-- Similar to TOC approval system: draft_genre (user input) -> official_genre (admin approved)

ALTER TABLE books
  ADD COLUMN draft_genre TEXT,
  ADD COLUMN official_genre TEXT;

-- Add comments for documentation
COMMENT ON COLUMN books.draft_genre IS 'User-submitted genre awaiting admin approval';
COMMENT ON COLUMN books.official_genre IS 'Admin-approved official genre for this book';

-- Available genres (enforced in application layer):
-- 소설, 시/시집, 에세이, 자기계발, 경영/경제, 인문/철학,
-- 사회/정치, 과학/기술, 역사, 예술, 종교, 기타
