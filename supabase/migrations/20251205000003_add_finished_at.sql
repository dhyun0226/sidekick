-- Add finished_at to group_books
alter table public.group_books 
add column finished_at timestamp with time zone;
