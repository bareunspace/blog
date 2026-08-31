alter table public.learning_candidates
  add column if not exists decision_override text,
  add column if not exists decision_override_reason text,
  add column if not exists decision_override_by uuid,
  add column if not exists decision_override_actor text,
  add column if not exists decision_override_at timestamptz,
  add column if not exists execution_candidate jsonb not null default '{}'::jsonb;

alter table public.learning_candidates
  drop constraint if exists learning_candidates_decision_override_check;

alter table public.learning_candidates
  add constraint learning_candidates_decision_override_check
  check (decision_override is null or decision_override in ('execute_now', 'observe', 'exclude'));

alter table public.learning_actions
  drop constraint if exists learning_actions_type_check;

alter table public.learning_actions
  add constraint learning_actions_type_check check (action_type in (
    'detected', 'evidence_added', 'evidence_evaluated', 'ai_analysis',
    'status_transition', 'human_review', 'decision_override',
    'github_pr_created', 'github_pr_updated', 'kb_promoted',
    'experiment_started', 'outcome_recorded', 'archived'
  ));

create or replace function public.override_learning_decision(
  p_candidate_id uuid,
  p_decision text,
  p_reason text,
  p_actor_user_id uuid,
  p_actor_label text
)
returns public.learning_candidates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate public.learning_candidates;
  v_previous text;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_execution_candidate jsonb;
begin
  if p_decision not in ('auto', 'execute_now', 'observe', 'exclude') then
    raise exception 'invalid_override_decision' using errcode = '22023';
  end if;
  if char_length(v_reason) < 3 then
    raise exception 'override_reason_required' using errcode = '22023';
  end if;
  if char_length(v_reason) > 2000 then
    raise exception 'override_reason_too_long' using errcode = '22001';
  end if;

  select * into v_candidate
  from public.learning_candidates
  where id = p_candidate_id
  for update;
  if not found then raise exception 'learning_candidate_not_found' using errcode = 'P0002'; end if;
  if v_candidate.status not in ('promoted', 'validated', 'invalidated') then
    raise exception 'candidate_must_be_promoted' using errcode = '55000';
  end if;

  v_previous := coalesce(v_candidate.decision_override, 'auto');
  v_execution_candidate := case
    when p_decision = 'execute_now' then jsonb_build_object(
      'status', 'ready',
      'created_at', now(),
      'source', 'manual_override',
      'requires_change_approval', true,
      'recommended_actions', coalesce(v_candidate.ai_analysis -> 'recommended_actions', '[]'::jsonb),
      'success_metrics', coalesce(v_candidate.ai_analysis -> 'success_metrics', '[]'::jsonb)
    )
    when p_decision = 'auto' then '{}'::jsonb
    else coalesce(v_candidate.execution_candidate, '{}'::jsonb) || jsonb_build_object('status', p_decision, 'updated_at', now())
  end;

  update public.learning_candidates
  set decision_override = case when p_decision = 'auto' then null else p_decision end,
      decision_override_reason = case when p_decision = 'auto' then null else v_reason end,
      decision_override_by = case when p_decision = 'auto' then null else p_actor_user_id end,
      decision_override_actor = case when p_decision = 'auto' then null else p_actor_label end,
      decision_override_at = case when p_decision = 'auto' then null else now() end,
      execution_candidate = v_execution_candidate,
      updated_at = now()
  where id = p_candidate_id
  returning * into v_candidate;

  insert into public.learning_actions(
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'decision_override', v_previous, p_decision, 'human',
    p_actor_user_id, p_actor_label,
    'decision-override:' || p_candidate_id || ':' || gen_random_uuid(),
    jsonb_build_object(
      'decision', p_decision,
      'previous_decision', v_previous,
      'reason', v_reason,
      'execution_candidate_created', p_decision = 'execute_now'
    )
  );

  return v_candidate;
end;
$$;

revoke all on function public.override_learning_decision(uuid, text, text, uuid, text) from public;
revoke all on function public.override_learning_decision(uuid, text, text, uuid, text) from anon;
revoke all on function public.override_learning_decision(uuid, text, text, uuid, text) from authenticated;
grant execute on function public.override_learning_decision(uuid, text, text, uuid, text) to service_role;
