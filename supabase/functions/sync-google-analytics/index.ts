import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "content-type": "application/json" };

function b64url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function pemToArrayBuffer(pem: string) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
  const binary = atob(body); const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function getAccessToken(sa: any) {
  const now = Math.floor(Date.now() / 1000); const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly", aud: tokenUri, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const assertion = `${unsigned}.${b64url(sig)}`;
  const resp = await fetch(tokenUri, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const data = await resp.json(); if (!resp.ok) throw new Error(`Google token error: ${JSON.stringify(data)}`); return data.access_token as string;
}
function gaDate(v: string) { return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`; }
function n(v: any) { return Number(v ?? 0); }
function pathOnly(v: string) { const i = v.indexOf("?"); return i >= 0 ? v.slice(0, i) : v; }
async function googlePost(url: string, token: string, body: any) {
  const resp = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await resp.json(); if (!resp.ok) throw new Error(`${url} -> ${resp.status}: ${JSON.stringify(data)}`); return data;
}
async function upsertChunks(supabase: any, table: string, rows: any[], onConflict: string) {
  const size = 500;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size).map((r) => ({ ...r, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from(table).upsert(chunk, { onConflict }); if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
}
async function syncNaverSearchTrends(startDate: string, endDate: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL"); const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return { ok: false, error: "Missing Supabase service credentials" };
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/sync-naver-search-trends`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${serviceRole}`, apikey: serviceRole }, body: JSON.stringify({ start_date: startDate, end_date: endDate }) });
    const data = await resp.json().catch(() => ({})); if (!resp.ok) return { ok: false, status: resp.status, error: data?.error || JSON.stringify(data) }; return data;
  } catch (e) { return { ok: false, error: String(e?.message || e) }; }
}
function deriveBookingContext(eventName: string, pagePathPlusQueryString: string) {
  const raw = pagePathPlusQueryString || "(not set)"; const qIndex = raw.indexOf("?"); const pathname = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  let sourcePath: string | null = pathname || null; let purpose: string | null = null;
  if (eventName === "naver_booking_click" && qIndex >= 0) { const params = new URLSearchParams(raw.slice(qIndex + 1)); purpose = params.get("purpose"); sourcePath = params.get("source") || pathname || null; }
  return { sourcePath, purpose };
}
async function fetchGscAll(url: string, token: string, startDate: string, endDate: string, dimensions: string[], dataState = "all") {
  const out: any[] = []; let startRow = 0;
  while (true) {
    const data = await googlePost(url, token, { startDate, endDate, dimensions, rowLimit: 25000, startRow, dataState });
    const rows = data.rows || []; out.push(...rows); if (rows.length < 25000) break; startRow += 25000;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const saRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON"); const propertyId = Deno.env.get("GA4_PROPERTY_ID"); const gscSite = Deno.env.get("GSC_SITE_URL");
    if (!saRaw || !propertyId || !gscSite) throw new Error("Missing Google secrets");
    const sa = JSON.parse(saRaw); const token = await getAccessToken(sa); const body = await req.json().catch(() => ({}));
    const startDate = body.start_date || "2026-06-01";
    const endDate = body.end_date || new Date(Date.now() - 2 * 86400000).toISOString().slice(0,10);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const ga4Url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const daily = await googlePost(ga4Url, token, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "engagedSessions" }, { name: "engagementRate" }, { name: "userEngagementDuration" }, { name: "screenPageViews" }], limit: "100000" });
    const dailyRows = (daily.rows || []).map((r: any) => ({ date: gaDate(r.dimensionValues[0].value), active_users: n(r.metricValues[0].value), new_users: n(r.metricValues[1].value), sessions: n(r.metricValues[2].value), engaged_sessions: n(r.metricValues[3].value), engagement_rate: n(r.metricValues[4].value), user_engagement_seconds: n(r.metricValues[5].value), screen_page_views: n(r.metricValues[6].value) }));
    await upsertChunks(supabase, "ga4_daily", dailyRows, "date");

    const landing = await googlePost(ga4Url, token, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }, { name: "landingPagePlusQueryString" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "newUsers" }, { name: "engagedSessions" }], limit: "100000" });
    const landingRows = (landing.rows || []).map((r: any) => ({ date: gaDate(r.dimensionValues[0].value), landing_page: r.dimensionValues[1].value || "(not set)", sessions: n(r.metricValues[0].value), active_users: n(r.metricValues[1].value), new_users: n(r.metricValues[2].value), engaged_sessions: n(r.metricValues[3].value) }));
    await supabase.from("ga4_landing_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "ga4_landing_daily", landingRows, "date,landing_page");

    const bookingEvents = await googlePost(ga4Url, token, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }, { name: "eventName" }, { name: "pagePathPlusQueryString" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["booking_intent", "naver_booking_click"] } } }, limit: "100000" });
    const bookingEventRows = (bookingEvents.rows || []).map((r: any) => { const eventName = r.dimensionValues[1].value || ""; const pp = r.dimensionValues[2].value || "(not set)"; const ctx = deriveBookingContext(eventName, pp); return { date: gaDate(r.dimensionValues[0].value), event_name: eventName, page_path_plus_query_string: pp, source_path: ctx.sourcePath, purpose: ctx.purpose, event_count: n(r.metricValues[0].value), total_users: n(r.metricValues[1].value) }; });
    const landingBookingEvents = await googlePost(ga4Url, token, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }, { name: "landingPagePlusQueryString" }, { name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["booking_intent", "naver_booking_click"] } } }, limit: "100000" });
    const landingBookingRows = (landingBookingEvents.rows || []).map((r: any) => { const lp = r.dimensionValues[1].value || "(not set)"; const eventName = r.dimensionValues[2].value || ""; return { date: gaDate(r.dimensionValues[0].value), event_name: `landing_${eventName}`, page_path_plus_query_string: lp, source_path: pathOnly(lp), purpose: null, event_count: n(r.metricValues[0].value), total_users: n(r.metricValues[1].value) }; });
    await supabase.from("ga4_booking_event_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "ga4_booking_event_daily", bookingEventRows, "date,event_name,page_path_plus_query_string"); await upsertChunks(supabase, "ga4_booking_event_daily", landingBookingRows, "date,event_name,page_path_plus_query_string");

    const gscUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSite)}/searchAnalytics/query`;
    const siteRaw = await fetchGscAll(gscUrl, token, startDate, endDate, ["date"], "all");
    const siteRows = siteRaw.map((r: any) => ({ date: r.keys[0], clicks: n(r.clicks), impressions: n(r.impressions), ctr: n(r.ctr), position: n(r.position) }));
    await supabase.from("gsc_site_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "gsc_site_daily", siteRows, "date");

    const pageRaw = await fetchGscAll(gscUrl, token, startDate, endDate, ["date", "page"], "all");
    const pageRows = pageRaw.map((r: any) => ({ date: r.keys[0], page: r.keys[1] || "", clicks: n(r.clicks), impressions: n(r.impressions), ctr: n(r.ctr), position: n(r.position) }));
    await supabase.from("gsc_page_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "gsc_page_daily", pageRows, "date,page");

    const detailRaw = await fetchGscAll(gscUrl, token, startDate, endDate, ["date", "query", "page"], "all");
    const gscRows = detailRaw.map((r: any) => ({ date: r.keys[0], query: r.keys[1] || "", page: r.keys[2] || "", clicks: n(r.clicks), impressions: n(r.impressions), ctr: n(r.ctr), position: n(r.position) }));
    await supabase.from("gsc_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "gsc_daily", gscRows, "date,query,page");

    const naverSearchTrends = await syncNaverSearchTrends(startDate, endDate);

    // City-level dimension sync. Isolated in its own try/catch so a GA4 API
    // hiccup on these newer, less-proven report calls can't fail the whole
    // nightly sync or block the response above (daily/landing/booking/GSC/
    // naver-trends all already committed by this point regardless).
    let cityResult: { ga4_city_daily: number | null; ga4_city_booking: number | null; error?: string } = { ga4_city_daily: null, ga4_city_booking: null };
    try {
      const city = await googlePost(ga4Url, token, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }, { name: "region" }, { name: "city" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "newUsers" }, { name: "engagedSessions" }], limit: "100000" });
      const cityRows = (city.rows || []).map((r: any) => ({ date: gaDate(r.dimensionValues[0].value), region: r.dimensionValues[1].value || "(not set)", city: r.dimensionValues[2].value || "(not set)", sessions: n(r.metricValues[0].value), active_users: n(r.metricValues[1].value), new_users: n(r.metricValues[2].value), engaged_sessions: n(r.metricValues[3].value) }));
      await supabase.from("ga4_city_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "ga4_city_daily", cityRows, "date,region,city");
      cityResult.ga4_city_daily = cityRows.length;

      const cityBooking = await googlePost(ga4Url, token, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }, { name: "region" }, { name: "city" }], metrics: [{ name: "eventCount" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["naver_booking_click"] } } }, limit: "100000" });
      const cityBookingRows = (cityBooking.rows || []).map((r: any) => ({ date: gaDate(r.dimensionValues[0].value), region: r.dimensionValues[1].value || "(not set)", city: r.dimensionValues[2].value || "(not set)", event_count: n(r.metricValues[0].value) }));
      await supabase.from("ga4_city_booking_daily").delete().gte("date", startDate).lte("date", endDate); await upsertChunks(supabase, "ga4_city_booking_daily", cityBookingRows, "date,region,city");
      cityResult.ga4_city_booking = cityBookingRows.length;
    } catch (e) {
      cityResult.error = String(e?.message || e);
    }

    return new Response(JSON.stringify({ ok: true, start_date: startDate, end_date: endDate, ga4_daily: dailyRows.length, ga4_landing: landingRows.length, ga4_booking_events: bookingEventRows.length, ga4_booking_by_landing: landingBookingRows.length, gsc_site_daily: siteRows.length, gsc_page_daily: pageRows.length, gsc_detail: gscRows.length, naver_search_trends: naverSearchTrends, ...cityResult }), { headers: jsonHeaders });
  } catch (e) { return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500, headers: jsonHeaders }); }
});
