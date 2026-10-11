# A2A v0.3 smoke test (after authorized deployment)

The code in this branch is a **prototype**, not a public live endpoint. Run this against a deployed staging URL before publishing an Agent Card.

```bash
A2A_URL="https://PROJECT_REF.supabase.co/functions/v1/bareunjari-a2a"

curl -sS -i -X POST "$A2A_URL" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":"smoke-1","method":"message/send","params":{"message":{"kind":"message","messageId":"test-1","role":"user","parts":[{"kind":"text","text":"면접 연습 3명 예약하려면?"}]}}}'
```

Expected: a JSON-RPC response with `result.kind = "message"`, `result.role = "agent"`, a `kind: "text"` part, and the official Naver Booking URL. The response must **not** claim real-time availability or create a reservation.

Also test:
- Invalid JSON -> code -32700
- Unsupported method -> code -32601
- Missing user parts -> code -32602
- Request body >4096 characters -> HTTP 413
- Request never reads Supabase reservation records, access codes or personal customer data

Before production: review rate limiting, validate v0.3 interoperability with a real A2A client, verify operation under traffic, then publish a valid Agent Card. The public function deployment was previously blocked by the hosting security gate; do not claim that deployment succeeded or bypass that gate.
