import assert from "node:assert/strict";

let handler;
globalThis.Deno = { serve: fn => { handler = fn; } };
await import("../supabase/functions/bareunjari-a2a/index.ts");

const rpc = (method = "message/send", message = {
  kind: "message", messageId: "test-1", role: "user",
  parts: [{ kind: "text", text: "면접 공간 인원 알려줘" }],
}) => ({ jsonrpc: "2.0", id: "test-req", method, params: { message } });

const post = async payload => handler(new Request("http://localhost", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: typeof payload === "string" ? payload : JSON.stringify(payload),
}));

let passed = 0;
async function check(name, fn) {
  await fn(); passed++; console.log("PASS", name);
}

await check("maximum 8, recommended 6", async () => {
  const result = await (await post(rpc())).json();
  assert.equal(result.result.kind, "message");
  assert.equal(result.result.role, "agent");
  assert.match(result.result.parts[0].text, /최대 8명, 권장 6명/);
});
await check("Naver booking without claiming availability", async () => {
  const result = await (await post(rpc("message/send", {
    kind: "message", messageId: "test-2", role: "user",
    parts: [{ kind: "text", text: "내일 예약 가능해?" }],
  }))).json();
  assert.match(result.result.parts[0].text, /booking.naver.com/);
  assert.match(result.result.parts[0].text, /직접 확인/);
});
await check("invalid JSON", async () => assert.equal((await (await post("{bad")).json()).error.code, -32700));
await check("unsupported method", async () => assert.equal((await (await post(rpc("unknown"))).json()).error.code, -32601));
await check("invalid message", async () => assert.equal((await (await post(rpc("message/send", { role: "user", messageId: "test-3", parts: [] }))).json()).error.code, -32602));
await check("large request rejected", async () => assert.equal((await post("x".repeat(4097))).status, 413));
await check("GET rejected", async () => assert.equal((await handler(new Request("http://localhost"))).status, 405));
await check("OPTIONS accepted", async () => assert.equal((await handler(new Request("http://localhost", { method: "OPTIONS" }))).status, 204));
console.log(`Passed ${passed}/8`);
