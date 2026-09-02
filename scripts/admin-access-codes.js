(() => {
  const reservationsRoot = document.getElementById('adminReservations');
  if (!reservationsRoot || reservationsRoot.querySelector('[data-access-code-panel]')) return;

  const styleId = 'adminAccessCodeStyles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #adminDashboardRoot #adminReservations {
        padding-top:.7rem !important;
      }
      #adminDashboardRoot .admin-access-codes {
        width:100%;
        margin:0 0 1rem;
        border:1px solid #dce8e1;
        border-radius:16px;
        background:#fff;
        overflow:hidden;
        box-shadow:0 8px 22px rgba(31,83,58,.05);
      }
      #adminDashboardRoot .admin-access-codes > summary {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:16px;
        min-width:0;
        padding:15px 17px;
        cursor:pointer;
        list-style:none;
        user-select:none;
      }
      #adminDashboardRoot .admin-access-codes > summary::-webkit-details-marker { display:none; }
      #adminDashboardRoot .admin-access-code-summary-copy { min-width:0; }
      #adminDashboardRoot .admin-access-code-summary-copy .admin-label { margin:0 0 3px; }
      #adminDashboardRoot .admin-access-code-summary-title {
        margin:0;
        color:#173e2c;
        font-size:1rem;
        line-height:1.3;
        font-weight:850;
      }
      #adminDashboardRoot .admin-access-code-summary-meta {
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:9px;
        flex:0 0 auto;
      }
      #adminDashboardRoot .admin-access-code-status-chip {
        display:inline-flex;
        align-items:center;
        min-height:28px;
        max-width:260px;
        padding:5px 9px;
        border-radius:999px;
        background:#f1f5f2;
        color:#557064;
        font-size:.72rem;
        font-weight:800;
        line-height:1.2;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      #adminDashboardRoot .admin-access-code-status-chip.is-ready { background:#eaf6ef; color:#23633e; }
      #adminDashboardRoot .admin-access-code-status-chip.is-warning { background:#fff4e5; color:#8a5a12; }
      #adminDashboardRoot .admin-access-code-chevron {
        width:9px;
        height:9px;
        border-right:2px solid #668074;
        border-bottom:2px solid #668074;
        transform:rotate(45deg);
        transition:transform .18s ease;
        flex:0 0 auto;
      }
      #adminDashboardRoot .admin-access-codes[open] .admin-access-code-chevron { transform:rotate(225deg); }
      #adminDashboardRoot .admin-access-code-body {
        padding:16px 17px 18px;
        border-top:1px solid #edf2ef;
        background:#fbfdfc;
      }
      #adminDashboardRoot .admin-access-code-desc {
        margin:0 0 14px;
        color:#668074;
        font-size:.8rem;
        line-height:1.55;
      }
      #adminDashboardRoot .admin-access-code-toolbar {
        display:grid;
        grid-template-columns:minmax(180px,230px) auto;
        align-items:end;
        gap:10px;
        margin-bottom:13px;
      }
      #adminDashboardRoot .admin-access-code-month,
      #adminDashboardRoot .admin-access-code-field {
        display:grid;
        gap:5px;
        min-width:0;
      }
      #adminDashboardRoot .admin-access-code-month > span,
      #adminDashboardRoot .admin-access-code-field > span {
        color:#426252;
        font-size:.72rem;
        line-height:1.2;
        font-weight:800;
      }
      #adminDashboardRoot .admin-access-code-month input,
      #adminDashboardRoot .admin-access-code-field input {
        width:100%;
        min-width:0;
        height:42px;
        box-sizing:border-box;
        border:1px solid #cfddd5;
        border-radius:10px;
        background:#fff;
        color:#173e2c;
        padding:0 10px;
        font:inherit;
        font-size:.88rem;
        outline:none;
      }
      #adminDashboardRoot .admin-access-code-month input:focus,
      #adminDashboardRoot .admin-access-code-field input:focus {
        border-color:#5b8a71;
        box-shadow:0 0 0 3px rgba(91,138,113,.12);
      }
      #adminDashboardRoot .admin-access-code-grid {
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:10px;
      }
      #adminDashboardRoot .admin-access-code-field {
        padding:10px;
        border:1px solid #e1ebe5;
        border-radius:12px;
        background:#fff;
      }
      #adminDashboardRoot .admin-access-code-actions {
        display:flex;
        justify-content:flex-end;
        gap:8px;
        margin-top:13px;
      }
      #adminDashboardRoot .admin-access-code-actions .admin-btn,
      #adminDashboardRoot .admin-access-code-toolbar .admin-btn { min-height:42px; }
      #adminDashboardRoot .admin-access-code-message { margin:12px 0 0; }
      @media (max-width:680px) {
        #adminDashboardRoot #adminReservations { padding-top:.4rem !important; }
        #adminDashboardRoot .admin-access-codes { border-radius:13px; margin-bottom:10px; }
        #adminDashboardRoot .admin-access-codes > summary { padding:12px; gap:8px; }
        #adminDashboardRoot .admin-access-code-summary-title { font-size:.92rem; }
        #adminDashboardRoot .admin-access-code-summary-meta { gap:7px; max-width:48%; }
        #adminDashboardRoot .admin-access-code-status-chip { max-width:145px; min-height:26px; font-size:.66rem; padding:4px 7px; }
        #adminDashboardRoot .admin-access-code-body { padding:12px; }
        #adminDashboardRoot .admin-access-code-toolbar { grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:7px; }
        #adminDashboardRoot .admin-access-code-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }
        #adminDashboardRoot .admin-access-code-field { padding:8px; }
        #adminDashboardRoot .admin-access-code-month input,
        #adminDashboardRoot .admin-access-code-field input { height:40px; font-size:.84rem; }
        #adminDashboardRoot .admin-access-code-toolbar .admin-btn { width:100%; min-width:0; padding-left:8px; padding-right:8px; font-size:.76rem; }
        #adminDashboardRoot .admin-access-code-actions .admin-btn { width:100%; }
      }
      @media (max-width:390px) {
        #adminDashboardRoot .admin-access-code-summary-meta { max-width:44%; }
        #adminDashboardRoot .admin-access-code-status-chip { max-width:110px; }
        #adminDashboardRoot .admin-access-code-toolbar { grid-template-columns:1fr; }
        #adminDashboardRoot .admin-access-code-grid { grid-template-columns:1fr; }
      }
    `;
    document.head.appendChild(style);
  }

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

  const panel = document.createElement('details');
  panel.className = 'admin-access-codes';
  panel.dataset.accessCodePanel = 'true';
  panel.innerHTML = `
    <summary>
      <div class="admin-access-code-summary-copy">
        <p class="admin-label">Access Codes</p>
        <h3 class="admin-access-code-summary-title">예약 출입 코드 설정</h3>
      </div>
      <div class="admin-access-code-summary-meta">
        <span class="admin-access-code-status-chip" data-access-code-summary-status>상태 확인 중</span>
        <span class="admin-access-code-chevron" aria-hidden="true"></span>
      </div>
    </summary>
    <div class="admin-access-code-body">
      <p class="admin-access-code-desc">월별 요일 코드를 Vault에 저장합니다. 저장 후 원문 코드는 다시 표시하지 않습니다.</p>
      <form data-access-code-form>
        <div class="admin-access-code-toolbar">
          <label class="admin-access-code-month">
            <span>적용 월</span>
            <input type="month" data-access-code-month required>
          </label>
          <button class="admin-btn admin-btn-outline" type="button" data-access-code-status>설정 상태 확인</button>
        </div>
        <div class="admin-access-code-grid" data-access-code-inputs>
          ${weekdays.map(([key, label]) => `
            <label class="admin-access-code-field">
              <span>${label}요일</span>
              <input type="password" name="${key}" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="6자리" autocomplete="new-password" required>
            </label>
          `).join('')}
        </div>
        <div class="admin-access-code-actions">
          <button class="admin-btn" type="submit">7개 코드 Vault에 저장</button>
        </div>
        <p class="admin-status admin-access-code-message" data-access-code-message hidden></p>
      </form>
    </div>
  `;

  const panelShell = reservationsRoot.querySelector('.admin-panel-main');
  if (panelShell) panelShell.insertBefore(panel, panelShell.firstChild);
  else reservationsRoot.prepend(panel);

  const form = panel.querySelector('[data-access-code-form]');
  const monthInput = panel.querySelector('[data-access-code-month]');
  const statusButton = panel.querySelector('[data-access-code-status]');
  const message = panel.querySelector('[data-access-code-message]');
  const summaryStatus = panel.querySelector('[data-access-code-summary-status]');
  monthInput.value = toMonthValue();

  const setSummaryStatus = (text, configured = false) => {
    summaryStatus.textContent = text;
    summaryStatus.classList.toggle('is-ready', configured);
    summaryStatus.classList.toggle('is-warning', !configured);
  };

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
      const codeCount = data?.codeCount || 0;
      const vaultLabel = data?.vaultSynced ? 'Vault 완료' : 'Vault 미동기화';
      setSummaryStatus(`${monthInput.value} · ${codeCount}/7 · ${vaultLabel}`, configured);
      show(`${monthInput.value} · 코드 ${codeCount}/7 · Vault ${data?.vaultSynced ? '동기화 완료' : '미동기화'} · ${configured ? '사용 준비 완료' : '설정 필요'}`, configured ? 'success' : 'error');
    } catch (error) {
      setSummaryStatus('상태 확인 필요', false);
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
      setSummaryStatus(`${data?.month || monthInput.value} · 7/7 · Vault 완료`, true);
      show(`${data?.month || monthInput.value} · 코드 ${data?.codeCount || 7}/7 · Vault 동기화 완료 · 사용 준비 완료`, 'success');
    } catch (error) {
      setSummaryStatus('저장 확인 필요', false);
      show(error?.message || '출입 코드를 저장하지 못했습니다.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  window.addEventListener('barunjari:admin-ready', loadStatus, { once: true });
  if (window.barunjariAdmin?.client) loadStatus();
})();
