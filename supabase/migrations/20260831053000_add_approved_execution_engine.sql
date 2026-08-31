alter table public.learning_actions
  drop constraint if exists learning_actions_type_check;

alter table public.learning_actions
  add constraint learning_actions_type_check check (action_type in (
    'detected', 'evidence_added', 'evidence_evaluated', 'ai_analysis',
    'status_transition', 'human_review', 'decision_override',
    'execution_planned', 'execution_applied',
    'github_pr_created', 'github_pr_updated', 'kb_promoted',
    'experiment_started', 'outcome_recorded', 'archived'
  ));

create or replace function public.save_learning_execution_plan(
  p_candidate_id uuid,
  p_plan jsonb,
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
  v_plan jsonb;
begin
  select * into v_candidate from public.learning_candidates
  where id = p_candidate_id for update;
  if not found then raise exception 'learning_candidate_not_found' using errcode = 'P0002'; end if;
  if v_candidate.decision_override <> 'execute_now' then
    raise exception 'execute_now_decision_required' using errcode = '55000';
  end if;
  if p_plan ->> 'template' <> 'homepage_validated_use_case_v1'
     or p_plan ->> 'repository' <> 'bareunspace/blog'
     or p_plan ->> 'target_path' <> '_data/learning_actions.json' then
    raise exception 'execution_plan_not_allowlisted' using errcode = '22023';
  end if;

  v_plan := p_plan || jsonb_build_object(
    'status', 'preview_ready',
    'planned_at', now(),
    'planned_by', p_actor_label,
    'requires_change_approval', true
  );
  update public.learning_candidates
  set execution_candidate = v_plan, updated_at = now()
  where id = p_candidate_id returning * into v_candidate;

  insert into public.learning_actions(
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'execution_planned', 'execute_now', 'preview_ready', 'human',
    p_actor_user_id, p_actor_label,
    'execution-plan:' || p_candidate_id || ':' || gen_random_uuid(),
    v_plan
  );
  return v_candidate;
end;
$$;

create or replace function public.record_learning_execution_application(
  p_candidate_id uuid,
  p_repository text,
  p_path text,
  p_commit_sha text,
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
  v_applied jsonb;
begin
  select * into v_candidate from public.learning_candidates
  where id = p_candidate_id for update;
  if not found then raise exception 'learning_candidate_not_found' using errcode = 'P0002'; end if;
  if v_candidate.execution_candidate ->> 'status' = 'applied' then return v_candidate; end if;
  if v_candidate.execution_candidate ->> 'status' <> 'preview_ready' then
    raise exception 'execution_preview_required' using errcode = '55000';
  end if;
  if p_repository <> 'bareunspace/blog' or p_path <> '_data/learning_actions.json' then
    raise exception 'execution_target_not_allowlisted' using errcode = '22023';
  end if;

  v_applied := v_candidate.execution_candidate || jsonb_build_object(
    'status', 'applied',
    'applied_at', now(),
    'applied_by', p_actor_label,
    'commit_sha', p_commit_sha
  );
  update public.learning_candidates
  set execution_candidate = v_applied, updated_at = now()
  where id = p_candidate_id returning * into v_candidate;

  insert into public.learning_actions(
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'execution_applied', 'preview_ready', 'applied', 'github',
    p_actor_user_id, p_actor_label,
    'execution-applied:' || p_repository || ':' || p_commit_sha,
    jsonb_build_object('repository', p_repository, 'path', p_path, 'commit_sha', p_commit_sha)
  );
  return v_candidate;
end;
$$;

revoke all on function public.save_learning_execution_plan(uuid, jsonb, uuid, text) from public;
revoke all on function public.save_learning_execution_plan(uuid, jsonb, uuid, text) from anon;
revoke all on function public.save_learning_execution_plan(uuid, jsonb, uuid, text) from authenticated;
grant execute on function public.save_learning_execution_plan(uuid, jsonb, uuid, text) to service_role;

revoke all on function public.record_learning_execution_application(uuid, text, text, text, uuid, text) from public;
revoke all on function public.record_learning_execution_application(uuid, text, text, text, uuid, text) from anon;
revoke all on function public.record_learning_execution_application(uuid, text, text, text, uuid, text) from authenticated;
grant execute on function public.record_learning_execution_application(uuid, text, text, text, uuid, text) to service_role;
