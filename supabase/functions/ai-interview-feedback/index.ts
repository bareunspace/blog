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

type QuestionGenerationPayload = {
  company: string;
  role: string;
  interviewType: string;
  questionCount: number;
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

type QuestionGenerationResult = {
  questions: string[];
};

type FeedbackQualityAudit = {
  completionScore: number;
  answerQualityScore: number;
  evidenceScore: number;
  feedbackScore: number;
  overall: number;
  reasons: string[];
};

const isEnglishSentence = (value: string) => {
  const text = String(value || '').trim();
  if (!text) {
    return false;
  }
  const letters = text.match(/[A-Za-z]/g) || [];
  const hangul = text.match(/[가-힣]/g) || [];
  if (letters.length < 6) {
    return false;
  }
  return letters.length >= hangul.length * 2;
};

const isEnglishPracticeMode = (interviewType: string) => {
  const value = String(interviewType || '').trim();
  return value === '영어면접' || value === '데일리영어';
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

const extractModelContent = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const choices = (value as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return '';
  }
  const first = choices[0];
  if (!first || typeof first !== 'object') {
    return '';
  }
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== 'object') {
    return '';
  }
  return String((message as { content?: unknown }).content || '').trim();
};

const parsePositiveInt = (value: string, fallbackValue: number) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
};

const clampScore = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
};

const evaluateGeneratedQuestionQuality = (
  questions: string[],
  payload: QuestionGenerationPayload
) => {
  if (questions.length === 0) {
    return 0;
  }
  const normalized = questions.map((item) => item.toLowerCase());
  const uniqueScore = Math.round((new Set(normalized).size / questions.length) * 100);
  const languageScore = isEnglishPracticeMode(payload.interviewType)
    ? Math.round((questions.filter((item) => isEnglishSentence(item)).length / questions.length) * 100)
    : Math.round((questions.filter((item) => !isEnglishSentence(item)).length / questions.length) * 100);
  const trendKeywords = isEnglishPracticeMode(payload.interviewType)
    ? ['data', 'ai', 'customer', 'collaboration', 'problem', 'adapt', 'execution', 'impact']
    : ['데이터', 'ai', '고객', '협업', '문제', '적응', '실행', '성과'];
  const trendHits = questions.filter((item) => trendKeywords.some((keyword) => item.toLowerCase().includes(keyword))).length;
  const trendScore = Math.round((trendHits / questions.length) * 100);
  const role = String(payload.role || '').trim().toLowerCase();
  const company = String(payload.company || '').trim().toLowerCase();
  const contextHits = questions.filter((item) => {
    const lower = item.toLowerCase();
    return (role && lower.includes(role)) || (company && lower.includes(company));
  }).length;
  const contextScore = (role || company)
    ? Math.round((contextHits / questions.length) * 100)
    : 70;

  return clampScore(Math.round((languageScore * 0.35) + (uniqueScore * 0.25) + (trendScore * 0.25) + (contextScore * 0.15)));
};

const buildFeedbackQualityAudit = (payload: FeedbackPayload, feedback: FeedbackResult): FeedbackQualityAudit => {
  const answers = payload.qa.map((item) => String(item.answer || '').trim());
  const total = Math.max(1, payload.qa.length);
  const answered = answers.filter(Boolean).length;
  const completionScore = clampScore((answered / total) * 100);
  const avgLength = answered > 0
    ? Math.round(answers.filter(Boolean).reduce((sum, item) => sum + item.length, 0) / answered)
    : 0;
  const answerQualityScore = clampScore(avgLength >= 170 ? 92 : avgLength >= 120 ? 80 : avgLength >= 80 ? 68 : 52);
  const evidenceHits = answers.filter((item) => /\d|결과|성과|개선|impact|result|metric|data/i.test(item)).length;
  const evidenceScore = clampScore((evidenceHits / total) * 100);
  const feedbackScore = clampScore(feedback.scoreCard?.overall ?? Math.round((feedback.scoreCard.clarity + feedback.scoreCard.specificity + feedback.scoreCard.structure) / 3));
  const overall = clampScore(Math.round((completionScore * 0.35) + (answerQualityScore * 0.25) + (evidenceScore * 0.2) + (feedbackScore * 0.2)));

  const reasons: string[] = [];
  if (completionScore >= 85) {
    reasons.push('답변 완료율이 높아 면접 흐름 유지가 좋습니다.');
  } else {
    reasons.push('미응답 질문을 줄이면 점수가 크게 올라갑니다.');
  }
  if (evidenceScore >= 70) {
    reasons.push('수치/결과 근거를 포함해 답변 신뢰도가 높습니다.');
  } else {
    reasons.push('수치, 기간, 결과를 보강하면 설득력이 올라갑니다.');
  }
  if (answerQualityScore >= 75) {
    reasons.push('평균 답변 길이가 적절해 핵심 전달이 안정적입니다.');
  } else {
    reasons.push('답변 길이를 120자 이상으로 유지하면 전달력이 좋아집니다.');
  }

  return {
    completionScore,
    answerQualityScore,
    evidenceScore,
    feedbackScore,
    overall,
    reasons: reasons.slice(0, 3)
  };
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

const normalizeQuestionGeneration = (
  value: unknown,
  maxItems: number,
  interviewType: string
): QuestionGenerationResult | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const useEnglishOnly = isEnglishPracticeMode(interviewType);
  const questions = normalizeArray(record.questions, maxItems)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => (useEnglishOnly ? isEnglishSentence(item) : true))
    .filter((item) => item.length >= 12)
    .slice(0, maxItems);

  if (questions.length === 0) {
    return null;
  }

  return { questions };
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

