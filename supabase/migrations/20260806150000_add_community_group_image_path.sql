alter table public.community_groups
add column if not exists image_path text;

grant update (image_path) on public.community_groups to authenticated;
