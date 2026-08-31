import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReservationRow = {
  usage_date: string | null;
  usage_purpose: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_name: string | null;
  payment_amount: number | null;
  refund_amount: number | null;
};

const canonicalPurpose = (raw: string | null): string | null => {
  if (!raw?.trim()) return null;
  const value = raw.trim().replaceAll(".", "·").replace(/\s+/g, " ");
  if (/면접|발표/.test(value)) return "면접·발표 연습";
  if (/미팅|업무|화상회의/.test(value)) return "미팅·업무";
  if (/개인 작업|집중|프리랜서/.test(value)) return "개인 작업·집중";
  if (/스터디|팀 프로젝트|팀플/.test(value)) return "스터디·팀 프로젝트";
  if (/카드게임|보드게임|소모임/.test(value)) return "소모임·취미";
  if (/이미지 컨설팅|퍼스널.?컬러/i.test(value)) return "이미지 컨설팅";
  if (/상담|대화/.test(value)) return "상담·대화";
  if (/영어|외국어/.test(value)) return "영어·외국어 연습";
  if (/촬영|콘텐츠/.test(value)) return "촬영·콘텐츠";
  return value;
};

const customerKey = (row: ReservationRow): string | null =>
  row.customer_phone?.trim() ||
  row.customer_email?.trim().toLowerCase() ||
  row.customer_name?.trim() ||
  null;

const daysBefore = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
};

