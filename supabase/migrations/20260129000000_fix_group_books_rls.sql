-- =============================================
-- Fix group_books RLS policies
-- =============================================
-- Solo 그룹에서 책 추가 시 RLS 에러 수정

-- Drop existing policies
DROP POLICY IF EXISTS "Members can add books in active groups" ON public.group_books;
DROP POLICY IF EXISTS "Everyone can view group books" ON public.group_books;
DROP POLICY IF EXISTS "Admins can update group books" ON public.group_books;
DROP POLICY IF EXISTS "Admins can delete group books" ON public.group_books;

-- Recreate policies
CREATE POLICY "Everyone can view group books"
  ON public.group_books FOR SELECT
  USING (true);

CREATE POLICY "Members can add books in active groups"
  ON public.group_books FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_books.group_id
      AND g.status = 'active'
      AND can_add_book_to_group(auth.uid(), g.id)
    )
  );

CREATE POLICY "Admins can update group books"
  ON public.group_books FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
      AND gm.left_at IS NULL
    )
  );

CREATE POLICY "Admins can delete group books"
  ON public.group_books FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
      AND gm.left_at IS NULL
    )
  );
