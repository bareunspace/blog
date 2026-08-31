create or replace function public.save_learning_promotion_draft(
  p_candidate_id uuid,
  p_analysis jsonb,
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
  v_event_id uuid := gen_random_uuid();
begin
  select * into v_candidate
  from public.learning_candidates
  where id = p_candidate_id
  for update;

  if not found then
    raise exception 'learning_candidate_not_found' using errcode = 'P0002';
  end if;
  if v_candidate.status <> 'approved' then
    raise exception 'candidate_must_be_approved' using errcode = '55000';
  end if;
  if jsonb_typeof(p_analysis) <> 'object' then
    raise exception 'invalid_analysis' using errcode = '22023';
  end if;

  update public.learning_candidates
  set ai_analysis_status = 'completed',
      ai_analysis = p_analysis,
      ai_provider = 'deterministic',
      ai_model = 'promotion-draft-v0.1',
      ai_analyzed_at = now(),
      updated_at = now()
  where id = p_candidate_id
  returning * into v_candidate;

  insert into public.learning_actions (
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'ai_analysis', v_candidate.status, v_candidate.status, 'system',
    p_actor_user_id, p_actor_label, 'promotion-draft:' || v_event_id,
    jsonb_build_object('event_id', v_event_id, 'analysis', p_analysis)
  );

  return v_candidate;
end;
$$;

revoke all on function public.save_learning_promotion_draft(uuid, jsonb, uuid, text) from public;
revoke all on function public.save_learning_promotion_draft(uuid, jsonb, uuid, text) from anon;
revoke all on function public.save_learning_promotion_draft(uuid, jsonb, uuid, text) from authenticated;
grant execute on function public.save_learning_promotion_draft(uuid, jsonb, uuid, text) to service_role;
