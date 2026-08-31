create or replace function public.record_learning_github_pr(
  p_candidate_id uuid,
  p_repository text,
  p_pr_number integer,
  p_pr_url text,
  p_path text,
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
begin
  select * into v_candidate from public.learning_candidates
  where id = p_candidate_id for update;
  if not found then raise exception 'learning_candidate_not_found' using errcode = 'P0002'; end if;
  if v_candidate.status <> 'approved' then raise exception 'candidate_must_be_approved' using errcode = '55000'; end if;
  if v_candidate.ai_analysis_status <> 'completed' then raise exception 'promotion_draft_required' using errcode = '55000'; end if;
  if v_candidate.github_pr_number is not null then return v_candidate; end if;

  update public.learning_candidates
  set github_repo = p_repository,
      github_pr_number = p_pr_number,
      github_pr_url = p_pr_url,
      promoted_path = p_path,
      updated_at = now()
  where id = p_candidate_id
  returning * into v_candidate;

  insert into public.learning_actions (
    candidate_id, action_type, from_status, to_status, actor_type,
    actor_user_id, actor_label, idempotency_key, payload
  ) values (
    p_candidate_id, 'github_pr_created', v_candidate.status, v_candidate.status, 'github',
    p_actor_user_id, p_actor_label, 'github-pr:' || p_repository || ':' || p_pr_number,
    jsonb_build_object('repository', p_repository, 'pr_number', p_pr_number, 'pr_url', p_pr_url, 'path', p_path)
  );
  return v_candidate;
end;
$$;

revoke all on function public.record_learning_github_pr(uuid, text, integer, text, text, uuid, text) from public;
revoke all on function public.record_learning_github_pr(uuid, text, integer, text, text, uuid, text) from anon;
revoke all on function public.record_learning_github_pr(uuid, text, integer, text, text, uuid, text) from authenticated;
grant execute on function public.record_learning_github_pr(uuid, text, integer, text, text, uuid, text) to service_role;
