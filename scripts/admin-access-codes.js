(() => {
  const reservationsRoot = document.getElementById('adminReservations');
  if (!reservationsRoot) return;

  const weekdays = [
    ['Mon', '월'], ['Tue', '화'], ['Wed', '수'], ['Thu', '목'],
    ['Fri', '금'], ['Sat', '토'], ['Sun', '일']
  ];

  const toMonthValue = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}`;
  };

  const toMonthDate = (monthValue) => `${monthValue}-01`;

  const panel = document.createElement('section');
  panel.className = 'admin-card';
  panel.dataset.accessCodePanel = 'true';
  panel.innerHTML = `
    <div class="admin-section-head">
      <div>
        <p class="admin-label">Access Codes</p>
        <h3 class="admin-title">예약 출입 코드 설정</h3>
        <p class="admin-desc">월별 요일 코드를 Vault에 저장합니다. 저장 후 원문 코드는 다시 표시하지 않습니다.</p>
      </div>
    </div>
    <form data-access-code-form>
      <div class="admin-community-tools">
        <label class="admin-filter">적용 월<input type="month" data-access-code-month required></label>
        <button class="admin-btn admin-btn-outline" type="button" data-access-code-status>설정 상태 확인</button>
      </div>
      <div class="admin-community-meta" data-access-code-inputs style="margin-top:1rem;">
        ${weekdays.map(([key, label]) => `<div><dt>${label}요일</dt><dd><input type="password" name="${key}" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="6자리" autocomplete="new-password" required></dd></div>`).join('')}
      </div>
      <div class="admin-community-card-actions" style="margin-top:1rem;">
        <button class="admin-btn" type="submit">7개 코드 Vault에 저장</button>
      </div>
      <p class="admin-status" data-access-code-message hidden></p>
    </form>
  `;

  const panelShell = reservationsRoot.querySelector('.admin-panel-main');
  if (panelShell) panelShell.insertBefore(panel, panelShell.firstChild);
  else reservationsRoot.prepend(panel);

  const form = panel.querySelector('[data-access-code-form]');
  const monthInput = panel.querySelector('[data-access-code-month]');
  const statusButton = panel.querySelector('[data-access-code-status]');
  const message = panel.querySelector('[data-access-code-message]');
  monthInput.value = toMonthValue();

  const show = (text, kind = 'success') => {
    message.textContent = text;
    message.hidden = false;
    message.classList.remove('is-error', 'is-success');
    message.classList.add(kind === 'error' ? 'is-error' : 'is-success');
  };

  const loadStatus = async () => {
    const client = window.barunjariAdmin?.client;
    if (!client || !monthInput.value) return;
    statusButton.disabled = true;
    try {
      const { data, error } = await client.rpc('admin_access_code_status', { p_month: toMonthDate(monthInput.value) });
      if (error) throw error;
      const configured = data?.configured === true;
      show(`${monthInput.value} · 코드 ${data?.codeCount || 0}/7 · Vault ${data?.vaultSynced ? '동기화 완료' : '미동기화'} · ${configured ? '사용 준비 완료' : '설정 필요'}`, configured ? 'success' : 'error');
    } catch (error) {
      show(error?.message || '코드 설정 상태를 확인하지 못했습니다.', 'error');
    } finally {
      statusButton.disabled = false;
    }
  };

  statusButton.addEventListener('click', loadStatus);
  monthInput.addEventListener('change', loadStatus);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const client = window.barunjariAdmin?.client;
    if (!client || !monthInput.value) return;
    const codes = Object.fromEntries(weekdays.map(([key]) => [key, String(form.elements[key]?.value || '').trim()]));
    if (Object.values(codes).some((value) => !/^\d{6}$/.test(value))) {
      show('월요일부터 일요일까지 모든 코드를 숫자 6자리로 입력해 주세요.', 'error');
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const { data, error } = await client.rpc('admin_save_access_codes', {
        p_month: toMonthDate(monthInput.value),
        p_codes: codes
      });
      if (error) throw error;
      weekdays.forEach(([key]) => { form.elements[key].value = ''; });
      show(`${data?.month || monthInput.value} · 코드 ${data?.codeCount || 7}/7 · Vault 동기화 완료 · 사용 준비 완료`, 'success');
    } catch (error) {
      show(error?.message || '출입 코드를 저장하지 못했습니다.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  window.addEventListener('barunjari:admin-ready', loadStatus, { once: true });
  if (window.barunjariAdmin?.client) loadStatus();
})();
