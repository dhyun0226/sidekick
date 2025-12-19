-- =============================================
-- Fix group_books RLS policies to admin-only
-- Date: 2025-12-19
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Group members can add books." ON public.group_books;
DROP POLICY IF EXISTS "Group members can update books." ON public.group_books;
DROP POLICY IF EXISTS "Admins can delete group books" ON public.group_books;

-- Create new admin-only policies
CREATE POLICY "Admins can add books to group."
  ON public.group_books FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_books.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update group books."
  ON public.group_books FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_books.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_books.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete group books."
  ON public.group_books FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_books.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );
