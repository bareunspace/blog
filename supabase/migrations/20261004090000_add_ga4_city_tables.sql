-- City-level GA4 metrics, mirroring ga4_daily / ga4_landing_daily: RLS enabled,
-- no policies. anon/authenticated still hold table grants via this project's
-- default privileges (confirmed against ga4_daily/ga4_landing_daily), but with
-- zero policies RLS denies all access to them — only service_role (which
-- bypasses RLS) can read or write these tables.

create table if not exists public.ga4_city_daily (
  date date not null,
  region text not null,
  city text not null,
  sessions integer not null default 0,
  active_users integer not null default 0,
  new_users integer not null default 0,
  engaged_sessions integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (date, region, city)
);
comment on table public.ga4_city_daily is 'Daily GA4 sessions/users by region+city dimension.';

alter table public.ga4_city_daily enable row level security;

create table if not exists public.ga4_city_booking_daily (
  date date not null,
  region text not null,
  city text not null,
  event_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (date, region, city)
);
comment on table public.ga4_city_booking_daily is 'Daily naver_booking_click event counts by region+city dimension.';

alter table public.ga4_city_booking_daily enable row level security;
