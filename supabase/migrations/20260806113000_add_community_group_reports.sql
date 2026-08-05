create table if not exists public.community_group_reports (
    id bigint generated always as identity primary key,
    group_id bigint not null references public.community_groups(id) on delete cascade,
    group_title text,
    reason text not null,
    source_path text,
    reporter_email text,
    reporter_phone text,
    status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
    resolved_note text,
    resolved_by text,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_community_group_reports_status_created
    on public.community_group_reports (status, created_at desc);

create index if not exists idx_community_group_reports_group_created
    on public.community_group_reports (group_id, created_at desc);

drop trigger if exists trg_community_group_reports_updated_at on public.community_group_reports;
create trigger trg_community_group_reports_updated_at
before update on public.community_group_reports
for each row
execute function public.set_updated_at();

alter table public.community_group_reports enable row level security;

revoke all on public.community_group_reports from anon, authenticated;
grant insert on public.community_group_reports to anon, authenticated;
grant select, update, delete on public.community_group_reports to authenticated;
grant usage, select on sequence public.community_group_reports_id_seq to anon, authenticated;

drop policy if exists "community_group_reports_public_insert" on public.community_group_reports;
create policy "community_group_reports_public_insert"
on public.community_group_reports
for insert
to anon, authenticated
with check (
    length(trim(reason)) >= 5
);

drop policy if exists "community_group_reports_admin_select" on public.community_group_reports;
create policy "community_group_reports_admin_select"
on public.community_group_reports
for select
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'keunyong@gmail.com',
        'bareunjari@gmail.com'
    )
);

drop policy if exists "community_group_reports_admin_update" on public.community_group_reports;
create policy "community_group_reports_admin_update"
on public.community_group_reports
for update
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'keunyong@gmail.com',
        'bareunjari@gmail.com'
    )
)
with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'keunyong@gmail.com',
        'bareunjari@gmail.com'
    )
);

drop policy if exists "community_group_reports_admin_delete" on public.community_group_reports;
create policy "community_group_reports_admin_delete"
on public.community_group_reports
for delete
to authenticated
using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'keunyong@gmail.com',
        'bareunjari@gmail.com'
    )
);
