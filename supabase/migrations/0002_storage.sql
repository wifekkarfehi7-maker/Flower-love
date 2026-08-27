-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Storage buckets (Phase 4: Wedding Builder)
--
-- Objects are stored under `{user_id}/{invitation_id}/{filename}` so RLS can
-- check ownership purely from the storage path, without a DB round trip.
-- Both buckets are public-read (gallery photos and music need to be
-- reachable from the published invitation page without auth) but
-- write/delete is restricted to the owning user's own folder.
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('music', 'music', true, 15728640, array['audio/mpeg', 'audio/mp3'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "gallery_public_read"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "gallery_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "gallery_owner_update"
  on storage.objects for update
  using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "gallery_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "music_public_read"
  on storage.objects for select
  using (bucket_id = 'music');

create policy "music_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'music' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "music_owner_update"
  on storage.objects for update
  using (bucket_id = 'music' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "music_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'music' and auth.uid()::text = (storage.foldername(name))[1]);
