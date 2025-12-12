-- =============================================
-- Add notification_settings to users table
-- =============================================
-- Allows users to control which notifications they receive

-- Add notification_settings column to users table
alter table public.users
add column if not exists notification_settings jsonb default jsonb_build_object(
  'comment_reply', true,
  'reaction', true,
  'member_join', true,
  'completion', true
) not null;

-- Comment
comment on column public.users.notification_settings is 'User notification preferences: comment_reply, reaction, member_join, completion';

-- Update existing users to have default settings
update public.users
set notification_settings = jsonb_build_object(
  'comment_reply', true,
  'reaction', true,
  'member_join', true,
  'completion', true
)
where notification_settings is null;
