-- create storage bucket for public media (avatars, badges, photos)
insert into storage.buckets (id, name, public)
values ('media', 'media', true);

-- anyone can read public bucket
create policy "media_select" on storage.objects
  for select using (bucket_id = 'media');

-- authenticated users can upload
create policy "media_insert" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and auth.uid() is not null
  );

-- users can update/delete their own uploads
create policy "media_update" on storage.objects
  for update using (
    bucket_id = 'media'
    and auth.uid() = owner
  );

create policy "media_delete" on storage.objects
  for delete using (
    bucket_id = 'media'
    and auth.uid() = owner
  );
