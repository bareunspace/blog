create or replace function public.record_learning_kb_promotion(
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
  v_previous_status text;
begin
  select * into v_candidate from public.learning_candidates
  where id = p_candidate_id for update;
  if not found then raise exception 'learning_candidate_not_found' using errcode = 'P0002'; end if;
  if v_candidate.status = 'promoted' then return v_candidate; end if;
  if v_candidate.status <> 'approved' then raise exception 'candidate_must_be_approved' using errcode = '55000'; end if;
  if v_candidate.ai_analysis_status <> 'completed' then raise exception 'promotion_draft_required' using errcode = '55000'; end if;
  v_previous_status := v_candidate.status;

  update public.learning_candidates
  set status = 'promoted',
      github_repo = p_repository,
      promoted_path = p_path,
      promoted_commit_sha = p_commit_sha,
      promoted_at = now(),
      outcome_status = 'pending',
      outcome_due_at = now() + interval '28 days',
      updated_at = now()
  where id = p_candidate_id
  returning * into v_candidate;

  insert into public.learning_actions (
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'kb_promoted', v_previous_status, 'promoted', 'github',
    p_actor_user_id, p_actor_label, 'kb-promoted:' || p_repository || ':' || p_commit_sha,
    jsonb_build_object('repository', p_repository, 'path', p_path, 'commit_sha', p_commit_sha)
  );

  insert into public.learning_actions (
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'status_transition', v_previous_status, 'promoted', 'system',
    p_actor_user_id, p_actor_label, 'kb-promoted-status:' || p_repository || ':' || p_commit_sha,
    jsonb_build_object('reason', 'knowledge_base_direct_commit')
  );
  return v_candidate;
end;
$$;

revoke all on function public.record_learning_kb_promotion(uuid, text, text, text, uuid, text) from public;
revoke all on function public.record_learning_kb_promotion(uuid, text, text, text, uuid, text) from anon;
revoke all on function public.record_learning_kb_promotion(uuid, text, text, text, uuid, text) from authenticated;
grant execute on function public.record_learning_kb_promotion(uuid, text, text, text, uuid, text) to service_role;
