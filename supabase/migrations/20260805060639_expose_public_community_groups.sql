alter table public.community_applications
add column if not exists target_group_id bigint references public.community_groups(id) on delete set null;

create index if not exists idx_community_applications_target_group
    on public.community_applications (target_group_id, created_at desc);

grant select on public.community_groups to anon;

drop policy if exists "community_groups_public_select_open" on public.community_groups;
create policy "community_groups_public_select_open"
on public.community_groups
for select
to anon
using (
    status in ('recruiting', 'scheduled')
);
