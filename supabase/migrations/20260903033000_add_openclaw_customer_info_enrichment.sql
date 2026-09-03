-- OpenClaw takes over Naver SmartPlace customer-detail enrichment.
-- Existing historical incomplete rows are intentionally excluded from the active queue.

alter table public.reservations
  add column if not exists customer_info_status text,
  add column if not exists customer_info_source text,
  add column if not exists customer_info_started_at timestamptz,
  add column if not exists customer_info_updated_at timestamptz,
  add column if not exists customer_info_error text,
  add column if not exists customer_info_run_id text,
  add column if not exists customer_info_attempts integer not null default 0,
  add column if not exists customer_info_queued_at timestamptz;

alter table public.reservations
  drop constraint if exists reservations_customer_info_status_check;

alter table public.reservations
  add constraint reservations_customer_info_status_check
  check (customer_info_status is null or customer_info_status in (
    'pending','processing','completed','failed','skipped','not_required'
  ));

-- Backfill current state. Historical incomplete Naver rows must not be crawled automatically.
update public.reservations
set customer_info_status = case
      when source <> 'naver' then 'not_required'
      when status <> 'confirmed' then 'skipped'
      when nullif(btrim(coalesce(customer_name, '')), '') is not null
       and nullif(btrim(coalesce(customer_phone, '')), '') is not null
       and nullif(btrim(coalesce(customer_email, '')), '') is not null
       and nullif(btrim(coalesce(usage_purpose, '')), '') is not null then 'completed'
      else 'skipped'
    end,
    customer_info_source = case
      when source = 'naver'
       and nullif(btrim(coalesce(customer_name, '')), '') is not null
       and nullif(btrim(coalesce(customer_phone, '')), '') is not null
       and nullif(btrim(coalesce(customer_email, '')), '') is not null
       and nullif(btrim(coalesce(usage_purpose, '')), '') is not null
      then coalesce(customer_info_source, 'legacy')
      else customer_info_source
    end,
    customer_info_error = case
      when source = 'naver' and status = 'confirmed' and (
        nullif(btrim(coalesce(customer_name, '')), '') is null
        or nullif(btrim(coalesce(customer_phone, '')), '') is null
        or nullif(btrim(coalesce(customer_email, '')), '') is null
        or nullif(btrim(coalesce(usage_purpose, '')), '') is null
      ) then 'PRE_AUTOMATION_BACKLOG'
      else customer_info_error
    end,
    customer_info_updated_at = case
      when source = 'naver'
       and nullif(btrim(coalesce(customer_name, '')), '') is not null
       and nullif(btrim(coalesce(customer_phone, '')), '') is not null
       and nullif(btrim(coalesce(customer_email, '')), '') is not null
       and nullif(btrim(coalesce(usage_purpose, '')), '') is not null
      then coalesce(customer_info_updated_at, updated_at, now())
      else customer_info_updated_at
    end,
    customer_info_queued_at = null
where customer_info_status is null
   or (customer_info_status = 'pending' and customer_info_queued_at is null);

create or replace function public.sync_reservation_customer_info_state()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ready boolean;
  v_customer_fields_changed boolean;
