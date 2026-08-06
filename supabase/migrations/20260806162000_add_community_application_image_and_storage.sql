alter table public.community_applications
add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'community-images',
    'community-images',
    true,
    500000,
    array['image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_images_public_select" on storage.objects;
create policy "community_images_public_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'community-images');

drop policy if exists "community_images_public_insert_webp" on storage.objects;
create policy "community_images_public_insert_webp"
on storage.objects
for insert
to anon, authenticated
with check (
    bucket_id = 'community-images'
    and name like 'images/community/%.webp'
);

drop policy if exists "community_images_admin_update" on storage.objects;
create policy "community_images_admin_update"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'community-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com', 'bareunjari@gmail.com')
)
with check (
    bucket_id = 'community-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com', 'bareunjari@gmail.com')
);

drop policy if exists "community_images_admin_delete" on storage.objects;
create policy "community_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'community-images'
    and lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com', 'bareunjari@gmail.com')
);
