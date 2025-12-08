-- Create storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Enable RLS for storage.objects
alter table storage.objects enable row level security;

-- Policy: Anyone can view avatars (public bucket)
create policy "Public Access for Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload their own avatars
create policy "Users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatars
create policy "Users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars
create policy "Users can delete own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
