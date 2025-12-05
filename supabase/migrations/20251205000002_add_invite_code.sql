-- Add invite_code to groups
alter table public.groups 
add column invite_code text unique default substr(md5(random()::text), 0, 7);

-- Create a function to generate random invite codes if needed later
-- For now, the default value handles new rows. Existing rows will get a random value.
