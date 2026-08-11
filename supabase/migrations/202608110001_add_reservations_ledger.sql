create table if not exists public.reservations (
    id bigint generated always as identity primary key,
    source text not null default 'naver' check (source in ('naver', 'manual', 'other')),
    reservation_number text not null,
    customer_name text,
    usage_date date,
    start_at timestamptz,
    end_at timestamptz,
    duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
    product_name text,
    status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
    payment_status text,
    paid_amount numeric(12, 0) check (paid_amount is null or paid_amount >= 0),
    cancel_reason text,
    raw_payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint reservations_source_reservation_number_key unique (source, reservation_number)
);

create index if not exists idx_reservations_source_start_at
    on public.reservations (source, start_at);

create index if not exists idx_reservations_usage_date_status
    on public.reservations (usage_date, status);

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

alter table public.reservations enable row level security;

revoke all on public.reservations from anon, authenticated;
grant select on public.reservations to authenticated;
grant usage, select on sequence public.reservations_id_seq to authenticated;

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
