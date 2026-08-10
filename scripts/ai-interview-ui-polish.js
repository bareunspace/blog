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
})();
