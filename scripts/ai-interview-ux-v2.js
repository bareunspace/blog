(() => {
  const form = document.querySelector('[data-aii-form]');
  const setupSection = document.querySelector('#aiDemoSetup');
  const demoSection = document.querySelector('.aii-block-demo');
  const deviceCard = document.querySelector('.aii-device-card');
  const interviewCard = document.querySelector('[data-aii-card]');
  if (!form || !setupSection || !demoSection || !deviceCard || !interviewCard) return;

  document.body.classList.add('aii-ux-v2');

  const style = document.createElement('style');
  style.id = 'aiiUxV2Styles';
  style.textContent = `
    .aii-ux-v2 .aii-hero{padding:1.55rem 0 1rem!important;background:linear-gradient(180deg,#f7fbf8 0%,#fff 100%)}
    .aii-ux-v2 .aii-hero .section-inner{max-width:1120px!important}
    .aii-ux-v2 .aii-hero .section-label{display:inline-flex;align-items:center;gap:.4rem;margin:0 0 .5rem!important;padding:.35rem .62rem;border:1px solid #dbe8e0;border-radius:999px;background:#fff;color:#335b47;font-size:.75rem!important;font-weight:700}
    .aii-ux-v2 .aii-hero .section-title{max-width:760px;margin-bottom:.5rem!important;font-size:clamp(1.75rem,4vw,2.55rem)!important;letter-spacing:-.035em}
    .aii-ux-v2 .aii-hero .hero-subtitle{max-width:680px!important;color:#55645b;font-size:.98rem!important}
    .aii-ux-v2 .aii-hero .hero-btns{margin-top:.8rem;gap:.55rem!important}
    .aii-ux-v2 .aii-hero .hero-btns .btn-primary{min-width:152px}
    .aii-ux-v2 #aiDemoSetup{padding-top:1rem!important}
    .aii-ux-v2 .aii-flow-shell{max-width:1120px!important;border:1px solid #e3ebe6;border-radius:20px;background:#fff;box-shadow:0 14px 38px rgba(28,57,41,.06)}
    .aii-ux-v2 .aii-flow-shell-setup{padding:clamp(1rem,2.5vw,1.65rem)!important}
    .aii-ux-v2 .aii-step-label{display:none!important}
    .aii-ux-v2 .aii-ux-stepper{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem;margin-bottom:1.25rem}
    .aii-ux-v2 .aii-ux-step{display:flex;align-items:center;gap:.48rem;padding:.62rem .72rem;border-radius:12px;background:#f4f7f5;color:#6a756e;font-size:.82rem;font-weight:700}
    .aii-ux-v2 .aii-ux-step strong{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#fff;border:1px solid #d9e3dd;color:#3d6852;font-size:.75rem}
    .aii-ux-v2 .aii-ux-step.is-active{background:#edf7f0;color:#244c38}
    .aii-ux-v2 .aii-setup-lead{margin:-.25rem 0 1.15rem;color:#66736b;font-size:.92rem;line-height:1.65}
    .aii-ux-v2 .aii-form{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.8rem 1rem!important}
    .aii-ux-v2 .aii-form>label{display:grid;align-content:start;gap:.42rem;margin:0!important;padding:.82rem .9rem;border:1px solid #e2e9e5;border-radius:14px;background:#fbfcfb}
    .aii-ux-v2 .aii-form>label>span:first-child{font-size:.8rem;font-weight:700;color:#46554c}
    .aii-ux-v2 .aii-form input,.aii-ux-v2 .aii-form select,.aii-ux-v2 .aii-form textarea{min-height:46px!important;border:1px solid #cfd9d3!important;border-radius:10px!important;background:#fff!important;font-size:.95rem!important}
    .aii-ux-v2 .aii-form input:focus,.aii-ux-v2 .aii-form select:focus,.aii-ux-v2 .aii-form textarea:focus{outline:3px solid rgba(62,139,99,.14)!important;border-color:#4f9570!important}
    .aii-ux-v2 .aii-form .aii-custom-questions{grid-column:1/-1!important;padding:1rem!important;background:#f8fbf9!important}
    .aii-ux-v2 .aii-form>.aii-actions{grid-column:1/-1;display:grid!important;grid-template-columns:minmax(180px,1fr) auto;gap:.55rem;margin-top:.2rem;padding-top:.9rem;border-top:1px solid #edf1ee}
    .aii-ux-v2 .aii-form>.aii-actions .btn-primary{min-height:50px;font-size:1rem;font-weight:700}
    .aii-ux-v2 .aii-form>.aii-actions .btn-outline{min-height:50px}
    .aii-ux-v2 .aii-block-demo{padding-top:1.15rem!important}
    .aii-ux-v2 .aii-flow-shell-demo{padding:clamp(.8rem,2vw,1.2rem)!important;background:#f7f9f8}
    .aii-ux-v2 .aii-flow-shell-demo>.section-title{font-size:1rem!important;margin:.2rem 0 .75rem!important;color:#536159}
    .aii-ux-v2 .aii-live-toolbar{display:flex!important;justify-content:flex-end;gap:.4rem;margin:-2.5rem 0 .75rem}
    .aii-ux-v2 .aii-live-toolbar .btn-outline{min-height:36px;padding:.4rem .7rem;font-size:.8rem}
    .aii-ux-v2 .aii-live-layout{display:grid!important;grid-template-columns:minmax(280px,.8fr) minmax(0,1.2fr)!important;gap:.9rem!important;align-items:start}
    .aii-ux-v2 .aii-device-card,.aii-ux-v2 .aii-card{border:1px solid #dfe8e2!important;border-radius:18px!important;background:#fff!important;box-shadow:0 8px 24px rgba(22,48,34,.05)!important}
    .aii-ux-v2 .aii-device-card{position:sticky;top:78px;padding:1rem!important}
    .aii-ux-v2 .aii-device-card h3{margin:0 0 .25rem;font-size:1rem}
    .aii-ux-v2 .aii-device-copy{margin:0 0 .75rem!important;color:#6a756e;font-size:.83rem!important}
    .aii-ux-v2 .aii-device-card .aii-actions{gap:.4rem!important;margin:.45rem 0!important}
    .aii-ux-v2 .aii-device-card .btn-outline{min-height:38px;padding:.42rem .62rem;font-size:.79rem}
    .aii-ux-v2 .aii-video{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:14px;background:#111}
    .aii-ux-v2 .aii-record-note,.aii-ux-v2 .aii-record-pref{font-size:.75rem!important;color:#77827b}
    .aii-ux-v2 .aii-card{padding:clamp(1rem,2.5vw,1.5rem)!important;min-height:560px}
    .aii-ux-v2 .aii-stage{display:inline-flex!important;margin:0 0 .45rem!important;padding:.32rem .55rem;border-radius:999px;background:#eef7f1;color:#346047;font-size:.75rem!important;font-weight:700}
    .aii-ux-v2 .aii-progress{margin:0 0 .8rem!important;color:#7a857e;font-size:.8rem!important;font-weight:600}
    .aii-ux-v2 .aii-question{margin:.1rem 0 1rem!important;padding:.25rem 0 .95rem;border-bottom:1px solid #edf1ee;font-size:clamp(1.28rem,2.4vw,1.8rem)!important;line-height:1.48!important;letter-spacing:-.025em;color:#1f2e26}
    .aii-ux-v2 .aii-question-fit{margin:.25rem 0 .8rem!important;padding:.65rem .75rem!important;border-radius:12px!important;background:#fafcfb!important}
    .aii-ux-v2 .aii-question-fit-label{font-size:.78rem!important}
    .aii-ux-v2 .aii-question-fit-status{font-size:.72rem!important}
    .aii-ux-v2 .aii-card>.aii-actions{gap:.45rem!important}
    .aii-ux-v2 .aii-card>.aii-actions .btn-outline,.aii-ux-v2 .aii-card>.aii-actions .btn-primary{min-height:44px}
    .aii-ux-v2 .aii-voice-controls{margin:.75rem 0!important;padding:.7rem!important;border-radius:12px;background:#f7f9f8;display:grid!important;grid-template-columns:1fr 1fr;gap:.7rem!important}
    .aii-ux-v2 .aii-voice-control span{font-size:.75rem!important;color:#68746d}
    .aii-ux-v2 .aii-voice-status{margin:.55rem 0!important;font-size:.8rem!important;color:#657169}
    .aii-ux-v2 .aii-answer{min-height:150px!important;padding:.9rem 1rem!important;border:1px solid #ccd8d1!important;border-radius:14px!important;background:#fff!important;font-size:.96rem!important;line-height:1.65!important}
    .aii-ux-v2 .aii-answer:focus{outline:3px solid rgba(62,139,99,.14)!important;border-color:#4f9570!important}
    .aii-ux-v2 .aii-answer-meta{margin:.45rem 0 .75rem!important}
    .aii-ux-v2 .aii-answer-tip{font-size:.78rem!important;color:#728078}
    .aii-ux-v2 .aii-answer-count{font-size:.75rem!important;font-weight:700}
    .aii-ux-v2 .aii-answer-meta+.aii-actions{display:grid!important;grid-template-columns:auto minmax(160px,1fr)!important;padding-top:.7rem;border-top:1px solid #edf1ee}
    .aii-ux-v2 .aii-answer-meta+.aii-actions .btn-primary{font-size:.98rem;font-weight:700}
    .aii-ux-v2 .aii-result{margin-top:1rem!important;padding-top:1rem!important;border-top:1px solid #e5ebe7}
    .aii-ux-v2 .aii-score-grid{gap:.55rem!important}
    .aii-ux-v2 .aii-score-grid p{border-radius:12px!important;background:#f6f9f7!important}
    .aii-ux-v2 .aii-ux-start-note{grid-column:1/-1;margin:-.15rem 0 0;color:#7a857e;font-size:.76rem;text-align:left}
    .aii-ux-v2 .mobile-sticky-cta{display:none!important}
    .aii-ux-v2.is-session-active #aiDemoSetup{opacity:.72}
    .aii-ux-v2.is-session-active .aii-ux-step:nth-child(1){background:#f4f7f5;color:#6a756e}
    .aii-ux-v2.is-session-active .aii-ux-step:nth-child(2){background:#edf7f0;color:#244c38}
    .aii-ux-v2.is-session-complete .aii-ux-step:nth-child(2){background:#f4f7f5;color:#6a756e}
    .aii-ux-v2.is-session-complete .aii-ux-step:nth-child(3){background:#edf7f0;color:#244c38}
    @media(max-width:820px){
      .aii-ux-v2 .aii-hero{padding-top:1.1rem!important}
      .aii-ux-v2 .aii-hero .hero-btns .btn-outline:last-child{display:none}
      .aii-ux-v2 .aii-flow-shell{border-radius:16px}
      .aii-ux-v2 .aii-form{grid-template-columns:1fr!important}
      .aii-ux-v2 .aii-form .aii-custom-questions,.aii-ux-v2 .aii-form>.aii-actions,.aii-ux-v2 .aii-ux-start-note{grid-column:1!important}
      .aii-ux-v2 .aii-form>.aii-actions{grid-template-columns:1fr!important}
      .aii-ux-v2 .aii-form>.aii-actions .btn-primary{order:-1}
      .aii-ux-v2 .aii-live-toolbar{margin:0 0 .65rem;justify-content:flex-start}
      .aii-ux-v2 .aii-live-layout{grid-template-columns:1fr!important}
      .aii-ux-v2 .aii-device-card{position:relative;top:auto;order:2}
      .aii-ux-v2 .aii-card{order:1;min-height:0;padding:1rem!important}
      .aii-ux-v2 .aii-question{font-size:1.28rem!important}
      .aii-ux-v2 .aii-voice-controls{grid-template-columns:1fr!important}
      .aii-ux-v2 .aii-answer{min-height:125px!important}
      .aii-ux-v2 .aii-answer-meta+.aii-actions{position:sticky;bottom:0;z-index:8;margin:0 -.35rem -.35rem;padding:.7rem .35rem .35rem;background:linear-gradient(180deg,rgba(255,255,255,.7),#fff 24%);grid-template-columns:92px 1fr!important}
      .aii-ux-v2 .aii-answer-meta+.aii-actions .btn-primary{min-height:50px}
    }
    @media(max-width:520px){
      .aii-ux-v2 .aii-ux-stepper{gap:.3rem}
      .aii-ux-v2 .aii-ux-step{justify-content:center;padding:.52rem .28rem;font-size:.72rem}
      .aii-ux-v2 .aii-ux-step strong{width:21px;height:21px}
      .aii-ux-v2 .aii-ux-step span{display:none}
      .aii-ux-v2 .aii-form>label{padding:.72rem .75rem}
      .aii-ux-v2 .aii-card>.aii-actions:not(.aii-answer-meta + .aii-actions){display:grid!important;grid-template-columns:1fr 1fr}
      .aii-ux-v2 .aii-card>.aii-actions [data-aii-answer-start]{grid-column:1/-1;min-height:48px}
    }
  `;
  document.head.appendChild(style);

  const hero = document.querySelector('.aii-hero');
  const heroLabel = hero?.querySelector('.section-label');
  const heroTitle = hero?.querySelector('.section-title');
  const heroSubtitle = hero?.querySelector('.hero-subtitle');
  const heroPrimary = hero?.querySelector('.btn-primary');
  if (heroLabel) heroLabel.textContent = 'AI INTERVIEW PRACTICE';
  if (heroTitle) heroTitle.textContent = '질문을 듣고, 소리 내어 답하고, 바로 개선하세요.';
  if (heroSubtitle) heroSubtitle.textContent = 'AI 추천 질문이나 내가 준비한 질문으로 실제 면접처럼 말해보고, 답변을 기록해 피드백까지 이어가는 연습 공간입니다.';
  if (heroPrimary) heroPrimary.textContent = '바로 연습 시작';

  const setupShell = setupSection.querySelector('.aii-flow-shell-setup');
  const setupTitle = setupShell?.querySelector('.section-title');
  if (setupTitle) setupTitle.textContent = '연습 설정';

  if (setupShell && !setupShell.querySelector('.aii-ux-stepper')) {
    const stepper = document.createElement('div');
    stepper.className = 'aii-ux-stepper';
    stepper.setAttribute('aria-label', '면접 연습 진행 단계');
    stepper.innerHTML = `
      <div class="aii-ux-step is-active"><strong>1</strong><span>연습 설정</span></div>
      <div class="aii-ux-step"><strong>2</strong><span>질문에 답하기</span></div>
      <div class="aii-ux-step"><strong>3</strong><span>결과·피드백</span></div>
    `;
    setupShell.insertBefore(stepper, setupTitle || setupShell.firstChild);
  }

  if (setupTitle && !setupShell.querySelector('.aii-setup-lead')) {
    const lead = document.createElement('p');
    lead.className = 'aii-setup-lead';
    lead.textContent = '회사와 직무를 간단히 입력하고 질문 방식을 고르세요. 직접 준비한 질문도 그대로 사용할 수 있습니다.';
    setupTitle.insertAdjacentElement('afterend', lead);
  }

  const actionRow = form.querySelector(':scope > .aii-actions');
  const submitButton = actionRow?.querySelector('button[type="submit"]');
  const resetButton = actionRow?.querySelector('[data-aii-reset]');
  if (submitButton) submitButton.textContent = '연습 시작하기';
  if (resetButton) resetButton.textContent = '입력 초기화';
  if (actionRow && !form.querySelector('.aii-ux-start-note')) {
    const note = document.createElement('p');
    note.className = 'aii-ux-start-note';
    note.textContent = '카메라와 마이크는 연습 화면에서 선택적으로 켤 수 있습니다. 녹화 영상은 서버에 업로드되지 않습니다.';
    actionRow.insertAdjacentElement('afterend', note);
  }

  const demoTitle = demoSection.querySelector('.section-title');
  if (demoTitle) demoTitle.textContent = '면접 연습';
  const focusButton = demoSection.querySelector('[data-aii-focus-toggle]');
  const windowButton = demoSection.querySelector('[data-aii-open-window]');
  if (focusButton) focusButton.textContent = '화면 집중';
  if (windowButton) windowButton.textContent = '별도 창';

  const deviceTitle = deviceCard.querySelector('h3');
  const deviceCopy = deviceCard.querySelector('.aii-device-copy');
  if (deviceTitle) deviceTitle.textContent = '카메라 · 마이크';
  if (deviceCopy) deviceCopy.textContent = '실전처럼 연습하고 싶을 때만 켜세요. 답변 연습만 할 경우 장비 없이도 시작할 수 있습니다.';
  const deviceStart = deviceCard.querySelector('[data-aii-device-start]');
  const deviceStop = deviceCard.querySelector('[data-aii-device-stop]');
  const recordStart = deviceCard.querySelector('[data-aii-record-start]');
  const recordStop = deviceCard.querySelector('[data-aii-record-stop]');
  const recordDownload = deviceCard.querySelector('[data-aii-record-download]');
  if (deviceStart) deviceStart.textContent = '카메라·마이크 연결';
  if (deviceStop) deviceStop.textContent = '장비 끄기';
  if (recordStart) recordStart.textContent = '연습 녹화';
  if (recordStop) recordStop.textContent = '녹화 종료';
  if (recordDownload) recordDownload.textContent = '영상 저장';

  const questionFit = interviewCard.querySelector('[data-aii-question-fit]');
  const sourceSelect = form.querySelector('[data-aii-question-source]');
  const customTextarea = form.querySelector('[data-aii-custom-questions]');
  const answerStart = interviewCard.querySelector('[data-aii-answer-start]');
  const answerStop = interviewCard.querySelector('[data-aii-answer-stop]');
  const speakButton = interviewCard.querySelector('[data-aii-speak-question]');
  const answerNode = interviewCard.querySelector('[data-aii-answer]');
  const nextButton = interviewCard.querySelector('[data-aii-next]');
  const prevButton = interviewCard.querySelector('[data-aii-prev]');
  const resultNode = interviewCard.querySelector('[data-aii-result]');

  if (answerStart) answerStart.textContent = '마이크로 답변하기';
  if (answerStop) answerStop.textContent = '답변 멈추기';
  if (speakButton) speakButton.textContent = '질문 다시 듣기';
  if (answerNode) answerNode.placeholder = '말한 답변이 여기에 기록됩니다. 직접 입력하거나 수정해도 됩니다.';
  if (prevButton) prevButton.textContent = '이전';

  const syncQuestionSourceUx = () => {
    const isCustom = String(sourceSelect?.value || '') === 'custom';
    if (questionFit) questionFit.hidden = isCustom;
    if (submitButton) submitButton.textContent = isCustom ? '내 질문으로 연습 시작' : 'AI 질문으로 연습 시작';
  };

  const syncResultState = () => {
    const complete = Boolean(resultNode && !resultNode.hidden);
    document.body.classList.toggle('is-session-complete', complete);
  };

  if (sourceSelect) sourceSelect.addEventListener('change', syncQuestionSourceUx);
  if (customTextarea) customTextarea.addEventListener('input', syncQuestionSourceUx);
  syncQuestionSourceUx();

  form.addEventListener('submit', () => {
    document.body.classList.add('is-session-active');
    document.body.classList.remove('is-session-complete');
    window.setTimeout(() => {
      demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  });

  const resultObserver = new MutationObserver(syncResultState);
  if (resultNode) resultObserver.observe(resultNode, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });

  const resetUx = () => {
    document.body.classList.remove('is-session-active', 'is-session-complete');
    syncQuestionSourceUx();
    setupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (resetButton) resetButton.addEventListener('click', () => window.setTimeout(resetUx, 0));
  const restartButton = interviewCard.querySelector('[data-aii-restart]');
  if (restartButton) restartButton.addEventListener('click', () => window.setTimeout(resetUx, 0));

  if (nextButton) {
    const nextObserver = new MutationObserver(syncResultState);
    nextObserver.observe(nextButton, { childList: true, characterData: true, subtree: true });
  }
})();
