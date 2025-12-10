-- Add DELETE policy for group_books
-- Allow admins to delete books from their groups

CREATE POLICY "Admins can delete group books"
  ON public.group_books FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_books.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );
