-- Add app_settings column to users table for general application preferences
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS app_settings JSONB DEFAULT jsonb_build_object(
  'library_view_mode', 'year',
  'calendar_include_comments', true
) NOT NULL;
