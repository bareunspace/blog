alter table public.learning_candidates
  add column if not exists evidence_validation_status text not null default 'needs_more_evidence',
  add column if not exists evidence_validated_at timestamptz,
  add column if not exists evidence_validation_rule text,
  add column if not exists evidence_validation_summary jsonb not null default '{}'::jsonb;

alter table public.learning_candidates
  drop constraint if exists learning_candidates_evidence_validation_status_check;

alter table public.learning_candidates
  add constraint learning_candidates_evidence_validation_status_check
  check (evidence_validation_status in ('needs_more_evidence', 'validated'));

alter table public.learning_actions
  drop constraint if exists learning_actions_type_check;

alter table public.learning_actions
  add constraint learning_actions_type_check check (action_type in (
    'detected', 'evidence_added', 'evidence_evaluated', 'ai_analysis',
    'status_transition', 'human_review', 'github_pr_created', 'github_pr_updated',
    'kb_promoted', 'experiment_started', 'outcome_recorded', 'archived'
  ));

create or replace function public.evaluate_learning_evidence(p_candidate_id uuid default null)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate public.learning_candidates;
  v_evidence public.learning_evidence;
  v_bookings integer;
  v_customers integer;
  v_active_weeks integer;
  v_is_validated boolean;
  v_summary jsonb;
  v_processed integer := 0;
begin
  for v_candidate in
    select * from public.learning_candidates
    where (p_candidate_id is null or id = p_candidate_id)
      and review_decision = 'approved'
    for update skip locked
  loop
    select * into v_evidence
    from public.learning_evidence
    where candidate_id = v_candidate.id
    order by created_at desc
    limit 1;

    v_bookings := coalesce(v_evidence.sample_size, 0);
    v_customers := coalesce((v_evidence.payload ->> 'distinct_customers')::integer, 0);
    v_active_weeks := coalesce((v_evidence.payload ->> 'active_weeks')::integer, 0);
    v_is_validated := v_bookings >= 10
      and v_customers >= 5
      and v_active_weeks >= 3
      and coalesce(v_candidate.confidence, 0) >= 0.85;

    v_summary := jsonb_build_object(
      'evaluated_at', now(),
      'bookings', v_bookings,
      'distinct_customers', v_customers,
      'active_weeks', v_active_weeks,
      'confidence', v_candidate.confidence,
      'thresholds', jsonb_build_object(
        'bookings', 10,
        'distinct_customers', 5,
        'active_weeks', 3,
        'confidence', 0.85,
        'human_approval_required', true
      ),
      'result', case when v_is_validated then 'validated' else 'needs_more_evidence' end
    );

    update public.learning_candidates
    set evidence_validation_status = case when v_is_validated then 'validated' else 'needs_more_evidence' end,
        evidence_validated_at = case when v_is_validated then coalesce(evidence_validated_at, now()) else null end,
        evidence_validation_rule = 'strong_repeat_demand_v1',
        evidence_validation_summary = v_summary,
        updated_at = now()
    where id = v_candidate.id;

    insert into public.learning_actions(
      candidate_id, action_type, from_status, to_status, actor_type,
      actor_label, idempotency_key, payload
    ) values (
      v_candidate.id, 'evidence_evaluated', v_candidate.status, v_candidate.status, 'system',
      'strong-repeat-demand@1.0.0',
      'evidence-evaluated:' || v_candidate.id || ':strong_repeat_demand_v1:' ||
        case when v_is_validated then 'validated' else 'needs_more_evidence' end,
      v_summary
    ) on conflict (idempotency_key) do nothing;

    v_processed := v_processed + 1;
  end loop;

  return jsonb_build_object('ok', true, 'processed', v_processed);
end;
$$;

revoke all on function public.evaluate_learning_evidence(uuid) from public;
revoke all on function public.evaluate_learning_evidence(uuid) from anon;
revoke all on function public.evaluate_learning_evidence(uuid) from authenticated;
grant execute on function public.evaluate_learning_evidence(uuid) to service_role;

select public.evaluate_learning_evidence();
