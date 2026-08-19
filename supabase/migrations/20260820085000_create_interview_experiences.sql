create table if not exists public.interview_experiences (
  id bigint generated always as identity primary key,
  result text not null check (result = any (array['passed','rejected','next_stage','pending','undisclosed']::text[])),
  company_name text null check (company_name is null or char_length(btrim(company_name)) <= 80),
  job_role text null check (job_role is null or char_length(btrim(job_role)) <= 80),
  interview_actions text[] not null default '{}'::text[] check (interview_actions <@ array['general_qa','experience_explanation','pt_presentation','task_explanation','situational_response','video_ai','other']::text[]),
  preparation_actions text[] not null default '{}'::text[] check (preparation_actions <@ array['self_intro','experience_examples','ai_answer_practice','hiring_process_check','full_rehearsal','final_check','other']::text[]),
  journey_completed_tasks text[] not null default '{}'::text[] check (journey_completed_tasks <@ array['self_intro','experience_examples','ai_answer_practice','hiring_process_check','full_rehearsal','final_check']::text[]),
  helpful_preparation text null check (helpful_preparation is null or char_length(helpful_preparation) <= 800),
  unexpected_point text null check (unexpected_point is null or char_length(unexpected_point) <= 800),
  analysis_consent boolean not null default false check (analysis_consent = true),
  public_consent boolean not null default false,
  visitor_token uuid not null,
  source_path text null check (source_path is null or char_length(source_path) <= 200),
  moderation_status text not null default 'pending' check (moderation_status = any (array['pending','approved','rejected']::text[])),
  public_excerpt text null check (public_excerpt is null or char_length(public_excerpt) <= 500),
  public_company_label text null check (public_company_label is null or char_length(public_company_label) <= 80),
  admin_note text null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.interview_experiences enable row level security;

create index if not exists interview_experiences_created_at_idx on public.interview_experiences (created_at desc);
create index if not exists interview_experiences_moderation_idx on public.interview_experiences (moderation_status, public_consent, created_at desc);
create index if not exists interview_experiences_company_idx on public.interview_experiences (company_name) where company_name is not null;
create index if not exists interview_experiences_interview_actions_gin on public.interview_experiences using gin (interview_actions);
create index if not exists interview_experiences_preparation_actions_gin on public.interview_experiences using gin (preparation_actions);

drop trigger if exists interview_experiences_set_updated_at on public.interview_experiences;
create trigger interview_experiences_set_updated_at
before update on public.interview_experiences
for each row execute function public.set_updated_at();

revoke all on table public.interview_experiences from anon, authenticated;
grant select, update on table public.interview_experiences to authenticated;
grant all on table public.interview_experiences to service_role;
grant usage, select on sequence public.interview_experiences_id_seq to service_role;

drop policy if exists interview_experiences_admin_select on public.interview_experiences;
create policy interview_experiences_admin_select
on public.interview_experiences
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists interview_experiences_admin_update on public.interview_experiences;
create policy interview_experiences_admin_update
on public.interview_experiences
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
