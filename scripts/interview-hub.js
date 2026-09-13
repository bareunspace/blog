(() => {
  const hub = document.querySelector('.interview-hub');
  if (!hub) return;

  const board = document.getElementById('interviewJourneyBoard');
  const cards = board ? Array.from(board.querySelectorAll('[data-interview-task]')) : [];
  cards.forEach((card) => {
    const action = card.querySelector('[data-task-action]');
    if (action) action.dataset.defaultLabel = action.textContent;
  });

  const track = (eventName, params = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      page_path: window.location.pathname,
      feature_area: 'interview_practice_loop',
      ...params
    });
  };

  const renderPracticeLoopGuide = () => {
    if (document.querySelector('[data-interview-practice-loop]')) return;
    const anchor = document.querySelector('#interview-quick-answer');
    if (!anchor) return;

    const style = document.createElement('style');
    style.id = 'interviewPracticeLoopStyles';
    style.textContent = `
      .interview-practice-loop{padding:1rem 0 1.5rem}
      .interview-practice-loop .section-inner{max-width:980px}
      .interview-practice-loop-shell{padding:1.2rem;border:1px solid #dbe9e1;border-radius:20px;background:linear-gradient(180deg,#f7fbf8 0%,#fff 100%);box-shadow:0 10px 30px rgba(31,69,49,.05)}
      .interview-practice-loop-head{max-width:760px;margin-bottom:1rem}
      .interview-practice-loop-head h2{margin:.2rem 0 .45rem;color:#1f3528;font-size:clamp(1.28rem,2.6vw,1.65rem);letter-spacing:-.025em}
      .interview-practice-loop-head p{margin:0;color:#66736b;font-size:.9rem;line-height:1.7}
      .interview-practice-loop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem}
      .interview-practice-loop-step{padding:1rem;border:1px solid #e1e9e4;border-radius:15px;background:#fff}
      .interview-practice-loop-step span{display:inline-grid;place-items:center;width:28px;height:28px;margin-bottom:.55rem;border-radius:50%;background:#edf7f1;color:#2d6a4f;font-size:.76rem;font-weight:800}
      .interview-practice-loop-step h3{margin:0 0 .35rem;color:#24372d;font-size:.98rem}
      .interview-practice-loop-step p{margin:0;color:#657169;font-size:.82rem;line-height:1.6}
      .interview-practice-loop-focus{margin:.9rem 0 0;padding:.75rem .85rem;border-radius:12px;background:#f5f8f6;color:#59675f;font-size:.8rem;line-height:1.6}
      .interview-practice-loop-actions{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;margin-top:1rem}
      .interview-practice-loop-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.65rem .95rem;border-radius:12px;background:#2d6a4f;color:#fff;text-decoration:none;font-weight:800;font-size:.88rem}
      .interview-practice-loop-note{color:#7a857f;font-size:.76rem}
      @media(max-width:720px){.interview-practice-loop-grid{grid-template-columns:1fr}.interview-practice-loop-shell{padding:1rem}.interview-practice-loop-actions{display:grid}.interview-practice-loop-actions a{width:100%}}
    `;
    document.head.appendChild(style);

    const section = document.createElement('section');
    section.className = 'interview-practice-loop interview-surface-soft';
    section.setAttribute('data-interview-practice-loop', 'true');
    section.setAttribute('aria-label', '면접 답변 반복 연습법');
    section.innerHTML = `
      <div class="section-inner">
        <div class="interview-practice-loop-shell">
          <div class="interview-practice-loop-head">
            <p class="section-label">Speak · Review · Repeat</p>
            <h2>답변은 한 번 정리하는 것보다, 말하고 확인한 뒤 다시 말해보세요.</h2>
            <p>읽어서 이해한 답변과 실제 면접에서 입으로 꺼내는 답변은 다릅니다. 한 번 말한 뒤 여러 가지를 동시에 고치지 말고, <strong>한 가지를 골라 같은 질문에 다시 답하는 방식</strong>으로 연습하세요.</p>
          </div>
          <div class="interview-practice-loop-grid">
            <article class="interview-practice-loop-step"><span>1</span><h3>소리 내어 1차 답변</h3><p>메모를 읽지 말고 질문을 들은 뒤 실제 면접처럼 처음부터 끝까지 답합니다.</p></article>
            <article class="interview-practice-loop-step"><span>2</span><h3>녹화에서 하나만 확인</h3><p>첫 문장 시작, 말의 속도, 시선, 반복 표현, 답변 길이 중 가장 먼저 고칠 한 가지만 고릅니다.</p></article>
            <article class="interview-practice-loop-step"><span>3</span><h3>같은 질문 다시 답변</h3><p>고른 한 가지에만 집중해 같은 질문에 다시 답하고, 1차 답변과 차이를 확인합니다.</p></article>
          </div>
          <p class="interview-practice-loop-focus"><strong>한 번에 하나만:</strong> 첫 문장 · 말의 속도 · 시선 · 반복어 · 답변 길이 중 하나를 고른 뒤 재답변하세요.</p>
          <div class="interview-practice-loop-actions">
            <a href="/ai-interview/?focus=1&source=interview-practice-loop" data-interview-practice-loop-cta>1분 답변으로 바로 연습해보기 →</a>
            <span class="interview-practice-loop-note">녹화 영상은 서버에 업로드되지 않고 현재 기기에만 저장됩니다.</span>
          </div>
        </div>
      </div>`;

    anchor.insertAdjacentElement('afterend', section);
    track('interview_practice_loop_view');
    section.querySelector('[data-interview-practice-loop-cta]')?.addEventListener('click', () => {
      track('interview_practice_loop_cta_click', { destination: 'ai_interview' });
    });
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

  const setNextCopy = (element, title) => {
    if (!element) return;
    if (!title) {
      const strong = document.createElement('strong');
      strong.textContent = '6단계 준비 행동을 모두 기록했어요.';
      element.replaceChildren(strong, ' 필요한 부분은 언제든 다시 연습할 수 있습니다.');
      return;
    }
    const strong = document.createElement('strong');
    strong.textContent = title;
    element.replaceChildren('다음으로 ', strong, '를 해볼 수 있어요. 순서대로 할 필요는 없습니다.');
  };

  const renderJourneyBoard = () => {
    const api = window.BareunjariInterviewJourney;
    if (!api || !board || !cards.length) return;

    const state = api.getState();
    const nextCard = cards.find((card) => !state.tasks?.[card.dataset.interviewTask]?.completed_at);
    let completedCount = 0;

    cards.forEach((card) => {
      const taskId = card.dataset.interviewTask;
      const record = state.tasks?.[taskId];
      const done = Boolean(record?.completed_at);
      const isNext = !done && card === nextCard;
      const status = card.querySelector('[data-task-status]');
      const completed = card.querySelector('[data-task-completed]');
      const action = card.querySelector('[data-task-action]');
      const dot = board.querySelector(`[data-journey-dot="${taskId}"]`);

      if (done) completedCount += 1;
      card.classList.toggle('is-complete', done);
      card.classList.toggle('is-next', isNext);
      if (status) status.textContent = done ? '✓ 완료' : (isNext ? '다음 추천' : '준비 전');
      if (dot) dot.classList.toggle('is-done', done);
      if (completed) {
        completed.hidden = !done;
        completed.textContent = done ? `완료${formatDate(record.completed_at) ? ` · ${formatDate(record.completed_at)}` : ''}` : '';
      }
      if (action) action.textContent = done ? '다시 보기 →' : action.dataset.defaultLabel;
    });

    const progress = board.querySelector('[data-journey-progress]');
    if (progress) progress.textContent = `${completedCount} / ${cards.length} 완료`;
    setNextCopy(board.querySelector('[data-journey-next]'), nextCard?.querySelector('h3')?.textContent);
  };

  const ensureJourneyApi = () => {
    if (!board) return;
    if (window.BareunjariInterviewJourney) {
      renderJourneyBoard();
      return;
    }
    const existing = document.querySelector('script[data-interview-journey-loader]');
    if (existing) {
      existing.addEventListener('load', renderJourneyBoard, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = '/scripts/interview-journey.js?v=20260914-1';
    script.async = true;
    script.dataset.interviewJourneyLoader = 'true';
    script.addEventListener('load', renderJourneyBoard, { once: true });
    document.head.appendChild(script);
  };

  const onlineGrid = document.querySelector('#online-hiring .online-hiring-grid');
  const controls = document.querySelector('#online-hiring .online-hiring-carousel-controls');
  if (onlineGrid) {
    const aptitudeCard = Array.from(onlineGrid.querySelectorAll('.post-related-card')).find((card) =>
      card.querySelector('a[href="/posts/online-aptitude-test-space/"]')
    );
    if (aptitudeCard && onlineGrid.firstElementChild !== aptitudeCard) {
      onlineGrid.insertBefore(aptitudeCard, onlineGrid.firstElementChild);
    }
  }
  if (onlineGrid && controls) {
    controls.classList.add('is-enhanced');
    const getScrollAmount = () => {
      const card = onlineGrid.querySelector('.post-related-card');
      if (!card) return Math.max(260, onlineGrid.clientWidth * 0.8);
      const styles = window.getComputedStyle(onlineGrid);
      const gap = parseFloat(styles.columnGap || styles.gap || 0) || 0;
      return card.getBoundingClientRect().width + gap;
    };
    controls.querySelector('.online-hiring-prev')?.addEventListener('click', () => {
      onlineGrid.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
    controls.querySelector('.online-hiring-next')?.addEventListener('click', () => {
      onlineGrid.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
  }

  renderPracticeLoopGuide();
  ensureJourneyApi();
  window.addEventListener('bareunjari:interview-journey-change', renderJourneyBoard);
  window.addEventListener('storage', (event) => {
    if (event.key === 'bareunjari_interview_journey_v1') renderJourneyBoard();
  });
})();
