-- Add reading progress tracking and group book dates

-- 1. Create user_reading_progress table
CREATE TABLE public.user_reading_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  group_book_id uuid REFERENCES public.group_books(id) ON DELETE CASCADE NOT NULL,
  progress_pct float NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  last_read_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, group_book_id)
);

-- 2. Add target dates to group_books
ALTER TABLE public.group_books
  ADD COLUMN target_start_date date,
  ADD COLUMN target_end_date date;

-- 3. Enable RLS
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;

-- 4. Policies for user_reading_progress
CREATE POLICY "Users can view all progress in their groups"
  ON public.user_reading_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_books gb
      JOIN public.group_members gm ON gb.group_id = gm.group_id
      WHERE gb.id = group_book_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own progress"
  ON public.user_reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger for auto-updating updated_at
CREATE TRIGGER update_user_reading_progress_updated_at
  BEFORE UPDATE ON public.user_reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Index for faster queries
CREATE INDEX idx_user_reading_progress_user_book
  ON public.user_reading_progress(user_id, group_book_id);
