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
    window.alert('답변이 입력되지 않았습니다.\n답변을 말하거나 입력한 뒤 다음으로 진행해 주세요.');
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
})();
