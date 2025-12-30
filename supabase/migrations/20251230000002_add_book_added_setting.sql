-- Add 'book_added' to notification settings
-- Allows users to control whether they receive notifications when a new book is added to their group

-- Update existing users to include book_added setting (default: true)
UPDATE public.users
SET notification_settings = notification_settings || jsonb_build_object('book_added', true)
WHERE notification_settings IS NOT NULL
  AND NOT (notification_settings ? 'book_added');

-- Update comment to include new setting
COMMENT ON COLUMN public.users.notification_settings IS 'User notification preferences: comment_reply, reaction, member_join, completion, book_added';
