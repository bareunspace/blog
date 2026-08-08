(() => {
  const ua = navigator.userAgent || '';
  const isAndroidChrome = /Android/i.test(ua) && /Chrome\//i.test(ua) && !/EdgA|OPR\//i.test(ua);
  if (!isAndroidChrome) return;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const answer = document.querySelector('[data-aii-answer]');
  const startButton = document.querySelector('[data-aii-answer-start]');
  const stopButton = document.querySelector('[data-aii-answer-stop]');
  const nextButton = document.querySelector('[data-aii-next]');
  const prevButton = document.querySelector('[data-aii-prev]');
  const resetButton = document.querySelector('[data-aii-reset]');
  const status = document.querySelector('[data-aii-voice-status]');
  const typeSelect = document.querySelector('[data-aii-type-select]');
  if (!Recognition || !answer || !startButton || !stopButton || !status) return;

  let recognition = null;
  let active = false;
  let stopping = false;
  let baseText = '';
  let finalText = '';
  let lastInterim = '';

  const join = (a, b) => {
    const left = String(a || '').trim();
    const right = String(b || '').trim();
    return left && right ? `${left} ${right}` : (left || right);
  };

  const language = () => {
    const type = String(typeSelect?.value || '');
    return ['영어면접', '데일리영어'].includes(type) ? 'en-US' : 'ko-KR';
  };

  const commit = (interim = '') => {
    answer.value = join(join(baseText, finalText), interim);
    answer.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const setButtons = (listening) => {
    startButton.disabled = listening;
    stopButton.disabled = !listening;
  };

  const createRecognition = () => {
    const instance = new Recognition();
    instance.lang = language();
    instance.continuous = true;
    instance.interimResults = true;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      active = true;
      setButtons(true);
      status.textContent = '음성 인식 중... 답변을 말해 주세요.';
    };

    instance.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = String(event.results[i][0]?.transcript || '').trim();
        if (!text) continue;
        if (event.results[i].isFinal) finalText = join(finalText, text);
        else interim = join(interim, text);
      }
      lastInterim = interim;
      commit(interim);
    };

    instance.onerror = (event) => {
      const code = String(event?.error || 'unknown');
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        stopping = true;
        status.textContent = '마이크 권한이 필요합니다. Chrome 사이트 설정에서 마이크를 허용해 주세요.';
      } else if (code === 'audio-capture') {
        stopping = true;
        status.textContent = '마이크를 사용할 수 없습니다. 다른 앱의 마이크 사용을 종료한 뒤 다시 시도해 주세요.';
      } else if (code === 'network') {
        status.textContent = '음성 인식 연결이 끊겼습니다. 답변 시작을 다시 눌러 주세요.';
      } else if (code !== 'aborted' && code !== 'no-speech') {
        status.textContent = `음성 인식 오류(${code}). 답변 시작을 다시 눌러 주세요.`;
      }
    };

    instance.onend = () => {
      active = false;
      commit(lastInterim);
      setButtons(false);
      if (!stopping) status.textContent = '음성 답변 대기 중';
    };

    return instance;
  };

  const start = () => {
    if (active) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopping = false;
    baseText = String(answer.value || '').trim();
    finalText = '';
    lastInterim = '';
    recognition = createRecognition();
    status.textContent = '마이크를 준비 중입니다...';
    window.setTimeout(() => {
      try { recognition.start(); }
      catch (_error) {
        setButtons(false);
        status.textContent = '마이크를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }
    }, 300);
  };

  const stop = () => {
    stopping = true;
    if (recognition && active) {
      try { recognition.stop(); } catch (_error) {}
    }
    active = false;
    commit(lastInterim);
    setButtons(false);
    status.textContent = '음성 답변 대기 중';
  };

  startButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    start();
  }, true);

  stopButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stop();
  }, true);

  [nextButton, prevButton, resetButton].filter(Boolean).forEach((button) => {
    button.addEventListener('click', () => { if (active) stop(); }, true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && active) stop();
  });
})();
