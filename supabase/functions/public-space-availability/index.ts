import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Interval = { start: Date; end: Date };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function mergeIntervals(intervals: Interval[]) {
  const sorted = intervals
    .filter((v) => v.end.getTime() > v.start.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.start.getTime() > last.end.getTime()) {
      merged.push({ start: new Date(interval.start), end: new Date(interval.end) });
    } else if (interval.end.getTime() > last.end.getTime()) {
      last.end = new Date(interval.end);
    }
  }
  return merged;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !secret) return json({ ok: false, error: "server_config" }, 500);

    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const now = new Date();
    const lookAhead = new Date(now.getTime() + 14 * 86400000);
    const { data, error } = await admin
      .from("reservations")
      .select("start_at,end_at")
      .eq("status", "confirmed")
      .not("start_at", "is", null)
      .not("end_at", "is", null)
      .gte("end_at", now.toISOString())
      .lte("start_at", lookAhead.toISOString())
      .order("start_at", { ascending: true })
      .limit(200);

    if (error) return json({ ok: false, error: "availability_query_failed" }, 500);

    const intervals = mergeIntervals((data ?? []).map((row) => ({
      start: new Date(String(row.start_at)),
      end: new Date(String(row.end_at)),
    })).filter((v) => Number.isFinite(v.start.getTime()) && Number.isFinite(v.end.getTime()) && v.end.getTime() > now.getTime()));

    const active = intervals.find((v) => v.start.getTime() <= now.getTime() && now.getTime() < v.end.getTime());
    if (active) {
      const next = intervals.find((v) => v.start.getTime() > active.end.getTime());
      return json({ ok: true, status: "occupied", serverNow: now.toISOString(), busyUntil: active.end.toISOString(), nextReservationStart: next?.start.toISOString() ?? null });
    }

    const next = intervals.find((v) => v.start.getTime() > now.getTime());
    return json({ ok: true, status: "available", serverNow: now.toISOString(), availableUntil: next?.start.toISOString() ?? null, nextReservationStart: next?.start.toISOString() ?? null });
  } catch {
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
