(() => {
  const form = document.querySelector('[data-aii-form]');
  if (!form) return;

  const practiceMode = form.querySelector('[data-aii-mode]');
  const questionCount = form.querySelector('select[name="question_count"]');
  const interviewType = form.querySelector('[data-aii-type-select]');
  const speakQuestionButton = document.querySelector('[data-aii-speak-question]');
  if (!practiceMode || !questionCount || !interviewType) return;

  const sourceLabel = document.createElement('label');
  sourceLabel.className = 'aii-custom-source';
  sourceLabel.innerHTML = `
    <span>질문 방식</span>
    <select name="question_source" data-aii-question-source>
      <option value="ai">AI 추천 질문</option>
      <option value="custom">내 질문 직접 입력</option>
    </select>
  `;

  const customLabel = document.createElement('label');
  customLabel.className = 'aii-custom-questions';
  customLabel.hidden = true;
  customLabel.innerHTML = `
    <span>내 질문 <small>(한 줄에 하나, 최대 10개)</small></span>
    <textarea data-aii-custom-questions rows="6" placeholder="예: 자기소개 해주세요.\n왜 이 회사에 지원했나요?\n갈등을 해결한 경험을 말해주세요."></textarea>
    <small data-aii-custom-status>입력한 질문 문장을 그대로 사용하고, 답변은 기존 AI 피드백으로 분석합니다.</small>
  `;

  const firstLabel = form.querySelector('label');
  if (firstLabel && firstLabel.nextSibling) {
    form.insertBefore(sourceLabel, firstLabel.nextSibling);
  } else {
    form.prepend(sourceLabel);
  }

  const actionRow = form.querySelector('.aii-actions');
  form.insertBefore(customLabel, actionRow || null);

  const sourceSelect = sourceLabel.querySelector('[data-aii-question-source]');
  const customTextarea = customLabel.querySelector('[data-aii-custom-questions]');
  const statusNode = customLabel.querySelector('[data-aii-custom-status]');

  const style = document.createElement('style');
  style.textContent = `
    .aii-form .aii-custom-questions{grid-column:1/-1;display:grid;gap:.4rem}
    .aii-form .aii-custom-questions[hidden]{display:none}
    .aii-form .aii-custom-questions textarea{width:100%;min-height:150px;border:1px solid #ced7d1;border-radius:12px;padding:.8rem .9rem;font:inherit;line-height:1.6;resize:vertical;background:#fff}
    .aii-form .aii-custom-questions textarea:focus{outline:2px solid #6abf91;outline-offset:2px;border-color:#3d8b63}
    .aii-form .aii-custom-questions small{font-weight:500;color:#64746b;line-height:1.45}
    .aii-form .aii-custom-questions span small{font-size:.78em}
  `;
  document.head.appendChild(style);

  let customQuestionsForNextRequest = [];
  let restoreInterviewType = '';
  const originalFetch = window.fetch.bind(window);

  const parseCustomQuestions = () => {
    const rows = String(customTextarea.value || '')
      .split(/\n+/)
      .map((row) => row.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean);
    return Array.from(new Set(rows)).slice(0, 10);
  };

  const ensureQuestionCountOption = (count) => {
    const value = String(Math.min(Math.max(Number(count) || 1, 1), 10));
    if (!Array.from(questionCount.options).some((option) => option.value === value)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = `${value}개`;
      option.setAttribute('data-aii-custom-count-option', 'true');
      questionCount.appendChild(option);
    }
    questionCount.value = value;
  };

  const syncCustomMode = () => {
    const isInterview = String(practiceMode.value || '') === 'interview';
    sourceLabel.hidden = !isInterview;
    if (!isInterview) sourceSelect.value = 'ai';
    const isCustom = isInterview && sourceSelect.value === 'custom';
    customLabel.hidden = !isCustom;
    customTextarea.required = isCustom;
    if (isCustom) {
      const rows = parseCustomQuestions();
      if (rows.length) ensureQuestionCountOption(rows.length);
    }
  };

  customTextarea.addEventListener('input', () => {
    const rows = parseCustomQuestions();
    if (rows.length) ensureQuestionCountOption(rows.length);
    statusNode.textContent = rows.length
      ? `${rows.length}개 질문이 준비되었습니다. 입력한 문장을 그대로 사용합니다.`
      : '입력한 질문 문장을 그대로 사용하고, 답변은 기존 AI 피드백으로 분석합니다.';
  });

  sourceSelect.addEventListener('change', syncCustomMode);
  practiceMode.addEventListener('change', syncCustomMode);

  form.addEventListener('submit', (event) => {
    if (sourceSelect.value !== 'custom' || String(practiceMode.value || '') !== 'interview') return;

    const rows = parseCustomQuestions();
    if (!rows.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      customTextarea.focus();
      statusNode.textContent = '질문을 1개 이상 입력해 주세요.';
      return;
    }

    customQuestionsForNextRequest = rows;
    ensureQuestionCountOption(rows.length);

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('aii:question-cache:')) localStorage.removeItem(key);
      });
    } catch (_error) {
      // Storage is optional.
    }

    // The original interview code applies extra length/depth filters to some
    // interview types. Temporarily use an unfiltered type only while the
    // question array is accepted, then restore the user's actual type before
    // they begin answering. This keeps custom questions exactly as entered.
    restoreInterviewType = String(interviewType.value || '').trim();
    if (restoreInterviewType && restoreInterviewType !== '직무면접') {
      interviewType.value = '직무면접';
      window.setTimeout(() => {
        if (!restoreInterviewType) return;
        const originalType = restoreInterviewType;
        restoreInterviewType = '';
        interviewType.value = originalType;
        interviewType.dispatchEvent(new Event('change', { bubbles: true }));
        if (speakQuestionButton && !speakQuestionButton.disabled) {
          speakQuestionButton.click();
        }
      }, 0);
    }
  }, true);

  window.fetch = async (input, init) => {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      if (
        customQuestionsForNextRequest.length > 0 &&
        url.includes('/functions/v1/ai-interview-feedback') &&
        body?.action === 'generate_questions'
      ) {
        const requested = Math.min(Math.max(Number(body.questionCount) || customQuestionsForNextRequest.length, 1), 10);
        const questions = customQuestionsForNextRequest.slice(0, requested);
        customQuestionsForNextRequest = [];
        return new Response(JSON.stringify({ questions, source: 'ai' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (_error) {
      // Fall through to the original request.
    }
    return originalFetch(input, init);
  };

  syncCustomMode();
})();
