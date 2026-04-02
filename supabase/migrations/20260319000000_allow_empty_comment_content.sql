-- Allow empty comment content (for highlight-only entries with anchor_text)
-- Keep NOT NULL but allow empty string, maintain max length 500
alter table public.comments
  drop constraint if exists comments_content_check;

alter table public.comments
  add constraint comments_content_check
  check (char_length(trim(both from content)) <= 500);
