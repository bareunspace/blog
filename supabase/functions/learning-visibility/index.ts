import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const transientStatuses = new Set([429, 500, 502, 503, 504]);

class GitHubRequestError extends Error {
  status: number | null;
  path: string;
  attempt: number;
  responseMessage: string;
  constructor(message: string, options: { status?: number | null; path: string; attempt: number; responseMessage?: string }) {
    super(message);
    this.name = "GitHubRequestError";
    this.status = options.status ?? null;
    this.path = options.path;
    this.attempt = options.attempt;
    this.responseMessage = options.responseMessage ?? message;
  }
}

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const decodeBase64 = (value: string): string => {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const githubRequest = async (token: string, path: string, init: RequestInit = {}, maxAttempts = 4) => {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "bareunjari-learning-visibility",
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;
      const responseMessage = String(data?.message ?? "request_failed").slice(0, 500);
      const retryable = transientStatuses.has(response.status);
      const error = new GitHubRequestError(`github_${response.status}:${responseMessage}`, {
        status: response.status, path, attempt, responseMessage,
      });
      lastError = error;
      if (!retryable || attempt === maxAttempts) throw error;
    } catch (error) {
      if (error instanceof GitHubRequestError) {
        if (!transientStatuses.has(error.status ?? 0) || attempt === maxAttempts) throw error;
        lastError = error;
      } else {
        lastError = new GitHubRequestError(
          error instanceof Error ? error.message : "network_error",
          { status: null, path, attempt, responseMessage: error instanceof Error ? error.message : "network_error" },
        );
        if (attempt === maxAttempts) throw lastError;
      }
    }
    await sleep(250 * (2 ** (attempt - 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("github_request_failed");
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders });

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
  if (!url || !publicKey || !secretKey) return Response.json({ error: "server_configuration_error" }, { status: 500, headers: corsHeaders });
  if (!githubToken) return Response.json({ error: "github_token_not_configured" }, { status: 503, headers: corsHeaders });

  const userClient = createClient(url, publicKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  const email = userData.user?.email?.toLowerCase();
  if (userError || !email) return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: adminRow, error: adminError } = await admin.from("admin_users").select("email").eq("email", email).maybeSingle();
  if (adminError) return Response.json({ error: "admin_check_failed" }, { status: 500, headers: corsHeaders });
  if (!adminRow) return Response.json({ error: "forbidden" }, { status: 403, headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
  const active = body?.active;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
    return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
  }
  if (typeof active !== "boolean") return Response.json({ error: "invalid_active" }, { status: 400, headers: corsHeaders });

  const { data: candidate, error: candidateError } = await admin
    .from("learning_candidates")
    .select("id,title,decision_override,execution_candidate")
    .eq("id", candidateId)
    .single();
  if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });

  const execution = candidate.execution_candidate ?? {};
  if (candidate.decision_override !== "execute_now" || execution.template !== "homepage_validated_use_case_v1" || execution.repository !== "bareunspace/blog" || execution.target_path !== "_data/learning_actions.json") {
    return Response.json({ error: "approved_execution_required" }, { status: 409, headers: corsHeaders });
  }

  const repository = "bareunspace/blog";
  const targetPath = "_data/learning_actions.json";
  const [owner, repo] = repository.split("/");
  let stage = "repo_info";
  let attempts = 0;

  const recordFailure = async (error: unknown) => {
    const githubError = error instanceof GitHubRequestError ? error : null;
    const payload = {
      operation: "toggle_execution_visibility",
      requested_active: active,
      stage,
      github_status: githubError?.status ?? null,
      github_path: githubError?.path ?? null,
      attempt: githubError?.attempt ?? attempts,
      message: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      response_message: githubError?.responseMessage?.slice(0, 500) ?? null,
      repository,
      path: targetPath,
    };
    await admin.from("learning_actions").insert({
      candidate_id: candidateId,
      action_type: "execution_failed",
      from_status: execution.status ?? null,
      to_status: execution.status ?? null,
      actor_type: "human",
      actor_user_id: userData.user.id,
      actor_label: email,
      payload,
    }).catch(() => null);
    return payload;
  };

  try {
    const repoInfo = await githubRequest(githubToken, `/repos/${owner}/${repo}`);
    const branch = repoInfo.default_branch ?? "main";

    stage = "fetch_current_content";
    for (let contentAttempt = 1; contentAttempt <= 4; contentAttempt++) {
      attempts = contentAttempt;
      const current = await githubRequest(githubToken, `/repos/${owner}/${repo}/contents/${targetPath}?ref=${encodeURIComponent(branch)}`);
      const sha = current.sha;
      let document: { actions: Array<Record<string, unknown>> } = JSON.parse(decodeBase64(current.content ?? ""));
      if (!document || !Array.isArray(document.actions)) document = { actions: [] };
      const index = document.actions.findIndex((item) => item?.candidate_id === candidateId);
      if (index < 0) throw new Error("learning_action_not_found");
      const currentActive = document.actions[index]?.active === true;
      const dbActive = execution.visibility_active === true;
      if (currentActive === active && dbActive === active) {
        return Response.json({ ok: true, existing: true, active, commit_sha: execution.visibility_commit_sha ?? execution.commit_sha ?? null }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      document.actions[index] = { ...document.actions[index], active };
      stage = "update_github_content";
      try {
        const result = await githubRequest(githubToken, `/repos/${owner}/${repo}/contents/${targetPath}`, {
          method: "PUT",
          body: JSON.stringify({
            message: active ? `feat: resume homepage learning action ${candidate.title}` : `chore: pause homepage learning action ${candidate.title}`,
            content: encodeBase64(JSON.stringify(document, null, 2) + "\n"),
            branch,
            sha,
          }),
        }, 4);
        const commitSha = result?.commit?.sha;
        if (!commitSha) throw new Error("github_commit_sha_missing");

        stage = "persist_supabase_state";
        const nextExecution = {
          ...execution,
          status: active ? "applied" : "paused",
          visibility_active: active,
          visibility_commit_sha: commitSha,
          visibility_changed_at: new Date().toISOString(),
          visibility_changed_by: email,
        };
        const { error: updateError } = await admin.from("learning_candidates").update({ execution_candidate: nextExecution, updated_at: new Date().toISOString() }).eq("id", candidateId);
        if (updateError) throw new Error(`supabase_state_update_failed:${updateError.message}`);

        const { error: actionError } = await admin.from("learning_actions").insert({
          candidate_id: candidateId,
          action_type: active ? "execution_resumed" : "execution_paused",
          from_status: execution.status ?? null,
          to_status: active ? "applied" : "paused",
          actor_type: "human",
          actor_user_id: userData.user.id,
          actor_label: email,
          payload: { active, repository, path: targetPath, commit_sha: commitSha },
        });
        if (actionError) throw new Error(`learning_action_record_failed:${actionError.message}`);

        return Response.json({ ok: true, active, repository, path: targetPath, commit_sha: commitSha }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        const conflict = error instanceof GitHubRequestError && (error.status === 409 || error.status === 422);
        if (conflict && contentAttempt < 4) {
          stage = "refetch_after_conflict";
          await sleep(250 * contentAttempt);
          continue;
        }
        throw error;
      }
    }
    throw new Error("content_update_attempts_exhausted");
  } catch (error) {
    const diagnostic = await recordFailure(error);
    console.error("learning_visibility_failed", diagnostic);
    return Response.json({ error: "visibility_update_failed", diagnostic }, { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
