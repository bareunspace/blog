(() => {
  const form = document.querySelector('[data-aii-form]');
  if (!form) return;

  const practiceMode = form.querySelector('[data-aii-mode]');
  const questionCount = form.querySelector('select[name="question_count"]');
  const interviewType = form.querySelector('[data-aii-type-select]');
  const questionNode = document.querySelector('[data-aii-question]');
  const progressNode = document.querySelector('[data-aii-progress]');
  const resultListNode = document.querySelector('[data-aii-result-list]');
  if (!practiceMode || !questionCount || !interviewType || !questionNode || !progressNode) return;

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
  if (firstLabel && firstLabel.nextSibling) form.insertBefore(sourceLabel, firstLabel.nextSibling);
  else form.prepend(sourceLabel);

  const actionRow = form.querySelector('.aii-actions');
  form.insertBefore(customLabel, actionRow || null);

  const sourceSelect = sourceLabel.querySelector('[data-aii-question-source]');
  const customTextarea = customLabel.querySelector('[data-aii-custom-questions]');
  const statusNode = customLabel.querySelector('[data-aii-custom-status]');
  const companyInput = form.querySelector('[data-aii-company-input]');
  const roleInput = form.querySelector('[data-aii-role-input]');
  const interviewTypeSelect = form.querySelector('[data-aii-type-select]');
  const demoSection = document.querySelector('.aii-block-demo');
  const resultCopyNode = document.querySelector('.aii-result-copy');
  const deviceCopyNode = document.querySelector('.aii-device-copy');
  const storageKey = 'aii:prefill-from-case';

  const style = document.createElement('style');
  style.textContent = `
    .aii-form .aii-custom-questions{grid-column:1/-1;display:grid;gap:.4rem}
    .aii-form .aii-custom-questions[hidden]{display:none}
    .aii-form .aii-custom-questions textarea{width:100%;min-height:150px;border:1px solid #ced7d1;border-radius:12px;padding:.8rem .9rem;font:inherit;line-height:1.6;resize:vertical;background:#fff}
    .aii-form .aii-custom-questions textarea:focus{outline:2px solid #6abf91;outline-offset:2px;border-color:#3d8b63}
    .aii-form .aii-custom-questions small{font-weight:500;color:#64746b;line-height:1.45}
    .aii-form .aii-custom-questions span small{font-size:.78em}
    .aii-case-prefill-note{grid-column:1/-1;display:grid;gap:.3rem;padding:.9rem 1rem;border:1px solid #d7e8de;border-radius:14px;background:#f5fbf7;color:#305240}
    .aii-case-prefill-note strong{font-size:.95rem}
    .aii-case-prefill-note p{margin:0;font-size:.88rem;line-height:1.55}
    .aii-case-recording-tip{margin:.55rem 0 0;font-size:.8rem;color:#5f7067;line-height:1.5}
  `;
  document.head.appendChild(style);

  let activeCustomQuestions = [];
  let customModeActive = false;
  const originalFetch = window.fetch.bind(window);
  const NativeUtterance = window.SpeechSynthesisUtterance;

  const parseCustomQuestions = () => Array.from(new Set(
    String(customTextarea.value || '')
      .split(/\n+/)
      .map((row) => row.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean)
  )).slice(0, 10);

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

  if (demoSection && !demoSection.querySelector('[data-aii-recording-tip]')) {
    const tip = document.createElement('p');
    tip.className = 'aii-case-recording-tip';
    tip.setAttribute('data-aii-recording-tip', 'true');
    tip.textContent = '답변이 정리되면 카메라·마이크를 켜고 녹화까지 해 보세요. 저장한 영상을 다시 보면 말의 속도와 반복 표현을 더 쉽게 점검할 수 있습니다.';
    const toolbar = demoSection.querySelector('.aii-live-toolbar');
    if (toolbar) toolbar.insertAdjacentElement('afterend', tip);
  }

  const applyCasePrefill = () => {
    let payload = null;
    try {
      payload = JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch (_error) {
      payload = null;
    }
    if (!payload || !Array.isArray(payload.questions) || !payload.questions.length) return;

    if (practiceMode) practiceMode.value = 'interview';
    if (sourceSelect) sourceSelect.value = 'custom';
    if (companyInput && payload.company) companyInput.value = payload.company;
    if (roleInput && payload.role) roleInput.value = payload.role;
    if (interviewTypeSelect && payload.interviewType) {
      const wanted = String(payload.interviewType);
      if (Array.from(interviewTypeSelect.options).some((option) => option.value === wanted)) {
        interviewTypeSelect.value = wanted;
      }
    }

    let prefillNote = form.querySelector('[data-aii-case-prefill-note]');
    if (!prefillNote) {
      prefillNote = document.createElement('div');
      prefillNote.className = 'aii-case-prefill-note';
      prefillNote.setAttribute('data-aii-case-prefill-note', 'true');
      form.insertBefore(prefillNote, customLabel);
    }
    prefillNote.innerHTML = `
      <strong>${payload.title || `${payload.company} 사례`} 기준 질문이 자동 입력되었습니다.</strong>
      <p>질문 방식은 <b>내 질문 직접 입력</b>으로 맞춰 두었습니다. 답변한 뒤 카메라·마이크를 켜서 녹화하고, 영상을 현재 기기에 저장해 다시 볼 수 있습니다.</p>
    `;

    customTextarea.value = payload.questions.join('\n');
    ensureQuestionCountOption(payload.questions.length);
    activeCustomQuestions = payload.questions.slice(0, 10);
    customModeActive = true;
    statusNode.textContent = `${activeCustomQuestions.length}개 질문이 준비되었습니다. 입력한 문장을 그대로 사용합니다.`;
    if (deviceCopyNode) {
      deviceCopyNode.textContent = '사례 기준 질문에 실제로 답한 뒤 녹화해 보세요. 녹화 영상은 현재 기기에만 저장되고, 다시 보며 속도와 반복 표현을 점검할 수 있습니다.';
    }
    if (resultCopyNode) {
      resultCopyNode.textContent = '아래 요약을 확인한 뒤 영상을 저장해 다시 보고, 바로 2회차를 진행하거나 면접준비 허브에서 답변 구조를 정리해 보세요.';
    }
    syncCustomMode();

    customTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
    practiceMode.dispatchEvent(new Event('change', { bubbles: true }));

    try {
      localStorage.removeItem(storageKey);
    } catch (_error) {}

    if (window.location.search.includes('focus=1')) {
      window.setTimeout(() => {
        customTextarea.focus();
        customTextarea.setSelectionRange(customTextarea.value.length, customTextarea.value.length);
      }, 80);
    }
  };

  const getCurrentIndex = () => {
    const match = String(progressNode.textContent || '').match(/질문\s*(\d+)\s*\/\s*(\d+)/);
    return match ? Math.max(0, Number(match[1]) - 1) : 0;
  };

  const paintCustomQuestion = () => {
    if (!customModeActive || !activeCustomQuestions.length) return;
    const index = getCurrentIndex();
    const custom = activeCustomQuestions[index];
    if (custom && questionNode.textContent !== custom) questionNode.textContent = custom;
  };

  const paintResultQuestions = () => {
    if (!customModeActive || !resultListNode || !activeCustomQuestions.length) return;
    const rows = resultListNode.querySelectorAll('li');
    rows.forEach((li, index) => {
      const custom = activeCustomQuestions[index];
      if (!custom) return;
      const text = String(li.textContent || '');
      const answerPart = text.includes(' / A.') ? text.slice(text.indexOf(' / A.')) : '';
      li.textContent = `Q${index + 1}. ${custom}${answerPart}`;
    });
  };

  const makeInternalQuestions = (count, type) => {
    const isEnglish = type === '영어면접';
    return Array.from({ length: count }, (_, index) => isEnglish
      ? `Custom interview question ${index + 1}. Please explain your answer with one concrete example, your action, and the result.`
      : `사용자 직접 입력 질문 ${index + 1}입니다. 구체적인 경험이나 사례를 바탕으로 본인의 행동과 결과까지 함께 설명해 주세요.`
    );
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
    if (sourceSelect.value !== 'custom' || String(practiceMode.value || '') !== 'interview') {
      customModeActive = false;
      activeCustomQuestions = [];
      return;
    }

    const rows = parseCustomQuestions();
    if (!rows.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      customTextarea.focus();
      statusNode.textContent = '질문을 1개 이상 입력해 주세요.';
      return;
    }

    activeCustomQuestions = rows;
    customModeActive = true;
    ensureQuestionCountOption(rows.length);

    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('aii:question-cache:')) localStorage.removeItem(key);
      });
    } catch (_error) {}

    window.setTimeout(paintCustomQuestion, 0);
    window.setTimeout(paintCustomQuestion, 150);
    window.setTimeout(paintCustomQuestion, 500);
  }, true);

  const observer = new MutationObserver(() => {
    paintCustomQuestion();
    paintResultQuestions();
  });
  observer.observe(progressNode, { childList: true, subtree: true, characterData: true });
  observer.observe(questionNode, { childList: true, subtree: true, characterData: true });
  if (resultListNode) observer.observe(resultListNode, { childList: true, subtree: true, characterData: true });

  if (NativeUtterance) {
    window.SpeechSynthesisUtterance = function(text) {
      if (customModeActive && activeCustomQuestions.length) {
        const custom = activeCustomQuestions[getCurrentIndex()];
        return new NativeUtterance(custom || text);
      }
      return new NativeUtterance(text);
    };
    window.SpeechSynthesisUtterance.prototype = NativeUtterance.prototype;
  }

  window.fetch = async (input, init) => {
    try {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      const body = init?.body ? JSON.parse(String(init.body)) : null;

      if (customModeActive && activeCustomQuestions.length && url.includes('/functions/v1/ai-interview-feedback')) {
        if (body?.action === 'generate_questions') {
          const questions = makeInternalQuestions(activeCustomQuestions.length, String(interviewType.value || ''));
          return new Response(JSON.stringify({ questions, source: 'ai' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (!body?.action && Array.isArray(body?.qa)) {
          body.qa = body.qa.map((item, index) => ({
            ...item,
            question: activeCustomQuestions[index] || item.question
          }));
          init = { ...init, body: JSON.stringify(body) };
        }

        if (body?.action === 'question_feedback') {
          body.question = activeCustomQuestions[getCurrentIndex()] || body.question;
          init = { ...init, body: JSON.stringify(body) };
        }
      }
    } catch (_error) {}
    return originalFetch(input, init);
  };

  syncCustomMode();
  applyCasePrefill();
})();
