// Barunjari public, read-only A2A JSON-RPC prototype.
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

function answer(question: string): string {
  if (/예약|빈.?시간|날짜|availability|available|booking|book/i.test(question)) {
    return `예약 가능한 날짜·시간과 최종 요금은 네이버 예약에서 직접 확인하세요. 이 에이전트는 실시간 네이버 달력을 조회하거나 예약을 생성하지 않습니다. 네이버 예약: ${NAVER} / 안내: ${PAGE}`;
  }
  return `바른자리는 부천 신중동역 도보 약 1분, 경기도 부천시 원미구 신흥로 223 114호의 단독 공간대여 서비스입니다. 최대 8명, 권장 6명. 면접·발표 연습, 스터디, 상담, 미팅, 촬영에 사용할 수 있습니다. 기본 1시간 10,000원, 추가 30분 5,000원이며 할인·최종 요금은 네이버에서 확인하세요. 네이버 예약: ${NAVER} / 상세: ${PAGE}`;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const bodyText = await request.text();
  if (bodyText.length > 4096) return json({ error: "Payload too large" }, 413);
  let rpc: Record<string, any>;
  try { rpc = JSON.parse(bodyText); }
  catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  const id = rpc?.id ?? null;
  if (rpc?.jsonrpc !== "2.0" || !Object.hasOwn(rpc, "id") || typeof rpc.method !== "string")
    return json({ jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid request" } });
  if (rpc.method !== "SendMessage")
    return json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  const incoming = rpc.params?.message;
  if (incoming?.role !== "ROLE_USER" || !Array.isArray(incoming.parts) || !incoming.parts.length || typeof incoming.messageId !== "string")
    return json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Invalid params" } });
  const question = incoming.parts.filter((p: any) => typeof p?.text === "string").map((p: any) => p.text).join(" ").slice(0,500);
  return json({
    jsonrpc: "2.0", id,
    result: {
      message: {
        role: "ROLE_AGENT",
        messageId: crypto.randomUUID(),
        contextId: incoming.contextId || crypto.randomUUID(),
        parts: [{ text: answer(question) }],
      },
    },
  });
});
