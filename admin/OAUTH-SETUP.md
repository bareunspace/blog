# Decap CMS OAuth setup (GitHub Pages)

The login error `Missing required parameter: client_id.` means your OAuth bridge is not configured with a GitHub OAuth App client ID/secret.

## Why it fails now

- `admin/config.yml` currently uses placeholder values:
  - `base_url: https://YOUR-OAUTH-BRIDGE.example.com`
  - `auth_endpoint: auth`
- Without a deployed OAuth bridge, Decap cannot start GitHub login.

## What to do

1. Create a GitHub OAuth App
- Homepage URL: `https://bareunjari.com`
- Authorization callback URL: `https://<your-oauth-bridge-domain>/callback`

2. Deploy an OAuth bridge (choose one)
- `decap-cms-oauth-client` on Cloudflare/Render/Railway
- Any compatible Decap OAuth proxy

3. Set environment variables on the OAuth bridge
- `OAUTH_CLIENT_ID=<GitHub OAuth App Client ID>`
- `OAUTH_CLIENT_SECRET=<GitHub OAuth App Client Secret>`
- `ORIGIN=https://bareunjari.com`

4. Update `admin/config.yml`
- `base_url` -> your deployed bridge domain
- `auth_endpoint` -> usually `auth`

5. Test
- Open `https://bareunjari.com/admin/`
- Click Login with GitHub

## Quick local-only fallback (no production login)

For local content editing only:

1. Keep `local_backend: true`
2. Run local proxy server supported by Decap
3. Open local site and edit without production OAuth

This does not enable login on the deployed GitHub Pages site.
