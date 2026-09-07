-- ============================================================================
-- MenuQR — 0002_storage
-- One public bucket for every menu image. Paths are always
--   {restaurant_id}/{kind}/{filename}
-- so write access can be authorized from the first path segment alone.
-- Reads are public: menu images are served straight from the CDN to phones on
-- weak connections, and nothing private is ever stored here.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Casting a malformed folder name would abort the policy check, so failures
-- degrade to NULL (and NULL is never a restaurant anyone can manage).
create or replace function public.safe_uuid(p_text text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p_text::uuid;
exception when others then
  return null;
end;
$$;

drop policy if exists "menu images: public read" on storage.objects;
create policy "menu images: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

drop policy if exists "menu images: managers upload" on storage.objects;
create policy "menu images: managers upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "menu images: managers update" on storage.objects;
create policy "menu images: managers update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "menu images: managers delete" on storage.objects;
create policy "menu images: managers delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  );
