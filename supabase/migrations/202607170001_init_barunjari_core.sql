-- Baseline schema for login-enabled features in Barunjari
-- Run through Supabase migration workflow (db push)

create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nickname text,
    phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.reservation_requests (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    requested_date date,
    requested_time text,
    note text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_reservation_requests_updated_at on public.reservation_requests;
create trigger trg_reservation_requests_updated_at
before update on public.reservation_requests
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reservation_requests enable row level security;

-- Profiles: user can manage only own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Reservation requests: user can only create/read/update own requests.
drop policy if exists "reservation_select_own" on public.reservation_requests;
create policy "reservation_select_own"
on public.reservation_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reservation_insert_own" on public.reservation_requests;
create policy "reservation_insert_own"
on public.reservation_requests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reservation_update_own" on public.reservation_requests;
create policy "reservation_update_own"
on public.reservation_requests
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
