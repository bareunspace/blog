-- Prepare the existing reservations ledger for future direct-site booking.
-- SAFETY: additive only. Existing Naver reservation columns, rows, policies,
-- constraints, Zapier writes, and live booking flow are intentionally unchanged.
-- This migration is prepared in Git only and should be reviewed before applying
-- to the production Supabase project.

begin;

alter table public.reservations
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists branch_slug text,
  add column if not exists room_id text,
  add column if not exists payment_provider text,
  add column if not exists payment_id text,
  add column if not exists naver_block_status text,
  add column if not exists naver_blocked_at timestamptz;

comment on column public.reservations.customer_phone is
  'Direct-site booking customer phone. Keep null for existing Naver rows unless explicitly supplied.';
comment on column public.reservations.customer_email is
  'Direct-site booking customer email. Keep null for existing Naver rows unless explicitly supplied.';
comment on column public.reservations.branch_slug is
  'Branch identifier for multi-branch readiness, e.g. bucheon-sinjungdong.';
comment on column public.reservations.room_id is
  'Optional room identifier for future multi-room scheduling.';
comment on column public.reservations.payment_provider is
  'Payment provider for direct-site payments, e.g. kcp. Separate from payment_method.';
comment on column public.reservations.payment_id is
  'External payment transaction/payment identifier for reconciliation.';
comment on column public.reservations.naver_block_status is
  'Manual Naver-calendar blocking workflow for direct-site reservations: pending, done, not_needed.';
comment on column public.reservations.naver_blocked_at is
  'Timestamp when an administrator confirmed the matching Naver time was blocked.';

-- Do not backfill existing Naver rows. NULL means the workflow does not apply
-- to legacy/current Naver-origin reservations.
-- The constraint permits NULL for all existing rows and limits future values.
alter table public.reservations
  drop constraint if exists reservations_naver_block_status_check;

alter table public.reservations
  add constraint reservations_naver_block_status_check
  check (
    naver_block_status is null
    or naver_block_status in ('pending', 'done', 'not_needed')
  );

-- Helpful for the future admin queue without changing current query behavior.
create index if not exists reservations_source_start_at_idx
  on public.reservations (source, start_at);

create index if not exists reservations_naver_block_status_idx
  on public.reservations (naver_block_status)
  where naver_block_status is not null;

commit;
