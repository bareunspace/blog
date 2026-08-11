alter table public.reservations enable row level security;

grant select on public.reservations to authenticated;

drop policy if exists "reservations_admin_select" on public.reservations;
create policy "reservations_admin_select"
on public.reservations
for select
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'keunyong@gmail.com',
        'bareunjari@gmail.com'
    )
);