const buildQuestionPrompt = (payload: QuestionGenerationPayload) => {
  const englishMode = isEnglishPracticeMode(payload.interviewType);
  const languageRule = englishMode
    ? '질문은 모두 자연스러운 영어로 작성하세요.'
    : '질문은 모두 자연스러운 한국어 존댓말로 작성하세요.';
  const practiceRule = payload.interviewType === '데일리영어'
    ? [
      '질문 설계는 데일리 영어 스피킹 연습 목적에 맞추세요.',
      '- 면접형 질문보다 일상 대화/설명/롤플레이 중심으로 작성',
      '- 자기소개, 하루 루틴, 취향 설명, 상황 대화, 의견 말하기를 고르게 포함',
      '- 답변 난이도는 B1~B2 수준의 명확한 문장으로 답할 수 있게 작성'
    ]
    : [];

  return [
    '당신은 채용 트렌드 기반 면접 질문 설계자입니다.',
    '반드시 JSON 객체만 반환하세요.',
    '필수 키: questions',
    `questions는 ${payload.questionCount}개 문자열 배열이어야 합니다.`,
    '질문 설계 규칙:',
    '- 회사명/직무/면접유형을 반영해 구체적으로 작성',
    '- 최근 트렌드(실행력, 데이터 기반 판단, AI 활용, 협업 커뮤니케이션, 고객 중심, 문제 해결력, 변화 적응력)를 반영',
    '- 서로 중복되지 않게 작성',
    '- 한 질문은 1~2문장 이내',
    '- 마크다운 금지, 코드블록 금지, 설명문 금지',
    ...practiceRule,
    `- ${languageRule}`,
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

  const content = extractModelContent(result);
  const parsed = extractJsonObject(content);
  const normalized = normalizeFeedback(parsed);
  if (!normalized) {
    throw new Error('invalid_provider_response');
  }

  return normalized;
};

const callAiProviderForQuestions = async (
  payload: QuestionGenerationPayload,
  model: string,
  provider: 'openrouter' | 'openai' | 'compatible',
  temperature = 0.7
): Promise<QuestionGenerationResult> => {
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
      temperature,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: 'Return only strict JSON. No markdown or explanations.'
        },
        {
          role: 'user',
          content: buildQuestionPrompt(payload)
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

  const content = extractModelContent(result);
  const parsed = extractJsonObject(content);
  const normalized = normalizeQuestionGeneration(parsed, payload.questionCount, payload.interviewType);
  if (!normalized) {
    throw new Error('invalid_provider_response');
  }

  return normalized;
};

const generateQuestionsWithRetry = async (
  payload: QuestionGenerationPayload,
  model: string,
  provider: 'openrouter' | 'openai' | 'compatible'
) => {
  const first = await callAiProviderForQuestions(payload, model, provider, 0.7);
  const firstQuality = evaluateGeneratedQuestionQuality(first.questions, payload);
  if (firstQuality >= 72) {
    return first;
  }

  const second = await callAiProviderForQuestions(payload, model, provider, 0.45);
  const secondQuality = evaluateGeneratedQuestionQuality(second.questions, payload);
  return secondQuality >= firstQuality ? second : first;
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
  const action = String((body as Record<string, unknown>)?.action || 'feedback').trim().toLowerCase();

  if (action === 'generate_questions') {
    const company = String((body as Record<string, unknown>)?.company || '').trim().slice(0, 120);
    const role = String((body as Record<string, unknown>)?.role || '').trim().slice(0, 120);
    const interviewType = String((body as Record<string, unknown>)?.interviewType || '').trim().slice(0, 40);
    const questionCountRaw = Number((body as Record<string, unknown>)?.questionCount || 10);
    const questionCount = Math.min(10, Math.max(1, Number.isFinite(questionCountRaw) ? Math.round(questionCountRaw) : 10));

    const payload: QuestionGenerationPayload = {
      company,
      role,
      interviewType,
      questionCount
    };

    try {
      const guardContext = await runUsageGuards(req);
      const generated = await generateQuestionsWithRetry(payload, guardContext.model, guardContext.provider);
      return jsonResponse(200, {
        questions: generated.questions,
        source: 'ai'
      });
    } catch (error) {
      const reason = error instanceof Error
        ? String(error.message || 'unknown_error')
        : stringifyUnknown(error) || 'unknown_error';
      return jsonResponse(200, {
        fallback: true,
        reason
      });
    }
  }

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
    const qualityAudit = buildFeedbackQualityAudit(payload, feedback);
    return jsonResponse(200, { feedback, qualityAudit });
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
