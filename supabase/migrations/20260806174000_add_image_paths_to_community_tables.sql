alter table if exists public.community_groups
  add column if not exists image_paths jsonb;

alter table if exists public.community_applications
  add column if not exists image_paths jsonb;

update public.community_groups
set image_paths = jsonb_build_array(image_path)
where image_path is not null
  and coalesce(trim(image_path), '') <> ''
  and (
    image_paths is null
    or jsonb_typeof(image_paths) <> 'array'
    or jsonb_array_length(image_paths) = 0
  );

update public.community_applications
set image_paths = jsonb_build_array(image_path)
where image_path is not null
  and coalesce(trim(image_path), '') <> ''
  and (
    image_paths is null
    or jsonb_typeof(image_paths) <> 'array'
    or jsonb_array_length(image_paths) = 0
  );

alter table if exists public.community_groups
  drop constraint if exists community_groups_image_paths_is_array;

alter table if exists public.community_groups
  add constraint community_groups_image_paths_is_array
  check (
    image_paths is null
    or (
      jsonb_typeof(image_paths) = 'array'
      and jsonb_array_length(image_paths) <= 3
    )
  );

alter table if exists public.community_applications
  drop constraint if exists community_applications_image_paths_is_array;

alter table if exists public.community_applications
  add constraint community_applications_image_paths_is_array
  check (
    image_paths is null
    or (
      jsonb_typeof(image_paths) = 'array'
      and jsonb_array_length(image_paths) <= 3
    )
  );
