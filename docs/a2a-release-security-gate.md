# A2A public endpoint release gate

**Status: NOT DEPLOYED — keep PR #49 in Draft.** GitHub Actions confirms the 11-case local smoke suite; this is not an external interoperability or load test.

## Exposure model
- Public, read-only informational service. No customer records, DB access, booking creation, payment or access-code changes.
- Naver Booking is the authority for live availability and final price. Return the booking URL; never assert that a time slot is available.
- Capacity: maximum 8, recommended 6.
- Before public release, install **a real distributed rate limiter at the entry point** (for example, provider-managed edge/WAF rules or the official Supabase Upstash Redis approach). An in-memory JavaScript counter is *not* sufficient for serverless replicas.
- Example initial policy for review: 30 requests/minute/client IP and 1,000 requests/hour across the endpoint, with HTTP 429 and Retry-After on limits. These are proposed thresholds, **not configured settings**.
- Trust client IP only from a documented, protected ingress/proxy. Do not use user-supplied forwarded headers directly without a trusted edge.
- Enable request/error/429 telemetry without logging raw question content, IP addresses longer than operationally needed, or customer personal data.
- Configure cost/budget alerts and a disable/rollback path.

## Required verified checks
1. Rate-limiting enforcement (429) at the public ingress under concurrent requests and from separate sessions.
2. JSON-RPC v0.3 interoperability with an independent A2A client.
3. Hostname, HTTPS and exact function URL verified.
4. No unauthenticated privileged database operations; no service-role secret in the bundle or responses.
5. Valid Naver Booking redirect; clearly show 'maximum 8 / recommended 6'.
6. Live function smoke tests, negative tests and monitoring/rollback.
7. Only after successful verification publish `/.well-known/agent-card.json` with a tested endpoint and accurate security declaration.

## Current blocker
The attempted publicly callable Supabase Edge Function deployment was previously denied by a security check. **Do not bypass or retry the same deployment path until the authorization/security issue is resolved.** Review with the project security administrator. This file does not authorize a public deployment.
