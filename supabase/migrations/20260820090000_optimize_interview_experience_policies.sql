drop policy if exists interview_experiences_admin_select on public.interview_experiences;
create policy interview_experiences_admin_select
on public.interview_experiences
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);

drop policy if exists interview_experiences_admin_update on public.interview_experiences;
create policy interview_experiences_admin_update
on public.interview_experiences
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
