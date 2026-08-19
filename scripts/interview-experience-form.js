(() => {
  const configNode = document.getElementById('interviewExperienceConfig');
  const form = document.querySelector('[data-interview-experience-form]');
  if (!configNode || !form) return;

  let config = {};
  try { config = JSON.parse(configNode.textContent || '{}'); } catch (_) {}
  const supabaseUrl = String(config.supabaseUrl || '').replace(/\/$/, '');
  const publishableKey = String(config.supabaseAnonKey || '').trim();
  const endpoint = `${supabaseUrl}/functions/v1/interview-experience-submit`;

  const statusNode = form.querySelector('[data-interview-experience-status]');
  const submitButton = form.querySelector('button[type="submit"]');
  const JOURNEY_KEY = 'bareunjari_interview_journey_v1';
  const VISITOR_KEY = 'bareunjari-interview-experience-visitor-token';

  const uuid = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (window.crypto?.getRandomValues) {
      const b = window.crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b, (n) => n.toString(16).padStart(2, '0'));
      return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10,16).join('')}`;
    }
    return '00000000-0000-4000-8000-000000000000';
  };

  const getVisitorToken = () => {
    try {
      const saved = localStorage.getItem(VISITOR_KEY);
      if (saved) return saved;
      const token = uuid();
      localStorage.setItem(VISITOR_KEY, token);
      return token;
    } catch (_) {
      return uuid();
    }
  };

  const getJourneyCompleted = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(JOURNEY_KEY) || '{}');
      return Object.entries(parsed.tasks || {})
        .filter(([, value]) => Boolean(value?.completed_at))
        .map(([key]) => key);
    } catch (_) {
      return [];
    }
  };

  const checkCompletedPreparation = () => {
    const completed = new Set(getJourneyCompleted());
    form.querySelectorAll('input[name="preparation_actions"]').forEach((input) => {
      if (completed.has(input.value)) input.checked = true;
    });
  };

  const selected = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);

  const setStatus = (message, kind = 'error') => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.hidden = !message;
    statusNode.classList.toggle('is-success', kind === 'success');
    statusNode.classList.toggle('is-error', kind === 'error');
  };

  const setBusy = (busy) => {
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (submitButton) {
      submitButton.disabled = busy;
      submitButton.textContent = busy ? '경험을 저장하는 중…' : '면접 경험 남기기';
    }
  };

  checkCompletedPreparation();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    const interviewActions = selected('interview_actions');
    if (!interviewActions.length) {
      setStatus('실제 면접에서 경험한 항목을 하나 이상 선택해 주세요.');
      return;
    }

    const analysisConsent = form.elements.analysis_consent?.checked === true;
    if (!analysisConsent) {
      setStatus('면접 경험 분석 활용 동의가 필요합니다.');
      return;
    }

    const helpful = String(form.elements.helpful_preparation?.value || '').trim();
    const unexpected = String(form.elements.unexpected_point?.value || '').trim();
    if (!helpful && !unexpected) {
      setStatus('도움이 된 준비 또는 예상과 달랐던 점 중 하나는 작성해 주세요.');
      return;
    }

    if (!supabaseUrl || !publishableKey) {
      setStatus('제출 기능을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const payload = {
      result: String(form.elements.result?.value || 'undisclosed'),
      company_name: String(form.elements.company_name?.value || '').trim(),
      job_role: String(form.elements.job_role?.value || '').trim(),
      interview_actions: interviewActions,
      preparation_actions: selected('preparation_actions'),
      journey_completed_tasks: getJourneyCompleted(),
      helpful_preparation: helpful,
      unexpected_point: unexpected,
      analysis_consent: true,
      public_consent: form.elements.public_consent?.checked === true,
      visitor_token: getVisitorToken(),
      source_path: window.location.pathname,
      website: String(form.elements.website?.value || '').trim()
    };

    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publishableKey
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        if (response.status === 429) throw new Error('잠시 후 다시 제출해 주세요.');
        throw new Error('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }

      form.reset();
      checkCompletedPreparation();
      setStatus('면접 경험이 저장됐어요. 공개 동의한 내용도 검수 후에만 익명으로 활용합니다.', 'success');
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'interview_experience_submit', {
          result: payload.result,
          public_consent: payload.public_consent,
          interview_action_count: payload.interview_actions.length,
          preparation_action_count: payload.preparation_actions.length
        });
      }
    } catch (error) {
      setStatus(error?.message || '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  });
})();
