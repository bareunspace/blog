import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const transient = new Set([429, 500, 502, 503, 504]);

class GitHubError extends Error {
  constructor(message: string, public status: number | null, public path: string, public attempt: number, public responseMessage: string) {
    super(message); this.name = "GitHubError";
  }
}

const encode64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};
const decode64 = (value: string) => {
  const binary = atob(value.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

const github = async (token: string, path: string, init: RequestInit = {}, max = 4) => {
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "bareunjari-learning-visibility",
          "Content-Type": "application/json", ...(init.headers ?? {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;
      const detail = String(data?.message ?? "request_failed").slice(0, 500);
      const error = new GitHubError(`github_${response.status}:${detail}`, response.status, path, attempt, detail);
      if (!transient.has(response.status) || attempt === max) throw error;
    } catch (error) {
      if (error instanceof GitHubError) {
        if (!transient.has(error.status ?? 0) || attempt === max) throw error;
      } else if (attempt === max) {
        const detail = error instanceof Error ? error.message : "network_error";
        throw new GitHubError(detail, null, path, attempt, detail);
      }
    }
    await sleep(250 * 2 ** (attempt - 1));
  }
  throw new GitHubError("github_request_failed", null, path, max, "github_request_failed");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders });
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const secret = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
  if (!url || !anon || !secret) return Response.json({ error: "server_configuration_error" }, { status: 500, headers: corsHeaders });
  if (!githubToken) return Response.json({ error: "github_token_not_configured" }, { status: 503, headers: corsHeaders });

  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  const email = userData.user?.email?.toLowerCase();
  if (userError || !email) return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: adminRow, error: adminError } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  if (adminError) return Response.json({ error: "admin_check_failed" }, { status: 500, headers: corsHeaders });
  if (!adminRow) return Response.json({ error: "forbidden" }, { status: 403, headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
  const active = body?.active;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
  if (typeof active !== "boolean") return Response.json({ error: "invalid_active" }, { status: 400, headers: corsHeaders });

  const { data: candidate, error: candidateError } = await admin.from("learning_candidates").select("id,title,decision_override,execution_candidate").eq("id", candidateId).single();
  if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });
  const execution = candidate.execution_candidate ?? {};
  if (candidate.decision_override !== "execute_now" || execution.template !== "homepage_validated_use_case_v1" || execution.repository !== "bareunspace/blog" || execution.target_path !== "_data/learning_actions.json") return Response.json({ error: "approved_execution_required" }, { status: 409, headers: corsHeaders });

  const repository = "bareunspace/blog";
  const targetPath = "_data/learning_actions.json";
  const [owner, repo] = repository.split("/");
  let stage = "repo_info";
  let attempt = 0;

  const fail = async (error: unknown) => {
    const gh = error instanceof GitHubError ? error : null;
    const diagnostic = {
      operation: "toggle_execution_visibility", requested_active: active, stage,
      github_status: gh?.status ?? null, github_path: gh?.path ?? null,
      attempt: gh?.attempt ?? attempt,
      message: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      response_message: gh?.responseMessage?.slice(0, 500) ?? null,
      repository, path: targetPath,
    };
    try {
      const { error: logError } = await admin.from("learning_actions").insert({
        candidate_id: candidateId, action_type: "execution_failed",
        from_status: execution.status ?? null, to_status: execution.status ?? null,
        actor_type: "human", actor_user_id: userData.user.id, actor_label: email, payload: diagnostic,
      });
      if (logError) console.error("learning_visibility_failure_log_failed", logError.message);
    } catch (logError) { console.error("learning_visibility_failure_log_exception", logError); }
    console.error("learning_visibility_failed", diagnostic);
    return Response.json({ error: "visibility_update_failed", diagnostic }, { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  };

  try {
    const repoInfo = await github(githubToken, `/repos/${owner}/${repo}`);
    const branch = repoInfo.default_branch ?? "main";
    for (attempt = 1; attempt <= 4; attempt++) {
      stage = attempt === 1 ? "fetch_current_content" : "refetch_after_conflict";
      const current = await github(githubToken, `/repos/${owner}/${repo}/contents/${targetPath}?ref=${encodeURIComponent(branch)}`);
      let document: { actions: Array<Record<string, unknown>> } = JSON.parse(decode64(current.content ?? ""));
      if (!document || !Array.isArray(document.actions)) document = { actions: [] };
      const index = document.actions.findIndex((item) => item?.candidate_id === candidateId);
      if (index < 0) throw new Error("learning_action_not_found");
      const currentActive = document.actions[index]?.active === true;
      const dbActive = execution.visibility_active === true;
      if (currentActive === active && dbActive === active) return Response.json({ ok: true, existing: true, active, commit_sha: execution.visibility_commit_sha ?? execution.commit_sha ?? null }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      document.actions[index] = { ...document.actions[index], active };
      stage = "update_github_content";
      try {
        const result = await github(githubToken, `/repos/${owner}/${repo}/contents/${targetPath}`, {
          method: "PUT",
          body: JSON.stringify({
            message: active ? `feat: resume homepage learning action ${candidate.title}` : `chore: pause homepage learning action ${candidate.title}`,
            content: encode64(JSON.stringify(document, null, 2) + "\n"), branch, sha: current.sha,
          }),
        });
        const commitSha = result?.commit?.sha;
        if (!commitSha) throw new Error("github_commit_sha_missing");
        stage = "persist_supabase_state";
        const now = new Date().toISOString();
        const nextExecution = { ...execution, status: active ? "applied" : "paused", visibility_active: active, visibility_commit_sha: commitSha, visibility_changed_at: now, visibility_changed_by: email };
        const { error: updateError } = await admin.from("learning_candidates").update({ execution_candidate: nextExecution, updated_at: now }).eq("id", candidateId);
        if (updateError) throw new Error(`supabase_state_update_failed:${updateError.message}`);
        const { error: actionError } = await admin.from("learning_actions").insert({
          candidate_id: candidateId, action_type: active ? "execution_resumed" : "execution_paused",
          from_status: execution.status ?? null, to_status: active ? "applied" : "paused",
          actor_type: "human", actor_user_id: userData.user.id, actor_label: email,
          payload: { active, repository, path: targetPath, commit_sha: commitSha },
        });
        if (actionError) throw new Error(`learning_action_record_failed:${actionError.message}`);
        return Response.json({ ok: true, active, repository, path: targetPath, commit_sha: commitSha }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        if (error instanceof GitHubError && (error.status === 409 || error.status === 422) && attempt < 4) { await sleep(250 * attempt); continue; }
        throw error;
      }
    }
    throw new Error("content_update_attempts_exhausted");
  } catch (error) { return await fail(error); }
});
