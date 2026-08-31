create or replace function public.review_learning_candidate(
  p_candidate_id uuid,
  p_decision text,
  p_note text,
  p_reviewer_id uuid,
  p_reviewer_email text
)
returns public.learning_candidates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate public.learning_candidates;
  v_previous_status text;
  v_next_status text;
  v_review_decision text;
  v_review_event_id uuid := gen_random_uuid();
  v_note text := nullif(btrim(p_note), '');
begin
  if p_decision not in ('approved', 'hold', 'rejected') then
    raise exception 'invalid_review_decision' using errcode = '22023';
  end if;

  if length(coalesce(v_note, '')) > 2000 then
    raise exception 'review_note_too_long' using errcode = '22001';
  end if;

  select * into v_candidate
  from public.learning_candidates
  where id = p_candidate_id
  for update;

  if not found then
    raise exception 'learning_candidate_not_found' using errcode = 'P0002';
  end if;

  if v_candidate.status not in ('detected', 'pending_review', 'approved', 'rejected') then
    raise exception 'learning_candidate_not_reviewable' using errcode = '55000';
  end if;

  v_previous_status := v_candidate.status;
  v_next_status := case p_decision
    when 'approved' then 'approved'
    when 'hold' then 'pending_review'
    when 'rejected' then 'rejected'
  end;
  v_review_decision := case p_decision
    when 'approved' then 'approved'
    when 'hold' then 'needs_more_evidence'
    when 'rejected' then 'rejected'
  end;

  update public.learning_candidates
  set status = v_next_status,
      review_decision = v_review_decision,
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      review_note = v_note,
      updated_at = now()
  where id = p_candidate_id
  returning * into v_candidate;

  insert into public.learning_actions (
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'human_review', v_previous_status, v_next_status, 'human',
    p_reviewer_id, p_reviewer_email, 'review:' || v_review_event_id || ':human',
    jsonb_build_object('review_event_id', v_review_event_id, 'decision', p_decision, 'note', v_note)
  );

  insert into public.learning_actions (
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'status_transition', v_previous_status, v_next_status, 'human',
    p_reviewer_id, p_reviewer_email, 'review:' || v_review_event_id || ':status',
    jsonb_build_object('review_event_id', v_review_event_id, 'decision', p_decision)
  );

  return v_candidate;
end;
$$;

revoke all on function public.review_learning_candidate(uuid, text, text, uuid, text) from public;
revoke all on function public.review_learning_candidate(uuid, text, text, uuid, text) from anon;
revoke all on function public.review_learning_candidate(uuid, text, text, uuid, text) from authenticated;
grant execute on function public.review_learning_candidate(uuid, text, text, uuid, text) to service_role;
