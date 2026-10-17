(() => {
  if (!document.body.classList.contains('aii-ux-v2')) return;
  const style = document.createElement('style');
  style.id = 'aiiUiPolish';
  style.textContent = `
    /* Final visual rhythm: quieter chrome, clearer task hierarchy. */
    .aii-ux-v2 .aii-hero .section-inner{padding-left:clamp(1rem,3vw,1.5rem);padding-right:clamp(1rem,3vw,1.5rem)}
    .aii-ux-v2 .aii-hero .hero-btns{align-items:center;flex-wrap:wrap}
    .aii-ux-v2 .aii-hero .hero-btns .btn{min-height:44px;border-radius:11px;padding:.62rem .9rem}
    .aii-ux-v2 .aii-hero .hero-btns .btn-primary{box-shadow:0 6px 16px rgba(40,91,63,.12)}
    .aii-ux-v2 .aii-flow-shell-setup{max-width:980px!important}
    .aii-ux-v2 .aii-ux-stepper{max-width:680px;margin-left:auto;margin-right:auto}
    .aii-ux-v2 .aii-ux-step{min-height:46px}
    .aii-ux-v2 .aii-setup-lead{max-width:720px}
    .aii-ux-v2 .aii-form>label{transition:border-color .15s ease,box-shadow .15s ease,background .15s ease}
    .aii-ux-v2 .aii-form>label:focus-within{border-color:#b9d2c3;background:#fff;box-shadow:0 5px 15px rgba(36,76,56,.05)}
    .aii-ux-v2 .aii-form input,.aii-ux-v2 .aii-form select,.aii-ux-v2 .aii-form textarea{padding-left:.72rem;padding-right:.72rem}
    .aii-ux-v2 .aii-form>.aii-actions{align-items:center}
    .aii-ux-v2 .aii-form>.aii-actions .btn{border-radius:11px}
    .aii-ux-v2 .aii-live-layout{gap:1rem!important}
    .aii-ux-v2 .aii-card{min-height:520px}
    .aii-ux-v2 .aii-stage{letter-spacing:.015em}
    .aii-ux-v2 .aii-progress{margin-top:.1rem!important}
    .aii-ux-v2 .aii-question{max-width:820px;padding-top:.35rem!important;padding-bottom:1.05rem!important}
    .aii-ux-v2 .aii-card>.aii-actions{display:flex;flex-wrap:wrap;align-items:center}
    .aii-ux-v2 .aii-card>.aii-actions .btn{border-radius:10px}
    .aii-ux-v2 [data-aii-answer-start]{font-weight:700}
    .aii-ux-v2 .aii-voice-controls{border:1px solid #e7ece9}
    .aii-ux-v2 .aii-answer{resize:vertical;box-shadow:inset 0 1px 2px rgba(31,56,43,.025)}
    .aii-ux-v2 .aii-answer.is-empty-warning{border-color:#b45353!important;box-shadow:0 0 0 3px rgba(180,83,83,.09)!important}
    .aii-ux-v2 .aii-answer-meta{align-items:center}
    .aii-ux-v2 .aii-answer-meta+.aii-actions{align-items:center}
    .aii-ux-v2 .aii-answer-meta+.aii-actions .btn-primary{box-shadow:0 6px 14px rgba(40,91,63,.1)}
    .aii-ux-v2 .aii-device-card{box-shadow:0 6px 18px rgba(22,48,34,.04)!important}
    .aii-ux-v2 .aii-device-card .aii-actions{display:grid!important;grid-template-columns:1fr 1fr}
    .aii-ux-v2 .aii-device-card .aii-actions .btn{width:100%;justify-content:center}
    .aii-ux-v2 .aii-practice-bridge{max-width:1080px;margin-top:.85rem}
    .aii-ux-v2 .aii-booking-conversion{margin-top:1.2rem;padding:1.25rem 1.3rem}
    .aii-ux-v2 .aii-booking-conversion h3{max-width:620px;line-height:1.4}
    .aii-ux-v2 .aii-booking-conversion p:not(.eyebrow){max-width:720px}
    .aii-ux-v2 .aii-booking-conversion .btn-primary{border-radius:11px}
    .aii-ux-v2 .mobile-sticky-cta{box-shadow:0 -5px 18px rgba(23,54,37,.08)}
    @media(min-width:821px){
      .aii-ux-v2 .aii-flow-shell-demo{max-width:1120px!important}
      .aii-ux-v2 .aii-device-card{top:88px}
      .aii-ux-v2 .aii-card{padding:1.45rem 1.55rem!important}
    }
    @media(max-width:820px){
      .aii-ux-v2{padding-bottom:62px}
      .aii-ux-v2 .aii-hero .section-title{font-size:1.8rem!important;line-height:1.25}
      .aii-ux-v2 .aii-hero .hero-subtitle{font-size:.92rem!important;line-height:1.65}
      .aii-ux-v2 .aii-hero .hero-btns{display:grid!important;grid-template-columns:1fr 1fr;width:100%}
      .aii-ux-v2 .aii-hero .hero-btns .btn{width:100%;justify-content:center;margin:0!important}
      .aii-ux-v2 .aii-hero .hero-btns .btn-primary{grid-column:1/-1}
      .aii-ux-v2 .aii-flow-shell-setup{padding:.9rem!important}
      .aii-ux-v2 .aii-ux-stepper{margin-bottom:1rem}
      .aii-ux-v2 .aii-setup-lead{font-size:.86rem;line-height:1.55;margin-bottom:.9rem}
      .aii-ux-v2 .aii-form{gap:.65rem!important}
      .aii-ux-v2 .aii-form>label{padding:.72rem!important;border-radius:12px}
      .aii-ux-v2 .aii-form input,.aii-ux-v2 .aii-form select{min-height:48px!important}
      .aii-ux-v2 .aii-form>.aii-actions{gap:.45rem;padding-top:.7rem}
      .aii-ux-v2 .aii-form>.aii-actions .btn{min-height:48px}
      .aii-ux-v2 .aii-flow-shell-demo{padding:.65rem!important}
      .aii-ux-v2 .aii-flow-shell-demo>.section-title{margin-left:.25rem!important}
      .aii-ux-v2 .aii-live-toolbar{padding:0 .2rem}
      .aii-ux-v2 .aii-live-toolbar .btn-outline{min-height:40px}
      .aii-ux-v2 .aii-card{border-radius:15px!important;padding:1rem .9rem!important}
      .aii-ux-v2 .aii-stage{margin-bottom:.35rem!important}
      .aii-ux-v2 .aii-progress{margin-bottom:.65rem!important}
      .aii-ux-v2 .aii-question{margin-bottom:.8rem!important;padding-bottom:.85rem!important;font-size:1.25rem!important;line-height:1.48!important}
      .aii-ux-v2 .aii-card>.aii-actions .btn{min-height:46px;flex:1 1 auto}
      .aii-ux-v2 [data-aii-answer-start]{flex-basis:100%!important}
      .aii-ux-v2 .aii-voice-controls{padding:.62rem!important;margin:.6rem 0!important}
      .aii-ux-v2 .aii-answer{min-height:118px!important;font-size:16px!important}
      .aii-ux-v2 .aii-answer-meta{margin-bottom:.6rem!important}
      .aii-ux-v2 .aii-answer-meta+.aii-actions{grid-template-columns:86px 1fr!important;gap:.45rem}
      .aii-ux-v2 .aii-device-card{margin-top:.2rem;padding:.85rem!important;border-radius:15px!important}
      .aii-ux-v2 .aii-device-card .aii-actions{grid-template-columns:1fr 1fr!important}
      .aii-ux-v2 .aii-practice-bridge{margin:.65rem .65rem 0;padding:.8rem .85rem;border-radius:13px}
      .aii-ux-v2 .aii-practice-bridge strong{font-size:.92rem}
      .aii-ux-v2 .aii-practice-bridge p{font-size:.81rem;line-height:1.58}
      .aii-ux-v2 .aii-booking-conversion{padding:1rem;border-radius:14px}
      .aii-ux-v2 .aii-booking-conversion h3{font-size:1.08rem}
      .aii-ux-v2 .mobile-sticky-cta{min-height:54px;align-items:center;justify-content:center;font-weight:800}
    }
    @media(max-width:430px){
      .aii-ux-v2 .aii-hero .hero-btns{grid-template-columns:1fr}
      .aii-ux-v2 .aii-hero .hero-btns .btn-primary{grid-column:auto}
      .aii-ux-v2 .aii-ux-step{min-height:42px}
      .aii-ux-v2 .aii-card>.aii-actions{gap:.38rem!important}
      .aii-ux-v2 .aii-card>.aii-actions .btn{font-size:.82rem;padding-left:.55rem;padding-right:.55rem}
    }
  `;
  document.head.appendChild(style);

  const question = document.querySelector('[data-aii-question]');
  if (question) question.setAttribute('aria-live', 'polite');

  const answer = document.querySelector('[data-aii-answer]');
  if (answer) answer.setAttribute('enterkeyhint', 'done');

  const primaryStart = document.querySelector('[data-aii-form] button[type="submit"]');
  if (primaryStart) primaryStart.setAttribute('aria-describedby', 'aiiStartHint');
  const note = document.querySelector('.aii-ux-start-note');
  if (note) note.id = 'aiiStartHint';

  document.addEventListener('click', (event) => {
    const next = event.target.closest('[data-aii-next]');
    if (!next || next.disabled) return;
    const answerField = document.querySelector('[data-aii-answer]');
    const progress = document.querySelector('[data-aii-progress]');
    const voiceStatus = document.querySelector('[data-aii-voice-status]');
    const value = String(answerField?.value || '').trim();
    const hasActiveQuestion = /질문\s*\d+\s*\/\s*\d+/.test(String(progress?.textContent || ''));
    if (!hasActiveQuestion || value) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    let inlineError = document.querySelector('[data-aii-answer-inline-error]');
    if (!inlineError && answerField) {
      inlineError = document.createElement('p');
      inlineError.dataset.aiiAnswerInlineError = 'true';
      inlineError.id = 'aiiAnswerInlineError';
      inlineError.setAttribute('role', 'alert');
      inlineError.className = 'aii-answer-inline-error';
      answerField.insertAdjacentElement('afterend', inlineError);
    }
    if (inlineError) inlineError.textContent = '답변을 말하거나 입력한 뒤 다음으로 진행해 주세요.';
    if (answerField) {
      answerField.classList.add('is-empty-warning');
      answerField.setAttribute('aria-invalid', 'true');
      answerField.focus({ preventScroll: true });
      answerField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (voiceStatus) {
      voiceStatus.textContent = '답변을 말하거나 입력한 뒤 다음 질문으로 진행해 주세요.';
    }
  }, true);

  if (answer) {
    answer.addEventListener('input', () => {
      if (String(answer.value || '').trim()) {
        answer.classList.remove('is-empty-warning');
        answer.removeAttribute('aria-invalid');
        const inlineError = document.querySelector('[data-aii-answer-inline-error]');
        if (inlineError) inlineError.textContent = '';
      }
    });
  }

  const heroTitle = document.querySelector('.aii-hero .section-title');
  if (heroTitle) heroTitle.textContent = 'AI 모의면접 연습';
  const heroSubtitle = document.querySelector('.aii-hero .hero-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = '질문을 받고 실제로 말하고, 녹화해 다시 확인하는 면접 연습 도구입니다.';

  document.querySelectorAll('a[href="/interview/"]').forEach((link) => {
    if (/면접준비 허브/.test(link.textContent)) link.textContent = '면접 허브 보기';
  });
  document.querySelectorAll('.aii-result-copy').forEach((copy) => {
    copy.textContent = copy.textContent.replace('면접준비 허브', '면접 허브');
  });

  document.querySelectorAll('a[href*="m.place.naver.com/place/2041312316/ticket"]').forEach((link) => {
    link.href = '/booking/?purpose=interview';
    link.removeAttribute('target');
    link.removeAttribute('rel');
    if (link.textContent.trim() === '시간 예약') link.textContent = '면접 연습 공간 예약';
  });

  const practiceMode = document.querySelector('[data-aii-mode]');
  const syncPracticeModeCopy = () => {
    const isPt = String(practiceMode?.value || '') === 'pt_presentation';
    document.body.classList.toggle('aii-is-pt-mode', isPt);
    if (!isPt) return;

    const currentHeroTitle = document.querySelector('.aii-hero .section-title');
    const currentHeroSubtitle = document.querySelector('.aii-hero .hero-subtitle');
    const currentHeroLabel = document.querySelector('.aii-hero .section-label');
    if (currentHeroLabel) currentHeroLabel.textContent = 'AI PT PRESENTATION PRACTICE';
    if (currentHeroTitle) currentHeroTitle.textContent = 'AI PT 발표 리허설';
    if (currentHeroSubtitle) currentHeroSubtitle.textContent = '발표를 처음부터 끝까지 녹화하고, 발표 내용에 맞는 예상 질문과 답변까지 이어서 연습하세요.';

    const stepper = document.querySelector('.aii-ux-stepper');
    if (stepper) {
      stepper.setAttribute('aria-label', 'PT 발표 리허설 진행 단계');
      const labels = stepper.querySelectorAll('span');
      if (labels[0]) labels[0].textContent = '발표 설정';
      if (labels[1]) labels[1].textContent = '발표·질문';
      if (labels[2]) labels[2].textContent = '결과·피드백';
    }
    const lead = document.querySelector('.aii-setup-lead');
    if (lead) lead.textContent = '발표 주제와 목표, 제한 시간, 청중을 입력하고 예상 질문 수를 선택하세요.';
    const demoTitle = document.querySelector('.aii-block-demo .section-title');
    if (demoTitle) demoTitle.textContent = 'PT 발표·질문 연습';
    const deviceCopy = document.querySelector('.aii-device-copy');
    if (deviceCopy) deviceCopy.textContent = '카메라와 마이크를 연결한 뒤 발표 전체와 예상 질문 답변을 한 영상으로 녹화할 수 있습니다.';
    const timedField = document.querySelector('[data-aii-timed-mode]');
    const timedPanel = document.querySelector('[data-aii-timed-panel]');
    if (timedField) timedField.hidden = true;
    if (timedPanel) timedPanel.hidden = true;

    document.querySelectorAll('a[href="/interview/"]').forEach((link) => {
      link.href = '/posts/pt-presentation-rehearsal/';
      if (/허브|가이드/.test(link.textContent)) link.textContent = 'PT 리허설 가이드';
    });
    document.querySelectorAll('a[href*="purpose=interview"]').forEach((link) => {
      link.href = '/booking/';
      if (/면접|실전/.test(link.textContent)) link.textContent = 'PT 연습 공간 예약';
    });

    const recommendCards = document.querySelectorAll('#aiInterviewHubLink .guide-summary-card');
    if (recommendCards[0]) {
      const h = recommendCards[0].querySelector('h3');
      const p = recommendCards[0].querySelector('p');
      const a = recommendCards[0].querySelector('a');
      if (h) h.textContent = '3시간 PT 리허설 순서 확인';
      if (p) p.textContent = '발표·촬영·피드백·예상 질문과 최종 발표까지 이어지는 순서를 확인하세요.';
      if (a) { a.href = '/posts/pt-presentation-rehearsal/'; a.textContent = 'PT 리허설 가이드'; }
    }
    if (recommendCards[1]) {
      const h = recommendCards[1].querySelector('h3');
      const p = recommendCards[1].querySelector('p');
      const a = recommendCards[1].querySelector('a');
      if (h) h.textContent = '프라이빗 공간에서 전체 발표 녹화';
      if (p) p.textContent = '주변 시선 없이 실제 목소리와 동선으로 발표하고 예상 질문까지 반복해 보세요.';
      if (a) { a.href = '/booking/'; a.textContent = 'PT 연습 공간 예약'; }
    }

    document.title = 'AI PT 발표 리허설 | 발표 녹화·예상 질문·피드백 | 바른자리';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', 'PT 발표를 녹화하고 발표 내용에 맞는 예상 질문과 답변까지 연습하는 바른자리 AI PT 리허설 도구입니다.');
  };

  if (practiceMode) {
    practiceMode.addEventListener('change', () => window.setTimeout(syncPracticeModeCopy, 0));
    window.setTimeout(syncPracticeModeCopy, 0);
  }

  if (String(practiceMode?.value || '') !== 'pt_presentation') {
    document.title = 'AI 모의면접 연습 | 질문 받고 답하고 녹화하기 | 바른자리';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', '질문을 받고 실제로 말하고 녹화해 다시 확인하는 바른자리 AI 모의면접 연습 도구입니다. 면접 답변을 반복 연습하고 필요하면 프라이빗 공간 예약으로 이어가세요.');
  }
  // Make feedback actionable without changing existing AI scoring or its source.
  const feedback = document.querySelector('[data-aii-feedback]');
  const result = document.querySelector('[data-aii-result]');
  if (feedback && result) {
    const feedbackTitle = feedback.querySelector('.aii-feedback-title');
    if (feedbackTitle) feedbackTitle.textContent = '이번 연습 피드백';
    const summary = feedback.querySelector('[data-aii-feedback-summary]');
    const strengths = feedback.querySelector('[data-aii-feedback-strengths]');
    const improvements = feedback.querySelector('[data-aii-feedback-improvements]');
    const nextQuestions = feedback.querySelector('[data-aii-feedback-next-questions]');
    const reviews = feedback.querySelector('[data-aii-feedback-question-reviews]');
    const scoreGrid = feedback.querySelector('[data-aii-score-grid]');
    if (scoreGrid && !scoreGrid.nextElementSibling?.matches('.aii-score-note')) {
      const note = document.createElement('p');
      note.className = 'aii-score-note';
      note.textContent = '점수는 답변 텍스트 기반 연습 참고 지표입니다. 실제 면접 합격 가능성이나 발음 점수를 뜻하지 않습니다.';
      scoreGrid.insertAdjacentElement('afterend', note);
    }
    const groupSection = (node, title, className) => {
      if (!node) return;
      const label = node.previousElementSibling;
      if (!label || !label.classList.contains('aii-feedback-label')) return;
      const wrapper = document.createElement('section');
      wrapper.className = 'aii-feedback-panel ' + className;
      wrapper.setAttribute('aria-label', title);
      label.parentNode.insertBefore(wrapper, label);
      label.textContent = title;
      wrapper.appendChild(label);
      wrapper.appendChild(node);
    };
    groupSection(strengths, '잘한 점', 'is-strength');
    groupSection(improvements, '다음에 바꿀 점', 'is-improvement');
    groupSection(nextQuestions, '추천 재연습 질문', 'is-next');
    if (reviews && reviews.previousElementSibling?.classList.contains('aii-feedback-label')) {
      const label = reviews.previousElementSibling;
      const details = document.createElement('details');
      details.className = 'aii-feedback-details';
      const heading = document.createElement('summary');
      heading.textContent = '질문별 상세 분석 보기';
      label.parentNode.insertBefore(details, label);
      details.appendChild(heading);
      label.remove();
      details.appendChild(reviews);
    }
    if (summary) summary.classList.add('aii-feedback-highlight');
    const status = feedback.querySelector('[data-aii-feedback-status]');
    if (status) status.setAttribute('role', 'status');
    const actions = result.querySelector(':scope > .aii-actions');
    const restart = actions?.querySelector('[data-aii-restart]');
    if (restart) {
      restart.textContent = '새 연습 시작';
      restart.setAttribute('aria-label', '새로운 면접 연습 시작');
    }
    const disclosureStyles = document.createElement('style');
    disclosureStyles.textContent = '.aii-score-disclosure{margin:.4rem 0 1rem;padding:.75rem .9rem;border-radius:10px;background:#f2f6f3;color:#4d6154;font-size:.8rem;line-height:1.6}.aii-score-grid .is-unavailable strong{font-size:.93rem!important;color:#68786e}';
    document.head.appendChild(disclosureStyles);
    const feedbackStyles = document.createElement('style');
    feedbackStyles.id = 'aiiFeedbackUx20261017';
    feedbackStyles.textContent = `
      .aii-ux-v2 .aii-result{border-top:2px solid #dcebe1!important}
      .aii-ux-v2 .aii-feedback{gap:1rem!important;padding:1rem!important;background:#fcfdfc!important;border-radius:16px!important}
      .aii-ux-v2 .aii-feedback-title{font-size:1.22rem!important;letter-spacing:-.025em}
      .aii-ux-v2 .aii-feedback-highlight{padding:.9rem 1rem!important;background:#eef7f1;border-left:3px solid #2d6a4f;border-radius:10px;line-height:1.7!important}
      .aii-ux-v2 .aii-score-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem}
      .aii-ux-v2 .aii-score-grid p{display:flex;flex-direction:column;gap:.35rem;align-items:center;justify-content:center;padding:.85rem .4rem!important;border:1px solid #e1ebe4;border-radius:12px;background:#f7faf8!important}
      .aii-ux-v2 .aii-score-grid strong{font-variant-numeric:tabular-nums;font-size:1.38rem!important}
      .aii-ux-v2 .aii-score-note{margin:-.35rem 0 0;color:#6b786f;font-size:.74rem;line-height:1.55}
      .aii-ux-v2 .aii-feedback-panel{padding:.9rem 1rem;border:1px solid #e1e9e4;border-radius:13px;background:#fff}
      .aii-ux-v2 .aii-feedback-panel.is-strength{border-left:3px solid #4e9870}
      .aii-ux-v2 .aii-feedback-panel.is-improvement{border-left:3px solid #c38c50}
      .aii-ux-v2 .aii-feedback-panel.is-next{border-left:3px solid #6489a2}
      .aii-ux-v2 .aii-feedback-panel .aii-feedback-label{margin:0 0 .5rem!important;font-size:.94rem!important}
      .aii-ux-v2 .aii-feedback-panel li{margin:.4rem 0;line-height:1.6}
      .aii-ux-v2 .aii-feedback-details{border:1px solid #e1e9e4;border-radius:12px;padding:.8rem 1rem;background:#fff}
      .aii-ux-v2 .aii-feedback-details summary{cursor:pointer;color:#2d6a4f;font-size:.9rem;font-weight:750}
      .aii-ux-v2 .aii-feedback-details ul{margin:.8rem 0 0}
      .aii-ux-v2 .aii-result>.aii-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:.65rem}
      .aii-ux-v2 .aii-result>.aii-actions>*{min-height:46px;display:flex;align-items:center;justify-content:center}
      @media(max-width:600px){.aii-ux-v2 .aii-score-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.aii-ux-v2 .aii-feedback{padding:.75rem!important}.aii-ux-v2 .aii-feedback-panel{padding:.75rem}.aii-ux-v2 .aii-result>.aii-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(feedbackStyles);
  }

  // Final guided flow: a lightweight next-action cue, no new backend or storage.
  const journeyDemo = document.querySelector('.aii-block-demo');
  const journeyResult = document.querySelector('[data-aii-result]');
  const journeyFeedback = document.querySelector('[data-aii-feedback]');
  const journeyQuestion = document.querySelector('[data-aii-question]');
  const journeyCard = document.querySelector('[data-aii-card]');
  const journeyDevice = document.querySelector('.aii-device-card');
  const journeyProgress = document.querySelector('[data-aii-progress]');
  if (journeyDemo && journeyCard && journeyDevice && journeyProgress) {
    const cue = document.createElement('div');
    cue.className = 'aii-journey-cue';
    cue.setAttribute('role', 'status');
    cue.setAttribute('aria-live', 'polite');
    cue.innerHTML = '<span class="aii-journey-dot" aria-hidden="true"></span><span data-aii-journey-copy>연습 유형을 정하고 시작하세요.</span>';
    const toolbar = journeyDemo.querySelector('.aii-live-toolbar');
    if (toolbar) toolbar.insertAdjacentElement('afterend', cue);
    else journeyCard.insertAdjacentElement('beforebegin', cue);
    const copy = cue.querySelector('[data-aii-journey-copy]');
    const recorder = document.querySelector('[data-aii-record-stop]');
    const download = document.querySelector('[data-aii-record-download]');
    const setCue = () => {
      const complete = Boolean(journeyResult && !journeyResult.hidden);
      const recording = Boolean(recorder && !recorder.disabled);
      const hasRecording = Boolean(download && !download.disabled);
      const active = /질문\s*[1-9]\d*\s*\/\s*\d+/.test(journeyProgress.textContent || '');
      if (complete) {
        cue.dataset.stage = 'complete';
        copy.textContent = journeyFeedback && !journeyFeedback.hidden ? '피드백을 확인하고 다음 연습 목표를 정하세요.' : '답변이 완료되었습니다. 결과를 확인하세요.';
      } else if (recording) {
        cue.dataset.stage = 'recording';
        copy.textContent = '녹화 중입니다. 답변을 마치면 녹화를 종료하세요.';
      } else if (hasRecording) {
        cue.dataset.stage = 'review';
        copy.textContent = '녹화 완료! 영상을 확인하고 같은 질문을 다시 연습해 보세요.';
      } else if (active) {
        cue.dataset.stage = 'practice';
        copy.textContent = '질문을 확인하고 소리 내어 답변하세요. 영상 녹화는 선택 사항입니다.';
      } else {
        cue.dataset.stage = 'setup';
        copy.textContent = '위에서 연습 모드와 질문을 설정한 뒤 시작하세요.';
      }
    };
    new MutationObserver(setCue).observe(journeyProgress, {childList:true,subtree:true,characterData:true});
    if (journeyResult) new MutationObserver(setCue).observe(journeyResult, {attributes:true,attributeFilter:['hidden']});
    if (journeyFeedback) new MutationObserver(setCue).observe(journeyFeedback, {attributes:true,attributeFilter:['hidden']});
    if (recorder) new MutationObserver(setCue).observe(recorder, {attributes:true,attributeFilter:['disabled']});
    if (download) new MutationObserver(setCue).observe(download, {attributes:true,attributeFilter:['disabled']});
    setCue();

    // A direct return to the current question on narrow viewports, avoiding repeated long scrolling.
    const backToQuestion = document.createElement('button');
    backToQuestion.type = 'button';
    backToQuestion.className = 'aii-back-to-question';
    backToQuestion.textContent = '현재 질문으로 이동 ↑';
    backToQuestion.addEventListener('click', () => {
      journeyQuestion?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    });
    journeyDevice.insertAdjacentElement('beforeend', backToQuestion);

    const flowStyle = document.createElement('style');
    flowStyle.id = 'aiiGuidedFlowFinal';
    flowStyle.textContent = `
      .aii-ux-v2 .aii-journey-cue{display:flex;align-items:center;gap:.6rem;margin:.45rem 0 .9rem;padding:.82rem 1rem;background:#edf6f0;border:1px solid #d6e9dd;border-radius:12px;color:#28553b;font-size:.86rem;font-weight:700;line-height:1.5}
      .aii-ux-v2 .aii-journey-dot{width:9px;height:9px;flex:0 0 9px;background:#438760;border-radius:50%}
      .aii-ux-v2 .aii-journey-cue[data-stage="recording"]{background:#fff4f3;border-color:#f0cfcb;color:#933b36}
      .aii-ux-v2 .aii-journey-cue[data-stage="recording"] .aii-journey-dot{background:#c14d45}
      .aii-ux-v2 .aii-answer-inline-error{margin:.4rem 0 .6rem;color:#a33838;font-size:.83rem;font-weight:700}
      .aii-ux-v2 .aii-answer-inline-error:empty{display:none}
      .aii-ux-v2 .aii-back-to-question{display:none;margin-top:.65rem;width:100%;min-height:44px;padding:.55rem;border:1px solid #bbd3c5;border-radius:11px;background:#f4faf6;color:#25573c;font:inherit;font-size:.84rem;font-weight:750;cursor:pointer}
      .aii-ux-v2 [data-aii-question]{scroll-margin-top:85px}
      .aii-ux-v2 .aii-feedback-details:focus-within,.aii-ux-v2 .aii-feedback-panel:focus-within{outline:2px solid #80b79a;outline-offset:2px}
      @media(max-width:820px){.aii-ux-v2 .aii-back-to-question{display:block}.aii-ux-v2 .aii-journey-cue{font-size:.81rem;padding:.68rem .78rem}}
    `;
    document.head.appendChild(flowStyle);
  }
})();
