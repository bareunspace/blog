(() => {
  const hub = document.querySelector('.interview-hub');
  if (!hub) return;

  const board = document.getElementById('interviewJourneyBoard');
  const cards = board ? Array.from(board.querySelectorAll('[data-interview-task]')) : [];
  cards.forEach((card) => {
    const action = card.querySelector('[data-task-action]');
    if (action) action.dataset.defaultLabel = action.textContent;
  });

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
    script.src = '/scripts/interview-journey.js?v=20260820-3';
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

  ensureJourneyApi();
  window.addEventListener('bareunjari:interview-journey-change', renderJourneyBoard);
  window.addEventListener('storage', (event) => {
    if (event.key === 'bareunjari_interview_journey_v1') renderJourneyBoard();
  });
})();
