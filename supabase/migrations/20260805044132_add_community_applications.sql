create table if not exists public.community_applications (
    id bigint generated always as identity primary key,
    application_type text not null check (application_type in ('interest', 'host', 'existing_group')),
    group_key text not null check (group_key in ('interview', 'reading', 'ai', 'other')),
    group_title text not null,
    applicant_name text not null,
    contact_email text not null,
    contact_phone text,
    availability text,
    message text,
    existing_group_summary text,
    privacy_consent boolean not null default false,
    source_path text,
    status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'matched', 'closed')),
    admin_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_community_applications_status_created
    on public.community_applications (status, created_at desc);

create index if not exists idx_community_applications_group_created
    on public.community_applications (group_key, created_at desc);

drop trigger if exists trg_community_applications_updated_at on public.community_applications;
create trigger trg_community_applications_updated_at
before update on public.community_applications
for each row
execute function public.set_updated_at();

alter table public.community_applications enable row level security;

revoke all on public.community_applications from anon, authenticated;
grant insert on public.community_applications to anon, authenticated;
grant select on public.community_applications to authenticated;
grant update (status, admin_note, updated_at) on public.community_applications to authenticated;

grant usage, select on sequence public.community_applications_id_seq to anon, authenticated;

drop policy if exists "community_applications_public_insert" on public.community_applications;
create policy "community_applications_public_insert"
on public.community_applications
for insert
to anon, authenticated
with check (
    privacy_consent = true
    and length(trim(applicant_name)) between 1 and 80
    and length(trim(contact_email)) between 3 and 160
    and length(trim(group_title)) between 1 and 120
);

drop policy if exists "community_applications_admin_select" on public.community_applications;
create policy "community_applications_admin_select"
on public.community_applications
for select
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com')
);

drop policy if exists "community_applications_admin_update" on public.community_applications;
create policy "community_applications_admin_update"
on public.community_applications
for update
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com')
)
with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('keunyong@gmail.com')
);
