# Barunjari Supabase + Vercel Minimal Setup

This repository is a Jekyll static site. You can keep static pages as-is and add only the dynamic parts with Supabase and Vercel.

## 1) Do we need a `supabase/` directory?

Not mandatory for simple API usage, but strongly recommended when you want versioned schema/RLS and team-safe deployments.

## 2) Recommended project layout

- `supabase/migrations/`: SQL schema and RLS policy history
- `.env.example`: required environment variable names

## 3) Environment variables

Set the same variable names in Vercel Project Settings > Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

Security rules:

- `SUPABASE_ANON_KEY`: can be used in frontend code.
- `SUPABASE_SERVICE_ROLE_KEY`: only for server functions, never in frontend or static HTML.

## 4) Vercel build settings (Jekyll)

- Framework preset: Other
- Build command: `bundle exec jekyll build`
- Output directory: `_site`

## 5) Apply migrations with Supabase CLI (when ready)

If Supabase CLI is not installed:

```bash
brew install supabase/tap/supabase
```

Then:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## 6) Login implementation checklist

- Enable Auth providers in Supabase Auth settings (Email, Kakao, Google, etc).
- Keep user profile data in `public.profiles`.
- Turn on RLS for every user data table.
- Allow each user to access only their own rows.

Use the migration in `supabase/migrations/` as a baseline.
