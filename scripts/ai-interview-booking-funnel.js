(() => {
  const BOOKING_URL = 'https://m.place.naver.com/place/2041312316/ticket';
  const demo = document.querySelector('.aii-block-demo');
  const result = document.querySelector('[data-aii-result]');
  const hero = document.querySelector('.aii-hero');
  if (!demo || !hero) return;

  const style = document.createElement('style');
  style.textContent = `
    .aii-practice-bridge{max-width:1120px;margin:1rem auto 0;padding:1rem 1.1rem;border:1px solid #dbe8e0;border-radius:16px;background:#f6faf7}
    .aii-practice-bridge strong{display:block;margin-bottom:.28rem;color:#244c38;font-size:1rem}
    .aii-practice-bridge p{margin:0;color:#5f6d65;font-size:.88rem;line-height:1.65}
    .aii-booking-conversion{display:none;margin:1rem 0 0;padding:1.15rem;border:1px solid #cfe1d6;border-radius:16px;background:linear-gradient(135deg,#f1f8f3,#fff)}
    .aii-booking-conversion.is-visible{display:block}
    .aii-booking-conversion .eyebrow{margin:0 0 .3rem;color:#4b755e;font-size:.74rem;font-weight:800;letter-spacing:.05em}
    .aii-booking-conversion h3{margin:0 0 .45rem;color:#1f382b;font-size:1.2rem;letter-spacing:-.025em}
    .aii-booking-conversion p{margin:0 0 .85rem;color:#5d6962;font-size:.88rem;line-height:1.65}
    .aii-booking-conversion .btn-primary{display:inline-flex;justify-content:center;min-height:48px;align-items:center;padding:.65rem 1rem;text-decoration:none}
    .aii-ux-v2 .mobile-sticky-cta{display:flex!important}
    .aii-ux-v2 .aii-hero .hero-btns .aii-space-booking{display:inline-flex!important}
    @media(max-width:820px){
      .aii-ux-v2 .mobile-sticky-cta{display:flex!important}
      .aii-ux-v2 .aii-hero .hero-btns .aii-space-booking{display:inline-flex!important}
      .aii-practice-bridge{margin:.75rem .75rem 0;padding:.85rem .9rem}
      .aii-booking-conversion .btn-primary{display:flex;width:100%}
    }
  `;
  document.head.appendChild(style);

  const subtitle = hero.querySelector('.hero-subtitle');
  if (subtitle) subtitle.textContent = 'AI로 답변을 정리한 뒤, 실제 목소리·표정·시선까지 확인하며 반복해 보세요. 온라인 연습은 준비 단계이고, 실전 리허설은 직접 말해보는 과정에서 완성됩니다.';

  const heroBtns = hero.querySelector('.hero-btns');
  if (heroBtns && !heroBtns.querySelector('.aii-space-booking')) {
    const booking = document.createElement('a');
    booking.href = BOOKING_URL;
    booking.target = '_blank';
    booking.rel = 'noopener noreferrer';
    booking.className = 'btn btn-outline aii-space-booking';
    booking.dataset.cta = 'ai_interview_hero_booking';
    booking.textContent = '실전 연습 공간 예약';
    heroBtns.appendChild(booking);
  }

  if (!demo.querySelector('.aii-practice-bridge')) {
    const bridge = document.createElement('div');
    bridge.className = 'aii-practice-bridge';
    bridge.innerHTML = '<strong>AI 연습은 답변 준비를 위한 도구입니다.</strong><p>실제 면접에서는 답변 내용뿐 아니라 목소리 크기, 말의 속도, 표정과 시선도 함께 확인해야 합니다. 답변을 정리했다면 카메라를 켜고 실제 면접처럼 소리 내어 반복해 보세요.</p>';
    const shell = demo.querySelector('.aii-flow-shell-demo');
    if (shell) shell.insertAdjacentElement('afterend', bridge);
  }

  const card = document.querySelector('[data-aii-card]');
  if (card && !card.querySelector('.aii-booking-conversion')) {
    const conversion = document.createElement('aside');
    conversion.className = 'aii-booking-conversion';
    conversion.setAttribute('aria-label', '실전 면접 연습 공간 안내');
    conversion.innerHTML = `<p class="eyebrow">NEXT STEP · 실전 리허설</p><h3>답변을 준비했다면, 이제 실제 면접처럼 말해보세요.</h3><p>집에서 정리한 답변을 바른자리에서 소리 내어 말하고 휴대폰으로 녹화하며 반복해 보세요. 프라이빗한 공간에서 실제 면접에 가까운 흐름으로 연습할 수 있습니다.</p><a class="btn btn-primary" href="${BOOKING_URL}" target="_blank" rel="noopener noreferrer" data-cta="ai_interview_result_booking">면접 연습 공간 예약 · 1시간 1만원</a>`;
    card.appendChild(conversion);

    const sync = () => {
      const complete = Boolean(result && !result.hidden);
      conversion.classList.toggle('is-visible', complete);
    };
    if (result) {
      new MutationObserver(sync).observe(result, {attributes:true, attributeFilter:['hidden'], childList:true, subtree:true});
      sync();
    }
  }

  const sticky = document.querySelector('#mobileStickyCta');
  if (sticky) {
    sticky.textContent = '실전 면접 연습 예약 · 1시간 1만원';
    sticky.dataset.cta = 'ai_interview_mobile_booking';
  }
})();
