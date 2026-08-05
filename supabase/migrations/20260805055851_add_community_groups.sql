create table if not exists public.community_groups (
    id bigint generated always as identity primary key,
    group_key text not null check (group_key in ('interview', 'reading', 'ai', 'other')),
    title text not null,
    description text,
    status text not null default 'draft' check (status in ('draft', 'recruiting', 'scheduled', 'closed')),
    host_name text,
    schedule_text text,
    capacity integer check (capacity is null or capacity > 0),
    source_application_id bigint references public.community_applications(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_community_groups_status_created
    on public.community_groups (status, created_at desc);

create index if not exists idx_community_groups_group_created
    on public.community_groups (group_key, created_at desc);

drop trigger if exists trg_community_groups_updated_at on public.community_groups;
create trigger trg_community_groups_updated_at
before update on public.community_groups
for each row
execute function public.set_updated_at();

alter table public.community_groups enable row level security;

revoke all on public.community_groups from anon, authenticated;
grant select, insert on public.community_groups to authenticated;
grant update (title, description, status, host_name, schedule_text, capacity, updated_at) on public.community_groups to authenticated;
grant usage, select on sequence public.community_groups_id_seq to authenticated;

drop policy if exists "community_groups_admin_select" on public.community_groups;
create policy "community_groups_admin_select"
on public.community_groups
for select
to authenticated
using (true);

drop policy if exists "community_groups_admin_insert" on public.community_groups;
create policy "community_groups_admin_insert"
on public.community_groups
for insert
to authenticated
with check (true);

drop policy if exists "community_groups_admin_update" on public.community_groups;
create policy "community_groups_admin_update"
on public.community_groups
for update
to authenticated
using (true)
with check (true);
