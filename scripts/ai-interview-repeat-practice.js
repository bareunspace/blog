(() => {
  if (window.location.pathname !== '/ai-interview/') return;

  const card = document.querySelector('[data-aii-card]');
  const answerNode = document.querySelector('[data-aii-answer]');
  const answerStartButton = document.querySelector('[data-aii-answer-start]');
  const answerStopButton = document.querySelector('[data-aii-answer-stop]');
  const questionNode = document.querySelector('[data-aii-question]');
  const progressNode = document.querySelector('[data-aii-progress]');
  const recordStartButton = document.querySelector('[data-aii-record-start]');
  const recordStopButton = document.querySelector('[data-aii-record-stop]');
  const recordDownloadButton = document.querySelector('[data-aii-record-download]');
  const voiceStatusNode = document.querySelector('[data-aii-voice-status]');

  if (!card || !answerNode || !answerStartButton || !questionNode || !progressNode) return;

  const send = (name, params = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      page_type: 'ai_interview',
      feature_area: 'repeat_practice',
      page_path: window.location.pathname,
      ...params
    });
  };

  const getQuestionKey = () => {
    const progress = String(progressNode.textContent || '').trim();
    const question = String(questionNode.textContent || '').trim();
    return `${progress}|${question.slice(0, 80)}`;
  };

  const getQuestionNumber = () => {
    const match = String(progressNode.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  let selectedFocus = '';
  let retryPending = false;
  let hadRetry = false;
  let recordingCount = 0;
  let lastDownloadDisabled = recordDownloadButton ? recordDownloadButton.disabled : true;
  const answerAttempts = new Map();

  const style = document.createElement('style');
  style.id = 'aiInterviewRepeatPracticeStyles';
  style.textContent = `
    .aii-repeat-practice{margin:.85rem 0 .8rem;padding:.9rem;border:1px solid #dbe8e0;border-radius:14px;background:#f8fbf9}
    .aii-repeat-title{margin:0 0 .3rem;color:#294c39;font-size:.86rem;font-weight:800}
    .aii-repeat-copy{margin:0;color:#69766e;font-size:.78rem;line-height:1.58}
    .aii-repeat-focus{display:flex;flex-wrap:wrap;gap:.42rem;margin:.7rem 0}
    .aii-repeat-focus button{min-height:34px;padding:.38rem .62rem;border:1px solid #ceddd4;border-radius:999px;background:#fff;color:#526159;font:inherit;font-size:.75rem;font-weight:700;cursor:pointer}
    .aii-repeat-focus button:hover{background:#f2f7f4}
    .aii-repeat-focus button.is-selected{border-color:#2d6a4f;background:#edf7f1;color:#24553d}
    .aii-repeat-action{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}
    .aii-repeat-action button{min-height:42px;padding:.55rem .78rem;border:0;border-radius:11px;background:#2d6a4f;color:#fff;font:inherit;font-size:.8rem;font-weight:800;cursor:pointer}
    .aii-repeat-action button:disabled{background:#cfd8d3;color:#fff;cursor:not-allowed}
    .aii-repeat-status{margin:0;color:#748078;font-size:.74rem;line-height:1.5}
    .aii-repeat-guide{margin:.65rem 0 0;padding-top:.62rem;border-top:1px solid #e4ece7;color:#728078;font-size:.73rem;line-height:1.55}
    @media(max-width:600px){.aii-repeat-focus{display:grid;grid-template-columns:1fr 1fr}.aii-repeat-focus button{width:100%}.aii-repeat-action{display:grid}.aii-repeat-action button{width:100%}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'aii-repeat-practice';
  panel.setAttribute('data-aii-repeat-practice', 'true');
  panel.innerHTML = `
    <p class="aii-repeat-title">한 번 말한 뒤, 하나만 고쳐서 같은 질문에 다시 답해보세요.</p>
    <p class="aii-repeat-copy">여러 가지를 동시에 고치기보다 가장 먼저 바꿀 한 가지를 고르는 편이 좋습니다.</p>
    <div class="aii-repeat-focus" role="group" aria-label="이번 재답변에서 고칠 항목">
      <button type="button" data-repeat-focus="first_sentence">첫 문장</button>
      <button type="button" data-repeat-focus="pace">말의 속도</button>
      <button type="button" data-repeat-focus="eye_contact">시선</button>
      <button type="button" data-repeat-focus="filler_words">반복어</button>
      <button type="button" data-repeat-focus="answer_length">답변 길이</button>
    </div>
    <div class="aii-repeat-action">
      <button type="button" data-aii-repeat-same disabled>같은 질문 다시 답하기</button>
      <p class="aii-repeat-status" data-aii-repeat-status>먼저 1차 답변을 마치고, 고칠 항목을 하나 선택하세요.</p>
    </div>
    <p class="aii-repeat-guide">녹화했다면 영상을 다시 보면서 선택하세요. 영상·답변 내용은 이 측정에 저장하지 않습니다.</p>
  `;

  const answerMeta = card.querySelector('.aii-answer-meta');
  if (answerMeta) answerMeta.insertAdjacentElement('afterend', panel);
  else answerNode.insertAdjacentElement('afterend', panel);

  const retryButton = panel.querySelector('[data-aii-repeat-same]');
  const statusNode = panel.querySelector('[data-aii-repeat-status]');
  const focusButtons = Array.from(panel.querySelectorAll('[data-repeat-focus]'));

  const syncRetryButton = () => {
    const hasAnswer = String(answerNode.value || '').trim().length > 0;
    retryButton.disabled = !(hasAnswer && selectedFocus);
    if (retryPending) {
      statusNode.textContent = `이번에는 ${focusButtons.find((button) => button.dataset.repeatFocus === selectedFocus)?.textContent || '선택한 한 가지'}에만 집중해 다시 답해보세요.`;
      return;
    }
    statusNode.textContent = hasAnswer
      ? (selectedFocus ? '같은 질문에 바로 한 번 더 답해보세요.' : '고칠 항목을 하나 선택하세요.')
      : '먼저 1차 답변을 마치고, 고칠 항목을 하나 선택하세요.';
  };

  focusButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedFocus = String(button.dataset.repeatFocus || '');
      focusButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
      send('ai_interview_review_focus_select', {
        focus_item: selectedFocus,
        question_number: getQuestionNumber(),
        had_recording: recordingCount > 0
      });
      syncRetryButton();
    });
  });

  answerNode.addEventListener('input', syncRetryButton);

  retryButton.addEventListener('click', () => {
    const previousLength = String(answerNode.value || '').trim().length;
    if (!previousLength || !selectedFocus) return;

    retryPending = true;
    hadRetry = true;
    send('ai_interview_retry_same_question', {
      focus_item: selectedFocus,
      question_number: getQuestionNumber(),
      previous_answer_length: previousLength,
      had_recording: recordingCount > 0
    });

    answerNode.value = '';
    answerNode.dispatchEvent(new Event('input', { bubbles: true }));
    answerNode.focus();
    if (voiceStatusNode) voiceStatusNode.textContent = '같은 질문 재답변 준비 중 · 선택한 한 가지에만 집중하세요.';
    answerStartButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    syncRetryButton();
  });

  answerStartButton.addEventListener('click', () => {
    const key = getQuestionKey();
    const attempt = (answerAttempts.get(key) || 0) + 1;
    answerAttempts.set(key, attempt);
    send('ai_interview_answer_attempt_start', {
      question_number: getQuestionNumber(),
      attempt_number: attempt,
      is_retry: retryPending || attempt > 1,
      focus_item: retryPending ? selectedFocus : '',
      had_recording: recordingCount > 0
    });
    if (retryPending) retryPending = false;
  }, true);

  answerStopButton?.addEventListener('click', () => {
    const key = getQuestionKey();
    send('ai_interview_answer_attempt_stop', {
      question_number: getQuestionNumber(),
      attempt_number: answerAttempts.get(key) || 1,
      answer_length: String(answerNode.value || '').trim().length,
      had_retry: hadRetry
    });
    window.setTimeout(syncRetryButton, 80);
  }, true);

  recordStartButton?.addEventListener('click', () => {
    send('ai_interview_recording_attempt_start', {
      question_number: getQuestionNumber(),
      recording_number: recordingCount + 1
    });
  }, true);

  if (recordDownloadButton) {
    const syncRecordingCompletion = () => {
      const nowDisabled = recordDownloadButton.disabled;
      if (lastDownloadDisabled && !nowDisabled) {
        recordingCount += 1;
        send('ai_interview_record_complete', {
          question_number: getQuestionNumber(),
          recording_number: recordingCount
        });
        syncRetryButton();
      }
      lastDownloadDisabled = nowDisabled;
    };
    new MutationObserver(syncRecordingCompletion).observe(recordDownloadButton, {
      attributes: true,
      attributeFilter: ['disabled']
    });
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('/booking/') && !href.includes('m.place.naver.com/place/2041312316/ticket')) return;
    send('ai_interview_practice_booking_click', {
      had_retry: hadRetry,
      recording_count: recordingCount,
      destination: href.startsWith('/booking/') ? 'booking_hub' : 'naver_booking'
    });
  }, true);

  const resetForNextQuestion = () => {
    selectedFocus = '';
    retryPending = false;
    focusButtons.forEach((button) => button.classList.remove('is-selected'));
    syncRetryButton();
  };

  let lastQuestionKey = getQuestionKey();
  const questionObserver = new MutationObserver(() => {
    const nextKey = getQuestionKey();
    if (nextKey === lastQuestionKey) return;
    lastQuestionKey = nextKey;
    resetForNextQuestion();
  });
  questionObserver.observe(questionNode, { childList: true, characterData: true, subtree: true });
  questionObserver.observe(progressNode, { childList: true, characterData: true, subtree: true });

  send('ai_interview_repeat_practice_view');
  syncRetryButton();
})();
