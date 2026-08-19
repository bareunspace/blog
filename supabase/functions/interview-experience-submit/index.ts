import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://bareunjari.com',
  'Access-Control-Allow-Headers': 'apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
});

const allowedResults = new Set(['passed', 'rejected', 'next_stage', 'pending', 'undisclosed']);
const allowedInterviewActions = new Set(['general_qa', 'experience_explanation', 'pt_presentation', 'task_explanation', 'situational_response', 'video_ai', 'other']);
const allowedPreparationActions = new Set(['self_intro', 'experience_examples', 'ai_answer_practice', 'hiring_process_check', 'full_rehearsal', 'final_check', 'other']);
const allowedJourneyTasks = new Set(['self_intro', 'experience_examples', 'ai_answer_practice', 'hiring_process_check', 'full_rehearsal', 'final_check']);

const cleanText = (value: unknown, max: number) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
};

const cleanList = (value: unknown, allowed: Set<string>, max = 10) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item)).filter((item) => allowed.has(item)))].slice(0, max);
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const origin = req.headers.get('origin') || '';
  if (origin && origin !== 'https://bareunjari.com') return json({ ok: false, error: 'origin_not_allowed' }, 403);

  const publishableKeysRaw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}';
  let publishableKeys: Record<string, string> = {};
  try { publishableKeys = JSON.parse(publishableKeysRaw); } catch (_) {}
  const providedKey = req.headers.get('apikey') || '';
  const validKeys = Object.values(publishableKeys).filter(Boolean);
  if (!providedKey || !validKeys.includes(providedKey)) return json({ ok: false, error: 'invalid_api_key' }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch (_) { return json({ ok: false, error: 'invalid_json' }, 400); }

  const visitorToken = String(body.visitor_token || '').trim();
  const result = String(body.result || '').trim();
  const analysisConsent = body.analysis_consent === true;
  const publicConsent = body.public_consent === true;
  const honeypot = String(body.website || '').trim();

  if (honeypot) return json({ ok: true });
  if (!isUuid(visitorToken)) return json({ ok: false, error: 'invalid_visitor' }, 400);
  if (!allowedResults.has(result)) return json({ ok: false, error: 'invalid_result' }, 400);
  if (!analysisConsent) return json({ ok: false, error: 'consent_required' }, 400);

  const interviewActions = cleanList(body.interview_actions, allowedInterviewActions);
  const preparationActions = cleanList(body.preparation_actions, allowedPreparationActions);
  const journeyCompletedTasks = cleanList(body.journey_completed_tasks, allowedJourneyTasks, 6);
  const helpfulPreparation = cleanText(body.helpful_preparation, 800);
  const unexpectedPoint = cleanText(body.unexpected_point, 800);

  if (!interviewActions.length) return json({ ok: false, error: 'interview_action_required' }, 400);
  if (!helpfulPreparation && !unexpectedPoint) return json({ ok: false, error: 'experience_text_required' }, 400);

  let secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  try {
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    secretKey = secretKeys.default || secretKey;
  } catch (_) {}
  const url = Deno.env.get('SUPABASE_URL') || '';
  if (!url || !secretKey) return json({ ok: false, error: 'server_config' }, 500);

  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('interview_experiences')
    .select('id', { count: 'exact', head: true })
    .eq('visitor_token', visitorToken)
    .gte('created_at', tenMinutesAgo);

  if ((count || 0) >= 3) return json({ ok: false, error: 'rate_limited' }, 429);

  const payload = {
    result,
    company_name: cleanText(body.company_name, 80),
    job_role: cleanText(body.job_role, 80),
    interview_actions: interviewActions,
    preparation_actions: preparationActions,
    journey_completed_tasks: journeyCompletedTasks,
    helpful_preparation: helpfulPreparation,
    unexpected_point: unexpectedPoint,
    analysis_consent: true,
    public_consent: publicConsent,
    visitor_token: visitorToken,
    source_path: cleanText(body.source_path, 200),
    moderation_status: 'pending',
  };

  const { error } = await admin.from('interview_experiences').insert(payload);
  if (error) {
    console.error('interview experience insert failed', error.message);
    return json({ ok: false, error: 'insert_failed' }, 500);
  }

  return json({ ok: true });
});
