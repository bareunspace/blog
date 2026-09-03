drop index if exists private.reservation_message_logs_send_dedupe_uidx;

create unique index reservation_message_logs_send_dedupe_uidx
  on private.reservation_message_logs (dedupe_key)
  where dry_run = false and status in ('manual_requested', 'queued', 'sending', 'sent');

comment on index private.reservation_message_logs_send_dedupe_uidx is
  '실제 출입안내의 수동 요청/대기/전송중/완료 상태는 dedupe_key당 하나만 허용한다.';

create or replace function public.service_request_reservation_access_guide(
  p_reservation_number text,
  p_actor_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_res public.reservations%rowtype;
  v_validation jsonb;
  v_dedupe_key text;
  v_existing_status text;
  v_existing_id bigint;
  v_log_id bigint;
  v_message text;
  v_message_preview text;
  v_code_key text;
begin
  if p_reservation_number is null or btrim(p_reservation_number) = '' then
    raise exception 'reservation_number is required' using errcode = '22023';
  end if;

  select * into v_res
  from public.reservations
  where source = 'naver'
    and reservation_number = btrim(p_reservation_number)
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'status', 'blocked_reservation_not_found',
      'errorCode', 'RESERVATION_NOT_FOUND',
      'reservationNumber', btrim(p_reservation_number)
    );
  end if;

  v_dedupe_key := 'naver:' || v_res.reservation_number || ':access_guide:v1';

  select l.status, l.id
    into v_existing_status, v_existing_id
  from private.reservation_message_logs l
  where l.dedupe_key = v_dedupe_key
    and l.dry_run = false
    and l.status in ('manual_requested', 'queued', 'sending', 'sent')
  order by l.created_at desc, l.id desc
  limit 1;

  if v_existing_id is not null then
    return jsonb_build_object(
      'ok', false,
      'status', 'blocked_duplicate',
      'errorCode', 'DUPLICATE_SEND_BLOCKED',
      'reservationNumber', v_res.reservation_number,
      'existingStatus', v_existing_status,
      'existingLogId', v_existing_id
    );
  end if;

  v_validation := public.service_reservation_message_dry_run(
    v_res.reservation_number,
    p_actor_email
  );

  if coalesce(v_validation ->> 'ok', 'false') <> 'true' then
    return jsonb_build_object(
      'ok', false,
      'status', coalesce(v_validation ->> 'status', 'blocked_validation'),
      'errorCode', coalesce(v_validation ->> 'errorCode', 'ACCESS_GUIDE_VALIDATION_FAILED'),
      'reservationNumber', v_res.reservation_number,
      'validationLogId', v_validation ->> 'logId'
    );
  end if;

  v_message := v_validation ->> 'message';
  v_message_preview := v_validation ->> 'messagePreview';
  v_code_key := v_validation ->> 'codeKey';

  insert into private.reservation_message_logs (
    reservation_id,
    reservation_number,
    message_type,
    channel,
    dry_run,
    status,
    dedupe_key,
    usage_date,
    code_key,
    message_hash,
    message_preview,
    duplicate_blocked,
    error_code,
    actor_email
  ) values (
    v_res.id,
    v_res.reservation_number,
    'access_guide',
    'naver_talktalk',
    false,
    'manual_requested',
    v_dedupe_key,
    v_res.usage_date,
    v_code_key,
    case when v_message is null then null else encode(extensions.digest(v_message, 'sha256'), 'hex') end,
    v_message_preview,
    false,
    null,
    nullif(lower(btrim(coalesce(p_actor_email, ''))), '')
  ) returning id into v_log_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'manual_requested',
    'reservationNumber', v_res.reservation_number,
    'logId', v_log_id,
    'dedupeKey', v_dedupe_key,
    'messagePreview', v_message_preview,
    'codeKey', v_code_key
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'status', 'blocked_duplicate',
      'errorCode', 'DUPLICATE_SEND_BLOCKED',
      'reservationNumber', btrim(p_reservation_number)
    );
end;
$$;

revoke all on function public.service_request_reservation_access_guide(text, text) from public, anon, authenticated;
grant execute on function public.service_request_reservation_access_guide(text, text) to service_role;

comment on function public.service_request_reservation_access_guide(text, text) is
  '관리자 수동 출입안내 요청을 검증 후 manual_requested 상태로 큐에 적재한다. 실제 네이버 톡톡 전송은 OpenClaw가 수행한다.';

create or replace function public.service_claim_manual_access_guide_request()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.reservation_message_logs%rowtype;
begin
  select * into v_row
  from private.reservation_message_logs
  where dry_run = false
    and message_type = 'access_guide'
    and status = 'manual_requested'
  order by created_at, id
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update private.reservation_message_logs
  set status = 'queued'
  where id = v_row.id;

  return jsonb_build_object(
    'logId', v_row.id,
    'reservationId', v_row.reservation_id,
    'reservationNumber', v_row.reservation_number,
    'dedupeKey', v_row.dedupe_key,
    'usageDate', v_row.usage_date,
    'codeKey', v_row.code_key,
    'messagePreview', v_row.message_preview
  );
end;
$$;

revoke all on function public.service_claim_manual_access_guide_request() from public, anon, authenticated;
grant execute on function public.service_claim_manual_access_guide_request() to service_role;

comment on function public.service_claim_manual_access_guide_request() is
  'OpenClaw가 관리자 수동 출입안내 요청 1건을 원자적으로 선점하고 queued로 전환한다.';

create or replace function public.service_finish_manual_access_guide_request(
  p_log_id bigint,
  p_success boolean,
  p_error_code text default null,
  p_channel text default 'naver_talktalk'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.reservation_message_logs%rowtype;
begin
  update private.reservation_message_logs
  set status = case when p_success then 'sent' else 'failed' end,
      channel = coalesce(nullif(btrim(p_channel), ''), channel),
      error_code = case when p_success then null else nullif(btrim(coalesce(p_error_code, 'UNKNOWN_ERROR')), '') end
  where id = p_log_id
    and dry_run = false
    and message_type = 'access_guide'
    and status in ('manual_requested', 'queued', 'sending')
  returning * into v_row;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'errorCode', 'MANUAL_REQUEST_NOT_FOUND_OR_FINALIZED',
      'logId', p_log_id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'logId', v_row.id,
    'reservationNumber', v_row.reservation_number,
    'status', v_row.status,
    'errorCode', v_row.error_code,
    'channel', v_row.channel
  );
end;
$$;

revoke all on function public.service_finish_manual_access_guide_request(bigint, boolean, text, text) from public, anon, authenticated;
grant execute on function public.service_finish_manual_access_guide_request(bigint, boolean, text, text) to service_role;

comment on function public.service_finish_manual_access_guide_request(bigint, boolean, text, text) is
  'OpenClaw가 수동 출입안내 요청 처리 결과를 sent 또는 failed로 기록한다.';