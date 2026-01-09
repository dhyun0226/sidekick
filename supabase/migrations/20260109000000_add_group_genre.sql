-- group_books 테이블에 genre 컬럼 추가 (그룹별 장르 저장용)
ALTER TABLE group_books 
ADD COLUMN genre TEXT;

-- 기존 데이터 마이그레이션 (books 테이블의 정보를 가져와서 초기화)
-- 1. official_genre가 있으면 그걸로
-- 2. 없으면 draft_genre로
-- 3. 둘 다 없으면 NULL 유지 (나중에 UI에서 처리)
UPDATE group_books gb
SET genre = COALESCE(b.official_genre, b.draft_genre)
FROM books b
WHERE gb.isbn = b.isbn;