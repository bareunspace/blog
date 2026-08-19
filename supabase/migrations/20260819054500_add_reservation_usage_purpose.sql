alter table public.reservations
  add column if not exists usage_purpose text;
