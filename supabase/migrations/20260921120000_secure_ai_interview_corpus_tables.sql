-- ai_interview_question_corpus and ai_interview_qa_corpus were created without
-- row level security or access grants, unlike every other public table. With RLS
-- disabled, the tables are reachable through PostgREST with the public anon key.
-- Only supabase/functions/ai-interview-feedback (service_role client) reads or
-- writes these tables today, so locking them down to service_role only does not
-- change any existing behavior.

alter table public.ai_interview_question_corpus enable row level security;
alter table public.ai_interview_qa_corpus enable row level security;

revoke all on table public.ai_interview_question_corpus from anon, authenticated;
revoke all on table public.ai_interview_qa_corpus from anon, authenticated;

grant all on table public.ai_interview_question_corpus to service_role;
grant all on table public.ai_interview_qa_corpus to service_role;

grant usage, select on sequence public.ai_interview_question_corpus_id_seq to service_role;
grant usage, select on sequence public.ai_interview_qa_corpus_id_seq to service_role;