begin
  v_ready := nullif(btrim(coalesce(new.customer_name, '')), '') is not null
    and nullif(btrim(coalesce(new.customer_phone, '')), '') is not null
    and nullif(btrim(coalesce(new.customer_email, '')), '') is not null
    and nullif(btrim(coalesce(new.usage_purpose, '')), '') is not null;

  if tg_op = 'INSERT' then
    if new.source <> 'naver' then
      new.customer_info_status := coalesce(new.customer_info_status, 'not_required');
    elsif new.status <> 'confirmed' then
      new.customer_info_status := coalesce(new.customer_info_status, 'skipped');
    elsif v_ready then
      new.customer_info_status := 'completed';
      new.customer_info_source := coalesce(new.customer_info_source, 'ingest');
      new.customer_info_updated_at := coalesce(new.customer_info_updated_at, now());
      new.customer_info_queued_at := null;
    else
      new.customer_info_status := 'pending';
      new.customer_info_queued_at := coalesce(new.customer_info_queued_at, now());
    end if;
    return new;
  end if;

  if new.source = 'naver' and new.status <> 'confirmed' and old.status is distinct from new.status then
    new.customer_info_status := 'skipped';
    new.customer_info_error := null;
    new.customer_info_queued_at := null;
    return new;
  end if;

  v_customer_fields_changed := old.customer_name is distinct from new.customer_name
    or old.customer_phone is distinct from new.customer_phone
    or old.customer_email is distinct from new.customer_email
    or old.usage_purpose is distinct from new.usage_purpose;

  if new.source = 'naver' and new.status = 'confirmed' and v_customer_fields_changed then
    if v_ready then
      new.customer_info_status := 'completed';
      new.customer_info_source := coalesce(new.customer_info_source, 'manual');
      new.customer_info_updated_at := now();
      new.customer_info_error := null;
      new.customer_info_queued_at := null;
    elsif new.customer_info_status not in ('processing','failed','skipped') then
      new.customer_info_status := 'pending';
      new.customer_info_queued_at := coalesce(new.customer_info_queued_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists reservations_sync_customer_info_state on public.reservations;
create trigger reservations_sync_customer_info_state
before insert or update on public.reservations
for each row execute function public.sync_reservation_customer_info_state();

create or replace function public.claim_naver_customer_info_job(p_run_id text default null)
returns table (
  reservation_id uuid,
  reservation_number text,
  usage_date date,
  start_time time,
  end_time time,
  product text,
  run_id text,
  attempt integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_run_id text := coalesce(nullif(btrim(p_run_id), ''), gen_random_uuid()::text);
begin
  select r.id
  into v_id
  from public.reservations r
  where r.source = 'naver'
    and r.status = 'confirmed'
    and r.customer_info_queued_at is not null
    and coalesce(r.customer_info_status, 'pending') in ('pending','failed')
    and coalesce(r.customer_info_attempts, 0) < 5
    and (
      nullif(btrim(coalesce(r.customer_name, '')), '') is null
      or nullif(btrim(coalesce(r.customer_phone, '')), '') is null
      or nullif(btrim(coalesce(r.customer_email, '')), '') is null
      or nullif(btrim(coalesce(r.usage_purpose, '')), '') is null
    )
    and (r.customer_info_started_at is null or r.customer_info_started_at < now() - interval '20 minutes')
  order by r.customer_info_queued_at asc
  for update skip locked
  limit 1;

  if v_id is null then
    return;
  end if;

  return query
  update public.reservations r
  set customer_info_status = 'processing',
      customer_info_run_id = v_run_id,
      customer_info_started_at = now(),
      customer_info_error = null,
      customer_info_attempts = coalesce(r.customer_info_attempts, 0) + 1,
      updated_at = now()
  where r.id = v_id
  returning r.id, r.reservation_number, r.usage_date, r.start_time, r.end_time, r.product,
            r.customer_info_run_id, r.customer_info_attempts;
end;
$$;

create or replace function public.complete_naver_customer_info_job(
  p_reservation_id uuid,
  p_run_id text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_usage_purpose text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if nullif(btrim(coalesce(p_customer_name, '')), '') is null
    or nullif(btrim(coalesce(p_customer_phone, '')), '') is null
    or nullif(btrim(coalesce(p_customer_email, '')), '') is null
    or nullif(btrim(coalesce(p_usage_purpose, '')), '') is null then
    raise exception 'All four customer fields are required';
  end if;

  update public.reservations r
  set customer_name = btrim(p_customer_name),
      customer_phone = btrim(p_customer_phone),
      customer_email = lower(btrim(p_customer_email)),
      usage_purpose = btrim(p_usage_purpose),
      customer_info_status = 'completed',
      customer_info_source = 'openclaw',
      customer_info_updated_at = now(),
      customer_info_error = null,
      customer_info_queued_at = null,
      updated_at = now()
  where r.id = p_reservation_id
    and r.customer_info_status = 'processing'
    and r.customer_info_run_id = p_run_id;

  return found;
end;
$$;

create or replace function public.fail_naver_customer_info_job(
  p_reservation_id uuid,
  p_run_id text,
  p_error text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.reservations r
  set customer_info_status = 'failed',
      customer_info_error = left(coalesce(nullif(btrim(p_error), ''), 'UNKNOWN_ERROR'), 1000),
      customer_info_updated_at = now(),
      updated_at = now()
  where r.id = p_reservation_id
    and r.customer_info_status = 'processing'
    and r.customer_info_run_id = p_run_id;

  return found;
end;
$$;

revoke all on function public.claim_naver_customer_info_job(text) from public, anon, authenticated;
revoke all on function public.complete_naver_customer_info_job(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.fail_naver_customer_info_job(uuid, text, text) from public, anon, authenticated;

grant execute on function public.claim_naver_customer_info_job(text) to service_role;
grant execute on function public.complete_naver_customer_info_job(uuid, text, text, text, text, text) to service_role;
grant execute on function public.fail_naver_customer_info_job(uuid, text, text) to service_role;

create index if not exists reservations_customer_info_queue_idx
on public.reservations (customer_info_queued_at)
where source = 'naver'
  and status = 'confirmed'
  and customer_info_status in ('pending','failed');

comment on column public.reservations.customer_info_status is
  'Naver SmartPlace customer-detail enrichment state for OpenClaw.';
comment on function public.claim_naver_customer_info_job(text) is
  'Atomically claims one newly queued Naver reservation needing customer detail enrichment.';
comment on function public.complete_naver_customer_info_job(uuid, text, text, text, text, text) is
  'Completes an OpenClaw enrichment job only when run_id still owns the claim.';
comment on function public.fail_naver_customer_info_job(uuid, text, text) is
  'Marks an OpenClaw enrichment job failed; retries are allowed up to five attempts.';
