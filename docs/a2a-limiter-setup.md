# A2A Redis rate limiter setup (staging only)

Code is committed but **not deployed or configured**.

The Edge Function now requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. It runs a single atomic Redis EVAL per POST and counts requests globally in one-minute buckets. More than 100 requests per minute returns HTTP 429 with Retry-After: 60. Missing configuration, timeouts, or Redis errors produce HTTP 503 (fail closed).

## Before enabling
- Provision a dedicated Upstash Redis instance and store credentials using Supabase Edge Function secrets. Do not commit credentials to GitHub.
- Review the actual deployment security restriction with project administrators; do **not** bypass it.
- Confirm EVAL is supported by the selected Upstash REST plan, and test counters across multiple concurrent instances.
- Consider an external edge WAF for abusive traffic before it reaches Supabase. The limiter is global rather than per-IP and may block legitimate traffic under abuse.
- Validate the 429 and 503 responses with real network tests, and monitor Redis cost/latency.

The GitHub smoke suite uses a mocked Redis REST endpoint; it **does not** establish live distributed rate-limiter correctness.
