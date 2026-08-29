create table if not exists public.interview_journey_states (
    user_id uuid primary key references auth.users(id) on delete cascade,
    state jsonb not null default '{"version":1,"tasks":{}}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint interview_journey_states_state_object check (jsonb_typeof(state) = 'object')
);

drop trigger if exists trg_interview_journey_states_updated_at on public.interview_journey_states;
create trigger trg_interview_journey_states_updated_at
before update on public.interview_journey_states
for each row
execute function public.set_updated_at();

alter table public.interview_journey_states enable row level security;

revoke all on table public.interview_journey_states from anon, authenticated;
grant select, insert, update on table public.interview_journey_states to authenticated;

drop policy if exists interview_journey_states_select_own on public.interview_journey_states;
create policy interview_journey_states_select_own
on public.interview_journey_states
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists interview_journey_states_insert_own on public.interview_journey_states;
create policy interview_journey_states_insert_own
on public.interview_journey_states
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists interview_journey_states_update_own on public.interview_journey_states;
create policy interview_journey_states_update_own
on public.interview_journey_states
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
