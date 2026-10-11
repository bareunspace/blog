# Barunjari A2A (staged, not deployed)

## Status
This branch contains a read-only A2A JSON-RPC prototype. **No public A2A endpoint has been deployed.**
The production site must not publish an Agent Card until the endpoint passes real-client tests.

## Architecture
- Jekyll / GitHub Pages remains the public website and existing AIO markup remains unchanged.
- Supabase Edge Function `bareunjari-a2a` answers public questions and points users to the existing Naver booking page.
- Naver Booking remains the only final source of bookable dates, hours, prices, payments and confirmations.
- No new availability API, booking endpoint, database writes, customer data or access codes.

## Proposed activation (requires deployment approval)
1. Review the prototype's compliance with the supported A2A protocol version.
2. Add rate limiting, abuse monitoring and ensure request payload limits.
3. Deploy the edge function with a deliberately public, restricted read-only interface.
4. Test valid/invalid `SendMessage` calls and client interoperability.
5. Only after success, publish `/.well-known/agent-card.json` on bareunjari.com with the verified function URL.
6. Roll back by removing the Agent Card and disabling the Edge Function if unexpected access or abuse appears.

## Data consistency to resolve before go-live
- `_data/operations.yml`: maximum 8 people, recommended 6 people.
- `_includes/jsonld-home.html`: `maximumAttendeeCapacity` is currently 6; align semantic distinction with operational policy.
- Use `_data/operations.yml` as the source of current product prices and booking links.
