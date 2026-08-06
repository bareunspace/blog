import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

type QaItem = {
  question: string;
  answer: string;
};

type FeedbackPayload = {
  company: string;
  role: string;
  interviewType: string;
  qa: QaItem[];
};

type FeedbackResult = {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextQuestions: string[];
  scoreCard: {
    clarity: number;
    specificity: number;
    structure: number;
    overall: number;
  };
  questionReviews: Array<{
    question: string;
    score: number;
    comment: string;
  }>;
};

type GuardContext = {
  model: string;
  provider: 'openrouter' | 'openai' | 'compatible';
};

const jsonResponse = (status: number, body: unknown) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
};

const normalizeArray = (value: unknown, maxItems: number) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, maxItems);
};

const stringifyUnknown = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (_error) {
      return String(value);
    }
  }
  return String(value ?? '');
};

const parsePositiveInt = (value: string, fallbackValue: number) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
};

const getHeaderValue = (req: Request, key: string) => {
  return String(req.headers.get(key) || '').trim();
};

const getClientIp = (req: Request) => {
  const forwardedFor = getHeaderValue(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim().slice(0, 64);
  }
  const realIp = getHeaderValue(req, 'x-real-ip');
  if (realIp) {
    return realIp.slice(0, 64);
  }
  return 'unknown';
};

const getUtcDayStartIso = () => {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  return dayStart.toISOString();
};

const extractJsonObject = (raw: string) => {
  const text = String(raw || '').trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    // Fall through and try extracting the first JSON object block.
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (_error) {
    return null;
  }
};

const normalizeFeedback = (value: unknown): FeedbackResult | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const summary = String(record.summary || '').trim();
  const strengths = normalizeArray(record.strengths, 3);
  const improvements = normalizeArray(record.improvements, 3);
  const nextQuestions = normalizeArray(record.nextQuestions, 2);
  const scoreCardRaw = (record.scoreCard && typeof record.scoreCard === 'object')
    ? record.scoreCard as Record<string, unknown>
    : {};
  const toScore = (score: unknown, fallbackValue: number) => {
    const numeric = Number(score);
    if (!Number.isFinite(numeric)) {
      return fallbackValue;
    }
    return Math.max(0, Math.min(100, Math.round(numeric)));
  };
  const scoreCard = {
    clarity: toScore(scoreCardRaw.clarity, 72),
    specificity: toScore(scoreCardRaw.specificity, 70),
    structure: toScore(scoreCardRaw.structure, 73),
    overall: toScore(scoreCardRaw.overall, 72)
  };
  const questionReviewsRaw = Array.isArray(record.questionReviews) ? record.questionReviews : [];
  const questionReviews = questionReviewsRaw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const question = String(row.question || '').trim();
      const comment = String(row.comment || '').trim();
      if (!question || !comment) {
        return null;
      }
      return {
        question,
        comment,
        score: toScore(row.score, 70)
      };
    })
    .filter((item): item is { question: string; score: number; comment: string } => Boolean(item))
    .slice(0, 7);

  if (!summary || strengths.length === 0 || improvements.length === 0 || nextQuestions.length === 0) {
    return null;
  }

  return {
    summary,
    strengths,
    improvements,
    nextQuestions,
    scoreCard,
    questionReviews
  };
};

const buildPrompt = (payload: FeedbackPayload) => {
  return [
    '당신은 한국어 면접 코치입니다.',
    '아래 QA를 읽고 반드시 JSON 객체만 반환하세요.',
    '필수 키: summary, strengths, improvements, nextQuestions, scoreCard, questionReviews',
    '제약:',
    '- summary: 1~2문장',
    '- strengths: 3개 배열',
    '- improvements: 3개 배열',
    '- nextQuestions: 2개 배열',
    '- scoreCard: { clarity, specificity, structure, overall } (0~100 정수)',
    '- questionReviews: 각 질문에 대해 { question, score, comment } 배열 (최대 7개)',
    '- 모든 문장은 한국어 존댓말',
    '- 마크다운 금지, 코드블록 금지, 설명문 금지',
    '',
    JSON.stringify(payload)
  ].join('\n');
};

