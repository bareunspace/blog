create or replace function public.evaluate_learning_outcomes()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate public.learning_candidates;
  v_checkpoint integer;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_elapsed integer;
  v_purpose text;
  v_window_start date;
  v_window_end date;
  v_bookings integer;
  v_customers integer;
  v_active_weeks integer;
  v_net_revenue numeric;
  v_result text;
  v_checkpoint_data jsonb;
  v_processed integer := 0;
begin
  for v_candidate in
    select * from public.learning_candidates
    where status = 'promoted' and outcome_status = 'pending' and promoted_at is not null
    for update skip locked
  loop
    v_elapsed := v_today - (v_candidate.promoted_at at time zone 'Asia/Seoul')::date;
    v_purpose := regexp_replace(v_candidate.title, ' 반복 수요$', '');
    v_window_start := (v_candidate.promoted_at at time zone 'Asia/Seoul')::date;
    foreach v_checkpoint in array array[7, 14, 28]
    loop
      if v_elapsed < v_checkpoint or coalesce(v_candidate.outcome_summary, '{}'::jsonb) #> array['checkpoints', v_checkpoint || 'd'] is not null then continue; end if;
      v_window_end := least(v_today, v_window_start + (v_checkpoint - 1));
      select count(*)::integer,
             count(distinct coalesce(nullif(btrim(r.customer_phone), ''), nullif(lower(btrim(r.customer_email)), ''), nullif(btrim(r.customer_name), '')))::integer,
             count(distinct date_trunc('week', r.usage_date::timestamp))::integer,
             coalesce(sum(coalesce(r.payment_amount, 0) - coalesce(r.refund_amount, 0)), 0)
      into v_bookings, v_customers, v_active_weeks, v_net_revenue
      from public.reservations r
      where r.status = 'confirmed' and r.usage_date between v_window_start and v_window_end
        and case
          when r.usage_purpose ~ '면접|발표' then '면접·발표 연습'
          when r.usage_purpose ~ '미팅|업무|화상회의' then '미팅·업무'
          when r.usage_purpose ~ '개인 작업|집중|프리랜서' then '개인 작업·집중'
          when r.usage_purpose ~ '스터디|팀 프로젝트|팀플' then '스터디·팀 프로젝트'
          when r.usage_purpose ~ '카드게임|보드게임|소모임' then '소모임·취미'
          when r.usage_purpose ~* '이미지 컨설팅|퍼스널.?컬러' then '이미지 컨설팅'
          when r.usage_purpose ~ '상담|대화' then '상담·대화'
          when r.usage_purpose ~ '영어|외국어' then '영어·외국어 연습'
          when r.usage_purpose ~ '촬영|콘텐츠' then '촬영·콘텐츠'
          else btrim(r.usage_purpose)
        end = v_purpose;
      v_result := case when v_checkpoint < 28 then 'monitoring'
        when v_bookings >= 3 and v_customers >= 2 and v_active_weeks >= 2 then 'validated'
        when v_bookings = 0 then 'invalidated' else 'inconclusive' end;
      v_checkpoint_data := jsonb_build_object('checkpoint_days',v_checkpoint,'evaluated_at',now(),'window_start',v_window_start,'window_end',v_window_end,'bookings',v_bookings,'distinct_customers',v_customers,'active_weeks',v_active_weeks,'net_revenue',v_net_revenue,'result',v_result);
      update public.learning_candidates
      set outcome_summary = jsonb_set(coalesce(outcome_summary, '{}'::jsonb), array['checkpoints', v_checkpoint || 'd'], v_checkpoint_data, true),
          outcome_status = case when v_checkpoint = 28 then v_result else outcome_status end,
          status = case when v_checkpoint = 28 and v_result = 'validated' then 'validated' when v_checkpoint = 28 and v_result = 'invalidated' then 'invalidated' else status end,
          updated_at = now()
      where id = v_candidate.id returning * into v_candidate;
      insert into public.learning_actions(candidate_id,action_type,from_status,to_status,actor_type,actor_label,idempotency_key,payload)
      values(v_candidate.id,'outcome_recorded','promoted',v_candidate.status,'system','learning-outcome-cron@0.1.0','outcome:'||v_candidate.id||':'||v_checkpoint||'d',v_checkpoint_data)
      on conflict (idempotency_key) do nothing;
      v_processed := v_processed + 1;
    end loop;
  end loop;
  return jsonb_build_object('ok',true,'evaluated_on',v_today,'checkpoints_recorded',v_processed);
end;
$$;
revoke all on function public.evaluate_learning_outcomes() from public;
revoke all on function public.evaluate_learning_outcomes() from anon;
revoke all on function public.evaluate_learning_outcomes() from authenticated;
grant execute on function public.evaluate_learning_outcomes() to service_role;
do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname='evaluate_learning_outcomes_daily';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule('evaluate_learning_outcomes_daily','30 20 * * *','select public.evaluate_learning_outcomes();');
end $$;

