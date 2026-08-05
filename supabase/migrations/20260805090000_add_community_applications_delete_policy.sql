alter table public.community_applications enable row level security;

grant delete on public.community_applications to authenticated;

drop policy if exists "community_applications_admin_delete" on public.community_applications;
create policy "community_applications_admin_delete"
on public.community_applications
for delete
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com')
);