const callAiProvider = async (
  payload: FeedbackPayload,
  model: string,
  provider: 'openrouter' | 'openai' | 'compatible'
): Promise<FeedbackResult> => {
  const apiKey = String(Deno.env.get('AI_INTERVIEW_API_KEY') || '').trim()
    || (provider === 'openai'
      ? String(Deno.env.get('OPENAI_API_KEY') || '').trim()
      : String(Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '').trim());

  if (!apiKey) {
    throw new Error('api_not_configured');
  }

  const defaultApiUrl = provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
  const apiUrl = String(Deno.env.get('AI_INTERVIEW_API_URL') || defaultApiUrl).trim();
  const origin = String(Deno.env.get('AI_INTERVIEW_ORIGIN') || 'https://bareunjari.com').trim();

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = origin;
    headers['X-Title'] = 'bareunjari-ai-interview-demo';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 650,
      messages: [
        {
          role: 'system',
          content: 'Return only strict JSON. No markdown or explanations.'
        },
        {
          role: 'user',
          content: buildPrompt(payload)
        }
      ]
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorField = (result as Record<string, unknown>)?.error;
    const nestedMessage = errorField && typeof errorField === 'object'
      ? String((errorField as Record<string, unknown>)?.message || (errorField as Record<string, unknown>)?.code || '').trim()
      : '';
    const topMessage = String((result as Record<string, unknown>)?.message || '').trim();
    const rawError = stringifyUnknown(errorField).trim();
    const message = nestedMessage || topMessage || rawError || `provider_http_${response.status}`;
    throw new Error(message);
  }

  const content = String((result as Record<string, unknown>)?.choices?.[0]?.message?.content || '').trim();
  const parsed = extractJsonObject(content);
  const normalized = normalizeFeedback(parsed);
  if (!normalized) {
    throw new Error('invalid_provider_response');
  }

  return normalized;
};

const runUsageGuards = async (req: Request): Promise<GuardContext> => {
  const providerRaw = String(Deno.env.get('AI_INTERVIEW_PROVIDER') || 'openrouter').trim().toLowerCase();
  const provider = providerRaw === 'openai' || providerRaw === 'compatible' ? providerRaw : 'openrouter';
  const model = String(
    Deno.env.get('AI_INTERVIEW_MODEL')
      || (provider === 'openai' ? 'gpt-4.1-mini' : 'meta-llama/llama-3.1-8b-instruct:free')
  ).trim();
  const allowedModelsRaw = String(Deno.env.get('AI_INTERVIEW_ALLOWED_MODELS') || model).trim();
  const requireFreeModel = String(Deno.env.get('AI_INTERVIEW_REQUIRE_FREE_MODEL') || 'true').trim().toLowerCase() !== 'false';
  const maxDailyCalls = parsePositiveInt(String(Deno.env.get('AI_INTERVIEW_MAX_DAILY_CALLS') || '120'), 120);

  const allowedModels = new Set(
    allowedModelsRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

  if (!allowedModels.has(model)) {
    throw new Error('model_not_allowed');
  }

  if (provider === 'openrouter' && requireFreeModel && !model.includes(':free')) {
    throw new Error('paid_model_blocked');
  }

  const supabaseUrl = String(Deno.env.get('SUPABASE_URL') || '').trim();
  const serviceRoleKey = String(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('supabase_service_not_configured');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const dayStartIso = getUtcDayStartIso();
  const { count, error: countError } = await supabase
    .from('ai_interview_usage_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayStartIso);

  if (countError) {
    throw new Error('usage_log_count_failed');
  }

  if ((count || 0) >= maxDailyCalls) {
    throw new Error('daily_limit_reached');
  }

  const clientIp = getClientIp(req);
  const { error: insertError } = await supabase
    .from('ai_interview_usage_logs')
    .insert({
      client_ip: clientIp,
      model,
      request_source: 'ai-interview-demo'
    });

  if (insertError) {
    throw new Error('usage_log_insert_failed');
  }

  return { model, provider };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const body = await req.json().catch(() => ({}));
  const company = String((body as Record<string, unknown>)?.company || '').trim();
  const role = String((body as Record<string, unknown>)?.role || '').trim();
  const interviewType = String((body as Record<string, unknown>)?.interviewType || '').trim();
  const qaRaw = Array.isArray((body as Record<string, unknown>)?.qa) ? (body as Record<string, unknown>).qa as Array<Record<string, unknown>> : [];

  const qa = qaRaw
    .map((item) => ({
      question: String(item?.question || '').trim().slice(0, 240),
      answer: String(item?.answer || '').trim().slice(0, 500)
    }))
    .filter((item) => item.question.length > 0)
    .slice(0, 7);

  if (qa.length === 0) {
    return jsonResponse(400, { error: '질문/답변 데이터가 필요합니다.' });
  }

  const payload: FeedbackPayload = {
    company,
    role,
    interviewType,
    qa
  };

  try {
    const guardContext = await runUsageGuards(req);
    const feedback = await callAiProvider(payload, guardContext.model, guardContext.provider);
    return jsonResponse(200, { feedback });
  } catch (error) {
    const reason = error instanceof Error
      ? String(error.message || 'unknown_error')
      : stringifyUnknown(error) || 'unknown_error';
    return jsonResponse(200, {
      fallback: true,
      reason
    });
  }
});
