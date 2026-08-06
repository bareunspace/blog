alter table if exists public.ai_interview_question_corpus
  add column if not exists fit_yes_count integer not null default 0,
  add column if not exists fit_no_count integer not null default 0,
  add column if not exists answer_count integer not null default 0,
  add column if not exists avg_answer_length numeric(8,2) not null default 0,
  add column if not exists last_feedback_at timestamptz;

create or replace view public.ai_interview_question_corpus_ranked as
select
  c.*,
  case
    when (c.fit_yes_count + c.fit_no_count) = 0 then 0.5
    else c.fit_yes_count::numeric / nullif((c.fit_yes_count + c.fit_no_count), 0)::numeric
  end as fit_rate,
  greatest(0, least(100, c.avg_answer_length / 2.2)) as answer_length_score,
  round(
    (c.quality_score::numeric * 0.5)
    + (least(c.reuse_count, 20)::numeric * 1.2)
    + (
      case
        when (c.fit_yes_count + c.fit_no_count) = 0 then 0.5
        else c.fit_yes_count::numeric / nullif((c.fit_yes_count + c.fit_no_count), 0)::numeric
      end
      * 25
    )
    + (greatest(0, least(100, c.avg_answer_length / 2.2)) * 0.13),
    2
  ) as rank_score
from public.ai_interview_question_corpus c;
