import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

// Read-only aggregate endpoint: cumulative GSC clicks/impressions per /posts/
// page over a rolling window. No PII, no per-query detail -- just enough for
// scripts/automation/refresh_guide_ranking.py (run weekly via GitHub Actions)
// to re-rank the homepage practical-guides grid without needing the
// service_role key as a CI secret. gsc_page_daily itself is RLS-locked to
// service_role only, which is why this function exists instead of calling
// PostgREST directly with the public anon key.
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ ok: false, error: "server_config" }, 500);
    }

    const url = new URL(req.url);
    const daysParam = Number(url.searchParams.get("days") ?? "90");
    const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 400 ? Math.floor(daysParam) : 90;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const pageSize = 1000;
    let from = 0;
    const allRows: { page: string; clicks: number; impressions: number }[] = [];
    while (true) {
      const { data, error } = await admin
        .from("gsc_page_daily")
        .select("page,clicks,impressions")
        .gte("date", cutoff)
        .like("page", "%/posts/%")
        .range(from, from + pageSize - 1);

      if (error) {
        console.error("guide_performance_query_failed", error.message);
        return json({ ok: false, error: "query_failed" }, 500);
      }

      const rows = data ?? [];
      allRows.push(...rows);
      if (rows.length < pageSize) break;
      from += pageSize;
    }

    const totals = new Map<string, { clicks: number; impressions: number }>();
    for (const row of allRows) {
      const path = String(row.page || "").replace(/^https?:\/\/[^/]+/, "");
      if (!path) continue;
      const entry = totals.get(path) ?? { clicks: 0, impressions: 0 };
      entry.clicks += Number(row.clicks ?? 0);
      entry.impressions += Number(row.impressions ?? 0);
      totals.set(path, entry);
    }

    // Stable tie-breaker (url asc) so equal clicks/impressions don't produce
    // a nondeterministic order across runs -- the Map's insertion order
    // depends on the underlying query's row order, which PostgREST doesn't
    // guarantee.
    const ranked = Array.from(totals.entries())
      .map(([url, totalsForUrl]) => ({ url, clicks: totalsForUrl.clicks, impressions: totalsForUrl.impressions }))
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.url.localeCompare(b.url));

    return json({
      ok: true,
      window_days: days,
      from_date: cutoff,
      generated_at: new Date().toISOString(),
      rows: ranked,
    });
  } catch (error) {
    console.error("guide_performance_unhandled", error);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
