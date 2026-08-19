(() => {
  const STORAGE_KEY = 'bareunjari_interview_journey_v1';
  const VERSION = 1;

  const TASKS = {
    self_intro: {
      order: 1,
      title: '1분 자기소개 말해보기'
    },
    experience_examples: {
      order: 2,
      title: '경험 답변 정리하기'
    },
    ai_answer_practice: {
      order: 3,
      title: '실제 질문에 답해보기'
    },
    hiring_process_check: {
      order: 4,
      title: '지원 전형 확인하기'
    },
    full_rehearsal: {
      order: 5,
      title: '실전 리허설하기'
    }
  };

  const MANUAL_PROMPTS = {
    '/posts/1-minute-self-introduction-guide/': {
      taskId: 'self_intro',
      eyebrow: '오늘의 준비 기록',
      question: '1분 자기소개를 실제로 소리 내어 한 번 끝까지 말해봤나요?',
      help: '글을 읽은 것보다 실제로 말해본 행동을 기록합니다.'
    },
    '/posts/interview-experience-star-guide/': {
      taskId: 'experience_examples',
      eyebrow: '오늘의 준비 기록',
      question: '면접에서 말할 핵심 경험을 STAR 흐름과 판단 이유까지 정리해봤나요?',
      help: '면접에서 꺼내 말할 수 있는 경험을 실제 답변 형태로 정리했다면 기록하세요.'
    },
    '/cases/': {
      taskId: 'hiring_process_check',
      eyebrow: '전형 확인 기록',
      question: '지원하려는 전형에서 내가 직접 해야 할 행동을 확인했나요?',
      help: '면접·과제·영상·상황 대응 등 실제로 준비해야 할 행동을 확인했을 때 기록하세요.'
    },
    '/posts/interview-answer-practice/': {
      taskId: 'full_rehearsal',
      eyebrow: '실전 연습 기록',
      question: '여러 질문을 끊지 않고 연속으로 실제 답해봤나요?',
      help: '답변을 읽거나 고친 것보다 실제 면접처럼 이어서 말해본 경험을 기록합니다.'
    }
  };

  const nowIso = () => new Date().toISOString();

  const emptyState = () => ({
    version: VERSION,
    tasks: {},
    last_active_at: nowIso()
  });

  const readState = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION || typeof parsed.tasks !== 'object') return emptyState();
      return parsed;
    } catch (_) {
      return emptyState();
    }
  };

  const writeState = (state) => {
    const next = {
      version: VERSION,
      tasks: state.tasks || {},
      last_active_at: nowIso()
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch (_) {
      return next;
    }
  };

  const track = (eventName, params = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      journey_version: 'v1',
      page_path: window.location.pathname,
      ...params
    });
  };

  const emitChange = (state, taskId, action) => {
    window.dispatchEvent(new CustomEvent('bareunjari:interview-journey-change', {
      detail: { state, taskId, action }
    }));
  };

  const completeTask = (taskId, source = 'manual') => {
    if (!TASKS[taskId]) return readState();
    const state = readState();
    const wasComplete = Boolean(state.tasks?.[taskId]?.completed_at);
    state.tasks[taskId] = {
      completed_at: state.tasks?.[taskId]?.completed_at || nowIso(),
      source
    };
    const saved = writeState(state);
    if (!wasComplete) {
      track('interview_journey_task_complete', { task_id: taskId, completion_source: source });
      emitChange(saved, taskId, 'complete');
    }
    return saved;
  };

  const resetTask = (taskId) => {
    const state = readState();
    if (!state.tasks?.[taskId]) return state;
    delete state.tasks[taskId];
    const saved = writeState(state);
    track('interview_journey_task_reset', { task_id: taskId });
    emitChange(saved, taskId, 'reset');
    return saved;
  };

  const isComplete = (taskId) => Boolean(readState().tasks?.[taskId]?.completed_at);

  const completedCount = () => Object.keys(TASKS).filter(isComplete).length;

  window.BareunjariInterviewJourney = {
    version: VERSION,
    storageKey: STORAGE_KEY,
    tasks: TASKS,
    getState: readState,
    complete: completeTask,
    reset: resetTask,
    isComplete,
    getCompletedCount: completedCount
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  const addStyles = () => {
    if (document.getElementById('interviewJourneyStyles')) return;
    const style = document.createElement('style');
    style.id = 'interviewJourneyStyles';
    style.textContent = `
      .interview-journey-record{margin:2rem auto;padding:0 1rem;max-width:980px}
      .interview-journey-record-card{padding:1.15rem 1.2rem;border:1px solid rgba(39,86,61,.16);border-radius:18px;background:#f8fbf9;box-shadow:0 8px 24px rgba(26,54,41,.05)}
      .interview-journey-record-eyebrow{margin:0 0 .38rem;color:#35664d;font-size:.76rem;font-weight:800;letter-spacing:.04em}
      .interview-journey-record-question{margin:0;color:#1f3528;font-size:1.05rem;font-weight:750;line-height:1.55;letter-spacing:-.015em}
      .interview-journey-record-help{margin:.38rem 0 0;color:#6e7c73;font-size:.82rem;line-height:1.6}
      .interview-journey-record-actions{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;margin-top:.9rem}
      .interview-journey-record-btn{min-height:42px;padding:.62rem .85rem;border:1px solid #35664d;border-radius:11px;background:#35664d;color:#fff;font:inherit;font-size:.86rem;font-weight:750;cursor:pointer}
      .interview-journey-record-btn:hover,.interview-journey-record-btn:focus-visible{filter:brightness(.96)}
      .interview-journey-record-reset{border:0;background:transparent;color:#77837c;font:inherit;font-size:.78rem;text-decoration:underline;cursor:pointer}
      .interview-journey-record-status{display:flex;align-items:center;gap:.45rem;margin:0;color:#315f48;font-size:.87rem;font-weight:750}
      .interview-journey-record-note{margin:.75rem 0 0;padding-top:.7rem;border-top:1px solid rgba(39,86,61,.09);color:#7b867f;font-size:.74rem;line-height:1.55}
      .aii-journey-complete-note{margin:.85rem 0;padding:.8rem .9rem;border:1px solid #d8e9df;border-radius:12px;background:#f4faf6;color:#315f48;font-size:.84rem;font-weight:750;line-height:1.55}
      @media(max-width:600px){.interview-journey-record{margin:1.5rem auto;padding:0 .85rem}.interview-journey-record-card{padding:1rem}.interview-journey-record-actions{align-items:flex-start;flex-direction:column}.interview-journey-record-btn{width:100%}}
    `;
    document.head.appendChild(style);
  };

  const renderManualPrompt = () => {
    const config = MANUAL_PROMPTS[window.location.pathname];
    if (!config) return;
    const main = document.querySelector('main');
    if (!main || document.querySelector('[data-interview-journey-record]')) return;

    addStyles();
    const section = document.createElement('section');
    section.className = 'interview-journey-record';
    section.setAttribute('data-interview-journey-record', config.taskId);
    section.setAttribute('aria-label', config.eyebrow);

    const render = () => {
      const state = readState();
      const record = state.tasks?.[config.taskId];
      const done = Boolean(record?.completed_at);
      section.innerHTML = `
        <div class="interview-journey-record-card">
          <p class="interview-journey-record-eyebrow">${config.eyebrow}</p>
          <p class="interview-journey-record-question">${config.question}</p>
          <p class="interview-journey-record-help">${config.help}</p>
          <div class="interview-journey-record-actions">
            ${done
              ? `<p class="interview-journey-record-status">✓ 이 기기에 기록됨${formatDate(record.completed_at) ? ` · ${formatDate(record.completed_at)}` : ''}</p><button type="button" class="interview-journey-record-reset" data-journey-reset>기록 취소</button>`
              : '<button type="button" class="interview-journey-record-btn" data-journey-complete>✓ 했어요, 기록하기</button>'}
          </div>
          <p class="interview-journey-record-note">로그인 없이 현재 기기의 브라우저에만 저장됩니다. 답변 내용이나 지원 기업 정보는 저장하지 않습니다.</p>
        </div>
      `;
      section.querySelector('[data-journey-complete]')?.addEventListener('click', () => {
        completeTask(config.taskId, 'manual_confirm');
        render();
      });
      section.querySelector('[data-journey-reset]')?.addEventListener('click', () => {
        resetTask(config.taskId);
        render();
      });
    };

    main.appendChild(section);
    render();
    track('interview_journey_prompt_view', { task_id: config.taskId });
  };

  const initAiPracticeCompletion = () => {
    if (window.location.pathname !== '/ai-interview/') return;
    const result = document.querySelector('[data-aii-result]');
    const progress = document.querySelector('[data-aii-progress]');
    const mode = document.querySelector('[data-aii-mode]');
    if (!result || !progress) return;

    addStyles();

    const sync = () => {
      if (result.hidden) return;
      if (mode && String(mode.value || '') !== 'interview') return;
      const match = String(progress.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
      const completedQuestions = match ? Number(match[1]) : 0;
      if (completedQuestions < 3) return;

      completeTask('ai_answer_practice', 'ai_interview_3plus');
      if (!result.querySelector('[data-aii-journey-complete]')) {
        const note = document.createElement('p');
        note.className = 'aii-journey-complete-note';
        note.setAttribute('data-aii-journey-complete', 'true');
        note.textContent = '✓ 면접 준비 기록: 실제 질문에 답해보기 완료 · 이 기기에 저장되었습니다.';
        const title = result.querySelector('.aii-result-title');
        if (title) title.insertAdjacentElement('afterend', note);
        else result.prepend(note);
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(result, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
    observer.observe(progress, { childList: true, characterData: true, subtree: true });
    sync();
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderManualPrompt();
    initAiPracticeCompletion();
  });
})();
