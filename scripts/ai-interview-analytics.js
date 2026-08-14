(() => {
  if (!document.body.classList.contains('aii-ux-v2')) return;

  const send = (name, params = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      page_type: 'ai_interview',
      ...params
    });
  };

  const once = new Set();
  const sendOnce = (key, name, params = {}) => {
    if (once.has(key)) return;
    once.add(key);
    send(name, params);
  };

  sendOnce('view', 'ai_interview_view');

  const form = document.querySelector('[data-aii-form]');
  const mode = form?.querySelector('[data-aii-mode]');
  const questionSource = form?.querySelector('[data-aii-question-source]');
  const questionCount = form?.querySelector('[name="question_count"]');
  const result = document.querySelector('[data-aii-result]');

  form?.addEventListener('submit', () => {
    send('ai_interview_start', {
      practice_mode: mode?.value || 'interview',
      question_source: questionSource?.value || 'default',
      question_count: Number(questionCount?.value || 0)
    });
  });

  document.querySelector('[data-aii-device-start]')?.addEventListener('click', () => {
    sendOnce('device', 'ai_interview_device_start');
  });

  document.querySelector('[data-aii-record-start]')?.addEventListener('click', () => {
    send('ai_interview_record_start');
  });

  document.querySelector('[data-aii-answer-start]')?.addEventListener('click', () => {
    sendOnce('answer', 'ai_interview_answer_start');
  });

  document.querySelector('[data-aii-restart]')?.addEventListener('click', () => {
    send('ai_interview_restart');
  });

  if (result) {
    const syncComplete = () => {
      if (!result.hidden) {
        sendOnce('complete', 'ai_interview_complete', {
          practice_mode: mode?.value || 'interview',
          question_count: Number(questionCount?.value || 0)
        });
      }
    };
    new MutationObserver(syncComplete).observe(result, { attributes: true, attributeFilter: ['hidden'] });
    syncComplete();
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('/interview/')) {
      send('ai_interview_hub_click', { link_location: link.dataset.cta || 'page' });
    }
    if (href.startsWith('/booking/') || href.includes('m.place.naver.com/place/2041312316/ticket')) {
      send('ai_interview_booking_click', {
        link_location: link.dataset.cta || 'page',
        destination: href.startsWith('/booking/') ? 'booking_hub' : 'naver_booking'
      });
    }
  }, true);
})();
