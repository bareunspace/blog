alter table public.learning_actions
  drop constraint if exists learning_actions_type_check;

alter table public.learning_actions
  add constraint learning_actions_type_check
  check (
    action_type = any (
      array[
        'detected'::text,
        'evidence_added'::text,
        'evidence_evaluated'::text,
        'ai_analysis'::text,
        'status_transition'::text,
        'human_review'::text,
        'decision_override'::text,
        'execution_planned'::text,
        'execution_applied'::text,
        'execution_paused'::text,
        'execution_resumed'::text,
        'execution_failed'::text,
        'github_pr_created'::text,
        'github_pr_updated'::text,
        'kb_promoted'::text,
        'experiment_started'::text,
        'outcome_recorded'::text,
        'archived'::text
      ]
    )
  );
