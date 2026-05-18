-- Sidekick v2 shareable reading session cards.

alter table public.reading_sessions
  add column if not exists share_token text,
  add column if not exists shared_at timestamp with time zone,
  add column if not exists share_quote text;

create unique index if not exists idx_reading_sessions_share_token
  on public.reading_sessions(share_token)
  where share_token is not null;