const weekBucket = (date: string, asOfDate: string): number =>
  Math.floor((Date.parse(`${asOfDate}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 604_800_000);

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

const githubRequest = async (token: string, path: string, init: RequestInit = {}) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "bareunjari-learning-agent",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`github_${response.status}:${data?.message ?? "request_failed"}`);
  return data;
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
  if (!url || !publicKey || !secretKey) {
    return Response.json({ error: "server_configuration_error" }, { status: 500, headers: corsHeaders });
  }

  const userClient = createClient(url, publicKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  const email = userData.user?.email?.toLowerCase();
  if (userError || !email) return Response.json({ error: "unauthorized" }, { status: 401, headers: corsHeaders });

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: adminRow, error: adminError } = await admin
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (adminError) return Response.json({ error: "admin_check_failed" }, { status: 500, headers: corsHeaders });
  if (!adminRow) return Response.json({ error: "forbidden" }, { status: 403, headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "run";

  if (action === "list") {
    const { data: candidates, error: candidatesError } = await admin
      .from("learning_candidates")
      .select("id,candidate_key,candidate_type,title,hypothesis,status,priority,confidence,evidence_window_start,evidence_window_end,occurrence_count,last_detected_at,created_at,review_decision,review_note,reviewed_at,ai_analysis_status,ai_analysis,ai_analyzed_at,github_repo,github_pr_number,github_pr_url,promoted_path,promoted_commit_sha,promoted_at,evidence_validation_status,evidence_validated_at,evidence_validation_rule,evidence_validation_summary,decision_override,decision_override_reason,decision_override_actor,decision_override_at,execution_candidate,outcome_due_at,outcome_status,outcome_summary")
      .order("last_detected_at", { ascending: false });
    if (candidatesError) return Response.json({ error: candidatesError.message }, { status: 500, headers: corsHeaders });

    const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
    let evidence: Array<Record<string, unknown>> = [];
    let reviewActions: Array<Record<string, unknown>> = [];
    if (candidateIds.length) {
      const { data: evidenceRows, error: evidenceError } = await admin
        .from("learning_evidence")
        .select("candidate_id,metric_name,metric_value,sample_size,window_start,window_end,dimensions,payload,created_at")
        .in("candidate_id", candidateIds)
        .order("created_at", { ascending: false });
      if (evidenceError) return Response.json({ error: evidenceError.message }, { status: 500, headers: corsHeaders });
      evidence = evidenceRows ?? [];

      const { data: actionRows, error: actionsError } = await admin
        .from("learning_actions")
        .select("candidate_id,action_type,from_status,to_status,actor_label,payload,created_at")
        .in("candidate_id", candidateIds)
        .in("action_type", ["human_review", "decision_override", "execution_planned", "execution_applied"])
        .order("created_at", { ascending: false });
      if (actionsError) return Response.json({ error: actionsError.message }, { status: 500, headers: corsHeaders });
      reviewActions = actionRows ?? [];
    }

    return Response.json({ ok: true, candidates: candidates ?? [], evidence, review_actions: reviewActions }, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "override") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    const decision = typeof body?.decision === "string" ? body.decision : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    if (!["auto", "execute_now", "observe", "exclude"].includes(decision)) {
      return Response.json({ error: "invalid_override_decision" }, { status: 400, headers: corsHeaders });
    }
    if (reason.length < 3 || reason.length > 2000) {
      return Response.json({ error: "override_reason_required" }, { status: 400, headers: corsHeaders });
    }
    const { data: candidate, error: overrideError } = await admin.rpc("override_learning_decision", {
      p_candidate_id: candidateId,
      p_decision: decision,
      p_reason: reason,
      p_actor_user_id: userData.user.id,
      p_actor_label: email,
    });
    if (overrideError) return Response.json({ error: overrideError.message }, { status: 400, headers: corsHeaders });
    return Response.json({ ok: true, candidate }, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "plan_execution") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    const { data: candidate, error: candidateError } = await admin
      .from("learning_candidates")
      .select("id,title,hypothesis,decision_override,execution_candidate,outcome_due_at")
      .eq("id", candidateId).single();
    if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });
    if (candidate.decision_override !== "execute_now") {
      return Response.json({ error: "execute_now_decision_required" }, { status: 409, headers: corsHeaders });
    }
    const purpose = candidate.title.replace(/\s*반복 수요$/, "").trim().slice(0, 80);
    const preview = {
      eyebrow: "실제 반복 수요",
      title: `${purpose}을 위한 프라이빗 공간`,
      description: String(candidate.hypothesis ?? "").slice(0, 240),
      cta_label: `${purpose} 예약하기`,
      cta_url: "/booking/",
    };
    const plan = {
      template: "homepage_validated_use_case_v1",
      repository: "bareunspace/blog",
      target_path: "_data/learning_actions.json",
      target_area: "homepage_before_practical_guides",
      risk: "low",
      preview,
      baseline: { captured_at: new Date().toISOString(), outcome_due_at: candidate.outcome_due_at },
      protections: ["no_price_change", "no_booking_policy_change", "no_page_deletion"],
    };
    const { data: saved, error: saveError } = await admin.rpc("save_learning_execution_plan", {
      p_candidate_id: candidateId, p_plan: plan,
      p_actor_user_id: userData.user.id, p_actor_label: email,
    });
    if (saveError) return Response.json({ error: saveError.message }, { status: 400, headers: corsHeaders });
    return Response.json({ ok: true, candidate: saved, plan }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "apply_execution") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    if (!githubToken) return Response.json({ error: "github_token_not_configured" }, { status: 503, headers: corsHeaders });
    const { data: candidate, error: candidateError } = await admin
      .from("learning_candidates")
      .select("id,title,decision_override,execution_candidate")
      .eq("id", candidateId).single();
    if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });
    const plan = candidate.execution_candidate ?? {};
    if (candidate.decision_override !== "execute_now" || plan.status !== "preview_ready" ||
        plan.template !== "homepage_validated_use_case_v1" ||
        plan.repository !== "bareunspace/blog" || plan.target_path !== "_data/learning_actions.json") {
      return Response.json({ error: "approved_execution_preview_required" }, { status: 409, headers: corsHeaders });
    }
    const repository = "bareunspace/blog";
    const [owner, repo] = repository.split("/");
    const targetPath = "_data/learning_actions.json";
    try {
      const repoInfo = await githubRequest(githubToken, `/repos/${owner}/${repo}`);
      const branch = repoInfo.default_branch ?? "main";
      let sha: string | undefined;
      let document: { actions: Array<Record<string, unknown>> } = { actions: [] };
      try {
        const current = await githubRequest(githubToken, `/repos/${owner}/${repo}/contents/${targetPath}?ref=${encodeURIComponent(branch)}`);
        sha = current.sha;
        document = JSON.parse(decodeBase64(current.content ?? ""));
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith("github_404:")) throw error;
      }
      if (!document || !Array.isArray(document.actions)) document = { actions: [] };
      const entry = {
        candidate_id: candidate.id,
        active: true,
        template: "homepage_validated_use_case_v1",
        ...plan.preview,
      };
      document.actions = [...document.actions.filter((item) => item?.candidate_id !== candidate.id), entry];
      const requestBody: Record<string, unknown> = {
        message: `feat: apply learning action ${candidate.title}`,
        content: encodeBase64(JSON.stringify(document, null, 2) + "\n"),
        branch,
      };
      if (sha) requestBody.sha = sha;
      const result = await githubRequest(githubToken, `/repos/${owner}/${repo}/contents/${targetPath}`, {
        method: "PUT", body: JSON.stringify(requestBody),
      });
      const commitSha = result?.commit?.sha;
      if (!commitSha) throw new Error("github_commit_sha_missing");
      const { error: recordError } = await admin.rpc("record_learning_execution_application", {
        p_candidate_id: candidateId, p_repository: repository, p_path: targetPath,
        p_commit_sha: commitSha, p_actor_user_id: userData.user.id, p_actor_label: email,
      });
      if (recordError) return Response.json({ error: `site_committed_but_record_failed:${recordError.message}`, commit_sha: commitSha }, { status: 500, headers: corsHeaders });
      return Response.json({ ok: true, repository, path: targetPath, commit_sha: commitSha }, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "github_request_failed" }, { status: 502, headers: corsHeaders });
    }
  }

  if (action === "review") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    const decision = typeof body?.decision === "string" ? body.decision : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    if (!["approved", "hold", "rejected"].includes(decision)) {
      return Response.json({ error: "invalid_review_decision" }, { status: 400, headers: corsHeaders });
    }
    if (note.length > 2000) {
      return Response.json({ error: "review_note_too_long" }, { status: 400, headers: corsHeaders });
    }

    const { data: candidate, error: reviewError } = await admin.rpc("review_learning_candidate", {
      p_candidate_id: candidateId,
      p_decision: decision,
      p_note: note || null,
      p_reviewer_id: userData.user.id,
      p_reviewer_email: email,
    });
    if (reviewError) return Response.json({ error: reviewError.message }, { status: 400, headers: corsHeaders });
    if (decision === "approved") {
      const { error: evidenceEvaluationError } = await admin.rpc("evaluate_learning_evidence", {
        p_candidate_id: candidateId,
      });
      if (evidenceEvaluationError) {
        return Response.json({ error: `review_saved_but_evidence_evaluation_failed:${evidenceEvaluationError.message}` }, { status: 500, headers: corsHeaders });
      }
    }
    return Response.json({ ok: true, candidate }, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "draft") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    const { data: candidate, error: candidateError } = await admin
      .from("learning_candidates")
      .select("id,candidate_key,candidate_type,title,hypothesis,status,confidence,evidence_window_start,evidence_window_end")
      .eq("id", candidateId)
      .single();
    if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });
    if (candidate.status !== "approved") {
      return Response.json({ error: "candidate_must_be_approved" }, { status: 409, headers: corsHeaders });
    }
    const { data: evidenceRows, error: evidenceError } = await admin
      .from("learning_evidence")
      .select("metric_name,metric_value,sample_size,window_start,window_end,dimensions,payload")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });
    if (evidenceError) return Response.json({ error: evidenceError.message }, { status: 500, headers: corsHeaders });

    const safeKey = candidate.candidate_key.replace(/[^a-zA-Z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
    const analysis = {
      classification: "HYPOTHESIS",
      summary: candidate.hypothesis,
      repository: "bareunspace/knowledge-base",
      proposed_path: `Bareunjari/KnowledgeOps/learning-candidate-${safeKey}.md`,
      evidence_window: { start: candidate.evidence_window_start, end: candidate.evidence_window_end },
      confidence: candidate.confidence,
      evidence: evidenceRows ?? [],
      recommended_actions: [
        `${candidate.title} 전용 콘텐츠 또는 상품 가설을 작은 범위에서 검증한다.`,
        "예약·고객·순매출 변화를 동일 기간 기준으로 다시 측정한다.",
      ],
      success_metrics: ["확정 예약 수", "서로 다른 고객 수", "순매출", "재방문 여부"],
      promotion_rule: "실험 또는 추가 관찰에서 반복 검증되기 전까지 HYPOTHESIS로 유지",
    };
    const { data: saved, error: saveError } = await admin.rpc("save_learning_promotion_draft", {
      p_candidate_id: candidateId,
      p_analysis: analysis,
      p_actor_user_id: userData.user.id,
      p_actor_label: email,
    });
    if (saveError) return Response.json({ error: saveError.message }, { status: 400, headers: corsHeaders });
    return Response.json({ ok: true, candidate: saved, analysis }, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "create_pr") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    if (!githubToken) return Response.json({ error: "github_token_not_configured" }, { status: 503, headers: corsHeaders });

    const { data: candidate, error: candidateError } = await admin
      .from("learning_candidates")
      .select("id,title,hypothesis,status,confidence,evidence_window_start,evidence_window_end,ai_analysis_status,ai_analysis,github_pr_number,github_pr_url")
      .eq("id", candidateId)
      .single();
    if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });
    if (candidate.github_pr_number && candidate.github_pr_url) {
      return Response.json({ ok: true, existing: true, pr_number: candidate.github_pr_number, pr_url: candidate.github_pr_url }, { headers: corsHeaders });
    }
    if (candidate.status !== "approved" || candidate.ai_analysis_status !== "completed") {
      return Response.json({ error: "approved_promotion_draft_required" }, { status: 409, headers: corsHeaders });
    }

    const analysis = candidate.ai_analysis ?? {};
    const repository = analysis.repository === "bareunspace/knowledge-base" ? analysis.repository : "bareunspace/knowledge-base";
    const proposedPath = typeof analysis.proposed_path === "string" && analysis.proposed_path.startsWith("Bareunjari/")
      ? analysis.proposed_path : "";
    if (!proposedPath || proposedPath.includes("..")) {
      return Response.json({ error: "invalid_proposed_path" }, { status: 400, headers: corsHeaders });
    }
    const [owner, repo] = repository.split("/");
    try {
      const repoInfo = await githubRequest(githubToken, `/repos/${owner}/${repo}`);
      const baseBranch = repoInfo.default_branch ?? "main";
      const baseRef = await githubRequest(githubToken, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`);
      const branch = `learning/candidate-${candidateId.slice(0, 8)}-${Date.now()}`;
      await githubRequest(githubToken, `/repos/${owner}/${repo}/git/refs`, {
        method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha }),
      });

      const actions = Array.isArray(analysis.recommended_actions) ? analysis.recommended_actions : [];
      const metrics = Array.isArray(analysis.success_metrics) ? analysis.success_metrics : [];
      const markdown = `# ${candidate.title}\n\n` +
        `- Classification: ${analysis.classification ?? "HYPOTHESIS"}\n` +
        `- Candidate ID: ${candidate.id}\n` +
        `- Evidence source: Supabase learning layer (restricted)\n\n` +
        `## Hypothesis\n\n${candidate.hypothesis}\n\n` +
        `## Evidence handling\n\n예약·고객·매출 상세 수치는 Supabase에만 보관하며 이 문서에는 공개하지 않습니다.\n\n` +
        `## Recommended actions\n\n${actions.map((item: string) => `- ${item}`).join("\n")}\n\n` +
        `## Success metrics\n\n${metrics.map((item: string) => `- ${item}`).join("\n")}\n\n` +
        `## Promotion rule\n\n${analysis.promotion_rule ?? "추가 검증 전까지 HYPOTHESIS로 유지"}\n`;
      await githubRequest(githubToken, `/repos/${owner}/${repo}/contents/${proposedPath.split("/").map(encodeURIComponent).join("/")}`, {
        method: "PUT", body: JSON.stringify({ message: `docs: add learning candidate ${candidate.title}`, content: encodeBase64(markdown), branch }),
      });
      const pr = await githubRequest(githubToken, `/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: `[Learning Candidate] ${candidate.title}`,
          head: branch,
          base: baseBranch,
          body: `Supabase Learning Candidate ${candidate.id}에서 생성된 검토용 Knowledge Base 반영 제안입니다.\n\n자동 병합되지 않으며 사람의 검토가 필요합니다.`,
        }),
      });
      const { error: recordError } = await admin.rpc("record_learning_github_pr", {
        p_candidate_id: candidateId, p_repository: repository, p_pr_number: pr.number,
        p_pr_url: pr.html_url, p_path: proposedPath,
        p_actor_user_id: userData.user.id, p_actor_label: email,
      });
      if (recordError) return Response.json({ error: `pr_created_but_record_failed:${recordError.message}`, pr_url: pr.html_url }, { status: 500, headers: corsHeaders });
      return Response.json({ ok: true, pr_number: pr.number, pr_url: pr.html_url }, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "github_request_failed" }, { status: 502, headers: corsHeaders });
    }
  }

  if (action === "promote") {
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId)) {
      return Response.json({ error: "invalid_candidate_id" }, { status: 400, headers: corsHeaders });
    }
    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    if (!githubToken) return Response.json({ error: "github_token_not_configured" }, { status: 503, headers: corsHeaders });
    const { data: candidate, error: candidateError } = await admin
      .from("learning_candidates")
      .select("id,title,hypothesis,status,ai_analysis_status,ai_analysis,promoted_commit_sha,promoted_path,github_repo")
      .eq("id", candidateId).single();
    if (candidateError) return Response.json({ error: candidateError.message }, { status: 404, headers: corsHeaders });
    if (candidate.status === "promoted" && candidate.promoted_commit_sha) {
      return Response.json({ ok: true, existing: true, commit_sha: candidate.promoted_commit_sha, path: candidate.promoted_path }, { headers: corsHeaders });
    }
    if (candidate.status !== "approved" || candidate.ai_analysis_status !== "completed") {
      return Response.json({ error: "approved_promotion_draft_required" }, { status: 409, headers: corsHeaders });
    }
    const analysis = candidate.ai_analysis ?? {};
    const repository = "bareunspace/knowledge-base";
    const proposedPath = typeof analysis.proposed_path === "string" && analysis.proposed_path.startsWith("Bareunjari/")
      ? analysis.proposed_path : "";
    if (!proposedPath || proposedPath.includes("..")) return Response.json({ error: "invalid_proposed_path" }, { status: 400, headers: corsHeaders });
    const actions = Array.isArray(analysis.recommended_actions) ? analysis.recommended_actions : [];
    const metrics = Array.isArray(analysis.success_metrics) ? analysis.success_metrics : [];
    const markdown = `# ${candidate.title}\n\n` +
      `- Classification: ${analysis.classification ?? "HYPOTHESIS"}\n` +
      `- Candidate ID: ${candidate.id}\n` +
      `- Evidence source: Supabase learning layer (restricted)\n\n` +
      `## Hypothesis\n\n${candidate.hypothesis}\n\n` +
      `## Evidence handling\n\n예약·고객·매출 상세 수치는 Supabase에만 보관하며 이 문서에는 공개하지 않습니다.\n\n` +
      `## Recommended actions\n\n${actions.map((item: string) => `- ${item}`).join("\n")}\n\n` +
      `## Success metrics\n\n${metrics.map((item: string) => `- ${item}`).join("\n")}\n\n` +
      `## Promotion rule\n\n${analysis.promotion_rule ?? "추가 검증 전까지 HYPOTHESIS로 유지"}\n`;
    try {
      const [owner, repo] = repository.split("/");
      const repoInfo = await githubRequest(githubToken, `/repos/${owner}/${repo}`);
      const branch = repoInfo.default_branch ?? "main";
      const result = await githubRequest(githubToken, `/repos/${owner}/${repo}/contents/${proposedPath.split("/").map(encodeURIComponent).join("/")}`, {
        method: "PUT",
        body: JSON.stringify({ message: `docs: promote learning candidate ${candidate.title}`, content: encodeBase64(markdown), branch }),
      });
      const commitSha = result?.commit?.sha;
      if (!commitSha) throw new Error("github_commit_sha_missing");
      const { error: recordError } = await admin.rpc("record_learning_kb_promotion", {
        p_candidate_id: candidateId, p_repository: repository, p_path: proposedPath,
        p_commit_sha: commitSha, p_actor_user_id: userData.user.id, p_actor_label: email,
      });
      if (recordError) return Response.json({ error: `kb_committed_but_record_failed:${recordError.message}`, commit_sha: commitSha }, { status: 500, headers: corsHeaders });
      const { error: evidenceEvaluationError } = await admin.rpc("evaluate_learning_evidence", {
        p_candidate_id: candidateId,
      });
      if (evidenceEvaluationError) {
        return Response.json({ error: `kb_committed_but_evidence_evaluation_failed:${evidenceEvaluationError.message}`, commit_sha: commitSha }, { status: 500, headers: corsHeaders });
      }
      return Response.json({ ok: true, repository, path: proposedPath, commit_sha: commitSha }, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "github_request_failed" }, { status: 502, headers: corsHeaders });
    }
  }

  if (action !== "run") return Response.json({ error: "unsupported_action" }, { status: 400, headers: corsHeaders });
  const writeMode = body?.write_mode === true;

  const today = new Date().toISOString().slice(0, 10);
  const { data: latest, error: latestError } = await admin
    .from("reservations")
    .select("usage_date")
    .eq("status", "confirmed")
    .lte("usage_date", today)
    .order("usage_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError || !latest?.usage_date) {
    return Response.json({ error: latestError?.message ?? "no_confirmed_reservations" }, { status: 500, headers: corsHeaders });
  }

  const asOfDate = typeof body?.as_of_date === "string" ? body.as_of_date : latest.usage_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate) || asOfDate > today) {
    return Response.json({ error: "invalid_as_of_date" }, { status: 400, headers: corsHeaders });
  }
  const windowStart = daysBefore(asOfDate, 27);

  const { data, error } = await admin
    .from("reservations")
    .select("usage_date,usage_purpose,customer_phone,customer_email,customer_name,payment_amount,refund_amount")
    .eq("status", "confirmed")
    .gte("usage_date", windowStart)
    .lte("usage_date", asOfDate);
  if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

  const groups = new Map<string, { bookings: number; revenue: number; customers: Set<string>; weeks: Set<number> }>();
  let classified = 0;
  for (const row of (data ?? []) as ReservationRow[]) {
    if (!row.usage_date) continue;
    const purpose = canonicalPurpose(row.usage_purpose);
    if (!purpose) continue;
    classified += 1;
    const group = groups.get(purpose) ?? { bookings: 0, revenue: 0, customers: new Set(), weeks: new Set() };
    group.bookings += 1;
    group.revenue += (row.payment_amount ?? 0) - (row.refund_amount ?? 0);
    const key = customerKey(row);
    if (key) group.customers.add(key);
    group.weeks.add(weekBucket(row.usage_date, asOfDate));
    groups.set(purpose, group);
  }

  const candidates = [...groups.entries()]
    .filter(([, group]) => group.bookings >= 3 && group.customers.size >= 2 && group.weeks.size >= 2)
    .map(([purpose, group]) => ({
      candidate_key: `repeat_demand:usage_purpose:${purpose}`,
      candidate_type: "repeat_demand",
      title: `${purpose} 반복 수요`,
      hypothesis: `${purpose} 수요가 일회성 사례가 아니라 반복 가능한 예약 수요다.`,
      confidence: Math.min(0.95, 0.5 + Math.min(group.bookings, 10) * 0.025 + Math.min(group.customers.size, 6) * 0.025),
      evidence: {
        bookings: group.bookings,
        distinct_customers: group.customers.size,
        active_weeks: group.weeks.size,
        net_revenue: group.revenue,
        window_start: windowStart,
        window_end: asOfDate,
      },
    }))
    .sort((a, b) => b.evidence.bookings - a.evidence.bookings);

  const storedCandidates: Array<{ id: string; candidate_key: string }> = [];
  if (writeMode) {
    const runId = crypto.randomUUID();
    const { data: brief } = await admin
      .from("operations_agent_briefs")
      .select("id")
      .lte("briefing_date", asOfDate)
      .order("briefing_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    for (const candidate of candidates) {
      const { data: existing, error: existingError } = await admin
        .from("learning_candidates")
        .select("id,evidence_window_end,occurrence_count")
        .eq("detector_name", "repeat_demand")
        .eq("candidate_key", candidate.candidate_key)
        .maybeSingle();
      if (existingError) throw existingError;

      const isNewWindow = existing?.evidence_window_end !== asOfDate;
      const row = {
        candidate_key: candidate.candidate_key,
        candidate_type: candidate.candidate_type,
        scope_type: "business",
        scope_key: "bareunjari",
        title: candidate.title,
        hypothesis: candidate.hypothesis,
        status: existing ? undefined : "detected",
        priority: candidate.evidence.bookings >= 10 ? "high" : "normal",
        confidence: candidate.confidence,
        detector_name: "repeat_demand",
        detector_version: "0.1.0",
        detector_run_id: runId,
        source_brief_id: brief?.id ?? null,
        evidence_window_start: windowStart,
        evidence_window_end: asOfDate,
        last_detected_at: new Date().toISOString(),
        occurrence_count: existing ? (existing.occurrence_count ?? 1) + (isNewWindow ? 1 : 0) : 1,
        updated_at: new Date().toISOString(),
      };

      const cleanRow = Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
      const { data: stored, error: storeError } = await admin
        .from("learning_candidates")
        .upsert(cleanRow, { onConflict: "detector_name,candidate_key" })
        .select("id,candidate_key")
        .single();
      if (storeError) throw storeError;

      const digest = `repeat_demand:0.1.0:${asOfDate}:${candidate.candidate_key}`;
      const { error: evidenceError } = await admin.from("learning_evidence").upsert({
        candidate_id: stored.id,
        evidence_digest: digest,
        evidence_type: "metric",
        source_table: "reservations",
        metric_name: "confirmed_bookings_28d",
        metric_value: candidate.evidence.bookings,
        sample_size: candidate.evidence.bookings,
        window_start: windowStart,
        window_end: asOfDate,
        dimensions: { usage_purpose: candidate.title.replace(/ 반복 수요$/, "") },
        payload: {
          distinct_customers: candidate.evidence.distinct_customers,
          active_weeks: candidate.evidence.active_weeks,
          net_revenue: candidate.evidence.net_revenue,
        },
      }, { onConflict: "candidate_id,evidence_digest" });
      if (evidenceError) throw evidenceError;

      const { error: actionError } = await admin.from("learning_actions").upsert({
        candidate_id: stored.id,
        action_type: "detected",
        actor_type: "detector",
        actor_label: "repeat_demand@0.1.0",
        idempotency_key: digest,
        payload: { detector_run_id: runId, window_start: windowStart, window_end: asOfDate },
      }, { onConflict: "idempotency_key" });
      if (actionError) throw actionError;
      storedCandidates.push(stored);
    }
  }

  return Response.json({
    ok: true,
    dry_run: !writeMode,
    detector_name: "repeat_demand",
    detector_version: "0.1.0",
    writes_performed: storedCandidates.length,
    stored_candidates: storedCandidates,
    as_of_date: asOfDate,
    window_start: windowStart,
    data_quality: {
      confirmed_bookings: data?.length ?? 0,
      classified_bookings: classified,
      purpose_completeness: data?.length ? Number((classified / data.length).toFixed(4)) : 0,
    },
    thresholds: { bookings: 3, distinct_customers: 2, active_weeks: 2 },
    candidates,
  }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
