-- Add 'book_added' to notification types
-- This allows notifications when a new book is added to a group

-- Drop existing constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with 'book_added' type
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('reply', 'reaction', 'mention', 'system', 'book_added'));

-- Comment
COMMENT ON COLUMN public.notifications.type IS 'Notification type: reply, reaction, mention, system, book_added';
