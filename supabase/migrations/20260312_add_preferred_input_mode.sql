-- Add preferred_input_mode to app_settings JSONB
-- Default is 'percent', alternative is 'page'
-- No schema change needed since app_settings is already JSONB
-- This migration just documents the new key

COMMENT ON COLUMN users.app_settings IS 'User app settings JSON. Keys: library_view_mode, calendar_include_comments, preferred_input_mode (percent|page)';
