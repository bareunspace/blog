drop policy if exists "community_images_public_insert_webp" on storage.objects;

create policy "community_images_public_insert_webp"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'community-images'
  and (
    name like 'uploads/%.webp'
    or name like 'images/community/%.webp'
  )
);
