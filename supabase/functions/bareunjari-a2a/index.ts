// Barunjari public, read-only A2A v0.3 JSON-RPC prototype.
// No Supabase data access, reservation writes, payment or customer information.
const NAVER = "https://booking.naver.com/booking/10/bizes/1663159/items/7861240";
const PAGE = "https://bareunjari.com/booking/";
const cors = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, a2a-version",
  "cache-control": "no-store",
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: cors });


// Distributed global minute budget using atomic Redis EVAL. Fails closed when
// credentials are missing or the limiter is unavailable; no client identifiers stored.
async function rateLimit(): Promise<Response | null> {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token || !url.startsWith("https://"))
    return json({ error: "Rate limiter unavailable" }, 503);
  const minute = Math.floor(Date.now() / 60000);
  const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],120) end; return n";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", script, "1", `bareunjari:a2a:${minute}`]),
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return json({ error: "Rate limiter unavailable" }, 503);
    const body = await response.json();
    if (!Number.isInteger(body.result) || body.result < 1) return json({ error: "Rate limiter unavailable" }, 503);
    if (body.result > 100) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...cors, "retry-after": "60" },
    });
    return null;
  } catch {
    return json({ error: "Rate limiter unavailable" }, 503);
  }
}

function answer(question: string): string {
  if (/예약|빈.?시간|날짜|availability|available|booking|book/i.test(question)) {
    return `예약 가능한 날짜·시간과 최종 요금은 네이버 예약에서 직접 확인하세요. 이 에이전트는 실시간 네이버 달력을 조회하거나 예약을 생성하지 않습니다. 네이버 예약: ${NAVER} / 안내: ${PAGE}`;
  }
  return `바른자리는 부천 신중동역 도보 약 1분, 경기도 부천시 원미구 신흥로 223 114호의 단독 공간대여 서비스입니다. 최대 8명, 권장 6명. 면접·발표 연습, 스터디, 상담, 미팅, 촬영에 사용할 수 있습니다. 기본 1시간 10,000원, 추가 30분 5,000원이며 할인·최종 요금은 네이버에서 확인하세요. 네이버 예약: ${NAVER} / 상세: ${PAGE}`;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const limited = await rateLimit();
  if (limited) return limited;
  // Bound the actual streamed body, not just Content-Length (which may be missing).
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return json({ error: "Content-Type must be application/json" }, 415);
  const maxBytes = 4096;
  const bytes: Uint8Array[] = [];
  let total = 0;
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "Missing request body" }, 400);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return json({ error: "Payload too large" }, 413);
    }
    bytes.push(value);
  }
  const input = new Uint8Array(total);
  let offset = 0;
  for (const chunk of bytes) { input.set(chunk, offset); offset += chunk.byteLength; }
  let bodyText: string;
  try { bodyText = new TextDecoder("utf-8", { fatal: true }).decode(input); }
  catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid UTF-8" } }, 400); }
  let rpc: Record<string, any>;
  try { rpc = JSON.parse(bodyText); }
  catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  const id = rpc?.id ?? null;
  if (rpc?.jsonrpc !== "2.0" || !Object.hasOwn(rpc, "id") || typeof rpc.method !== "string")
    return json({ jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid request" } });
  if (rpc.method === "tasks/get" || rpc.method === "tasks/cancel") {
    if (typeof rpc.params?.id !== "string" || !rpc.params.id.trim())
      return json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Invalid params" } });
    // This informational agent returns synchronous messages and creates no tasks.
    return json({ jsonrpc: "2.0", id, error: { code: -32001, message: "Task not found" } });
  }
  if (rpc.method !== "message/send")
    return json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  const incoming = rpc.params?.message;
  if (incoming?.kind !== "message" || incoming?.role !== "user" || !Array.isArray(incoming.parts) || !incoming.parts.length || incoming.parts.length > 10 || typeof incoming.messageId !== "string" || incoming.messageId.length > 128 || !incoming.parts.every((p: any) => p?.kind === "text" && typeof p?.text === "string"))
    return json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Invalid params" } });
  const question = incoming.parts.filter((p: any) => p?.kind === "text" && typeof p?.text === "string").map((p: any) => p.text).join(" ").slice(0,500);
  return json({
    jsonrpc: "2.0", id,
    result: {
        kind: "message",
        role: "agent",
        messageId: crypto.randomUUID(),
        contextId: incoming.contextId || crypto.randomUUID(),
        parts: [{ kind: "text", text: answer(question) }],
    },
  });
});
