import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const allowedOrigins = new Set([
  "https://bareunjari.com",
  "https://www.bareunjari.com"
]);

const corsHeadersFor = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://bareunjari.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-retry-count, traceparent, tracestate, baggage",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
};

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("missing_server_env");

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    const email = userData.user?.email?.toLowerCase() || "";
    if (userError || !email) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: adminRow, error: adminError } = await admin
      .from("admin_users")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (adminError || !adminRow?.email) return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const reservationNumber = String(body?.reservationNumber || "").trim();
    if (!reservationNumber) return new Response(JSON.stringify({ ok: false, error: "reservation_number_required" }), { status: 400, headers: corsHeaders });

    const { data, error } = await admin.rpc("service_reservation_message_dry_run", {
      p_reservation_number: reservationNumber,
      p_actor_email: email
    });
    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("reservation-message-dry-run failed", error);
    return new Response(JSON.stringify({ ok: false, error: "dry_run_failed" }), { status: 500, headers: corsHeaders });
  }
});
