# Decap OAuth Worker (Cloudflare)

This Worker provides `/auth` and `/callback` endpoints for Decap CMS on GitHub Pages.

## 1) Prerequisites

- Cloudflare account
- GitHub OAuth App
  - Homepage URL: `https://bareunjari.com`
  - Authorization callback URL: `https://oauth.bareunjari.com/callback`

## 2) Install and login

```bash
cd oauth-worker
npm install
npx wrangler login
```

## 3) Configure secrets

```bash
npx wrangler secret put OAUTH_CLIENT_ID
npx wrangler secret put OAUTH_CLIENT_SECRET
npx wrangler secret put ORIGIN
```

Use this exact ORIGIN value:

```text
https://bareunjari.com
```

Optional, if you want fixed public URL for callback generation:

```bash
npx wrangler secret put PUBLIC_BASE_URL
```

Value example:

```text
https://oauth.bareunjari.com
```

## 4) Deploy

```bash
npm run deploy
```

## 5) Attach custom domain

In Cloudflare Worker settings, add custom domain:

```text
oauth.bareunjari.com
```

Then verify endpoints:

- `https://oauth.bareunjari.com/health` -> `ok`
- `https://oauth.bareunjari.com/auth` -> redirects to GitHub login

## 6) Wire to Decap CMS

Set these values in `admin/config.yml`:

```yml
backend:
  name: github
  repo: bareunspace/blog
  branch: main
  base_url: https://oauth.bareunjari.com
  auth_endpoint: auth
```

Then open:

```text
https://bareunjari.com/admin/
```

If login fails, check:

- OAuth app callback URL exactly matches `/callback`
- Worker secrets are set
- `ORIGIN` is exactly `https://bareunjari.com`
