(() => {
  const FREE_QUESTIONS = 3;
  const ACCESS_HOURS = 6;
  const STORAGE_KEY = 'bareunjari_ai_interview_access_until';
  const ENDPOINT = 'https://nhiyxgcrjdzdiquutxml.supabase.co/functions/v1/ai-interview-access';
  const API_KEY = 'sb_publishable_kqB-Q3vuJwrd8cvEzbcp7g_a6QBxf_u';
  const BOOKING_URL = 'https://m.place.naver.com/place/2041312316/ticket';

  const card = document.querySelector('[data-aii-card]');
  const progress = document.querySelector('[data-aii-progress]');
  const next = document.querySelector('[data-aii-next]');
  if (!card || !progress || !next) return;

  const hasAccess = () => Number(localStorage.getItem(STORAGE_KEY) || 0) > Date.now();
  const setAccess = () => localStorage.setItem(STORAGE_KEY, String(Date.now() + ACCESS_HOURS * 60 * 60 * 1000));
  const currentQuestionNumber = () => {
    const match = String(progress.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
    return match ? Number(match[1]) : 1;
  };

  const style = document.createElement('style');
  style.textContent = `
    .aii-access-modal[hidden]{display:none!important}.aii-access-modal{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:1rem;background:rgba(16,27,21,.62);backdrop-filter:blur(5px)}
    .aii-access-dialog{width:min(440px,100%);padding:1.25rem;border-radius:20px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.22)}
    .aii-access-kicker{margin:0 0 .35rem;color:#4b755e;font-size:.74rem;font-weight:800;letter-spacing:.05em}.aii-access-dialog h3{margin:0 0 .5rem;font-size:1.25rem;color:#20372b}.aii-access-copy{margin:0 0 1rem;color:#637068;font-size:.88rem;line-height:1.65}
    .aii-access-code{display:block;width:100%;box-sizing:border-box;min-height:54px;padding:.65rem .8rem;border:1px solid #cbd8d0;border-radius:12px;font-size:1.25rem;font-weight:800;letter-spacing:.22em;text-align:center}.aii-access-code:focus{outline:3px solid rgba(62,139,99,.14);border-color:#4f9570}
    .aii-access-status{min-height:1.3em;margin:.5rem 0;color:#a14242;font-size:.8rem}.aii-access-actions{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.aii-access-actions button,.aii-access-actions a{min-height:46px;display:flex;align-items:center;justify-content:center;text-decoration:none}.aii-access-close{margin-top:.55rem;width:100%;border:0;background:transparent;color:#718078;font-size:.8rem;cursor:pointer}
    .aii-access-badge{display:inline-flex;margin:0 0 .6rem;padding:.32rem .55rem;border-radius:999px;background:#f1f7f3;color:#456c57;font-size:.72rem;font-weight:800}
    @media(max-width:520px){.aii-access-actions{grid-template-columns:1fr}.aii-access-dialog{padding:1rem}.aii-access-code{font-size:1.15rem}}
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'aii-access-modal';
  modal.hidden = true;
  modal.innerHTML = `<div class="aii-access-dialog" role="dialog" aria-modal="true" aria-labelledby="aiiAccessTitle"><span class="aii-access-badge">무료 연습 3문항 완료</span><p class="aii-access-kicker">BARUNJARI ONSITE ACCESS</p><h3 id="aiiAccessTitle">4번째 질문부터는 바른자리에서 계속할 수 있어요.</h3><p class="aii-access-copy">바른자리 이용 중이라면 공간에 안내된 6자리 코드를 입력하세요. 인증 후 이 브라우저에서 6시간 동안 전체 면접 연습을 이용할 수 있습니다.</p><form data-aii-access-form><input class="aii-access-code" data-aii-access-code inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" aria-label="바른자리 현장 이용코드" placeholder="000000" required><p class="aii-access-status" data-aii-access-status aria-live="polite"></p><div class="aii-access-actions"><button class="btn btn-primary" type="submit">현장 코드 인증</button><a class="btn btn-outline" href="${BOOKING_URL}" target="_blank" rel="noopener noreferrer">면접 연습 공간 예약</a></div><button class="aii-access-close" type="button" data-aii-access-close>지금은 3문항까지만 연습하기</button></form></div>`;
  document.body.appendChild(modal);

  const form = modal.querySelector('[data-aii-access-form]');
  const input = modal.querySelector('[data-aii-access-code]');
  const status = modal.querySelector('[data-aii-access-status]');
  const close = modal.querySelector('[data-aii-access-close]');
  let continueAfterUnlock = false;

  const openGate = () => {
    continueAfterUnlock = true;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => input.focus(), 50);
  };
  const closeGate = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    status.textContent = '';
  };

  next.addEventListener('click', (event) => {
    if (!hasAccess() && currentQuestionNumber() >= FREE_QUESTIONS) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openGate();
    }
  }, true);

  close.addEventListener('click', closeGate);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeGate(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeGate(); });

  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = input.value.trim();
    if (!/^\d{6}$/.test(code)) { status.textContent = '6자리 숫자 코드를 입력해 주세요.'; return; }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = '확인 중…';
    status.textContent = '';
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ code })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error('invalid');
      setAccess();
      status.style.color = '#37664d';
      status.textContent = '인증되었습니다. 6시간 동안 전체 연습을 이용할 수 있습니다.';
      window.setTimeout(() => {
        closeGate();
        if (continueAfterUnlock) next.click();
        continueAfterUnlock = false;
      }, 550);
    } catch {
      status.style.color = '#a14242';
      status.textContent = '코드가 맞지 않습니다. 공간에 안내된 코드를 확인해 주세요.';
    } finally {
      submit.disabled = false;
      submit.textContent = '현장 코드 인증';
    }
  });
})();
