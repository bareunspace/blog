(() => {
  const root = document.getElementById('adminReservations');
  if (!root) return;

  const list = root.querySelector('[data-reservations-list]');
  const status = root.querySelector('[data-reservations-status]');
  const refreshButton = root.querySelector('[data-reservations-refresh]');
  const rangeFilter = root.querySelector('[data-reservations-range-filter]');
  const tools = root.querySelector('.admin-community-tools');
  if (!list) return;

  const rowsById = new Map();
  let loadingNames = false;
  let enhanceFrame = null;

  const normalizeName = (value) => String(value || '').trim();
  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const showStatus = (message, kind = 'success') => {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    status.classList.remove('is-error', 'is-success');
    status.classList.add(kind === 'error' ? 'is-error' : 'is-success');
  };

  const setText = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  let nameSearchInput = root.querySelector('[data-reservations-name-filter]');
  if (!nameSearchInput && tools) {
    const label = document.createElement('label');
    label.className = 'admin-filter';
    label.innerHTML = '이름<input type="search" data-reservations-name-filter placeholder="예약자 이름 검색" autocomplete="off" />';
    const numberFilter = tools.querySelector('[data-reservations-query-filter]')?.closest('label');
    if (numberFilter) numberFilter.insertAdjacentElement('afterend', label);
    else tools.appendChild(label);
    nameSearchInput = label.querySelector('[data-reservations-name-filter]');
  }

  const applyNameSearch = () => {
    if (!nameSearchInput) return;
    const query = normalizeName(nameSearchInput.value).toLowerCase();
    list.querySelectorAll('[data-reservation-id]').forEach((card) => {
      const id = String(card.dataset.reservationId || '');
      const row = rowsById.get(id);
      const names = [row?.customer_name, row?.reservation_name]
        .map(normalizeName)
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      card.hidden = Boolean(query) && !names.includes(query);
    });
  };

  const renderCardName = (card, row) => {
    const id = String(card.dataset.reservationId || '');
    const originalName = normalizeName(row?.reservation_name);
    const adminName = normalizeName(row?.customer_name);
    setText(card.querySelector('.admin-community-item-head h3'), adminName || originalName || '예약자명 없음');

    let editor = card.querySelector('[data-reservation-name-editor]');
    if (!editor) {
      editor = document.createElement('div');
      editor.className = 'admin-reservation-name-editor';
      editor.dataset.reservationNameEditor = 'true';
      editor.innerHTML = `
        <div class="admin-form-row admin-reservation-name-row" style="display:flex;align-items:center;gap:.55rem;flex-wrap:nowrap;">
          <label for="reservationCustomerName-${escapeHtml(id)}" style="flex:0 0 auto;margin:0;white-space:nowrap;">관리자 확인 이름</label>
          <div class="admin-reservation-name-controls" style="display:flex;align-items:center;gap:.45rem;flex:1 1 auto;min-width:0;">
            <input id="reservationCustomerName-${escapeHtml(id)}" type="text" data-reservation-customer-name autocomplete="off" placeholder="실명 또는 확인한 이름" value="${escapeHtml(adminName)}" style="flex:1 1 auto;min-width:0;" />
            <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-save-reservation-name style="flex:0 0 auto;white-space:nowrap;">이름 저장</button>
          </div>
        </div>
        <p class="admin-community-subcopy" data-reservation-original-name></p>`;
      const meta = card.querySelector('.admin-reservation-meta');
      if (meta) meta.insertAdjacentElement('beforebegin', editor);
      else card.appendChild(editor);
    }

    const input = editor.querySelector('[data-reservation-customer-name]');
    if (input && document.activeElement !== input && input.dataset.persistedName !== adminName) input.value = adminName;
    if (input) input.dataset.persistedName = adminName;
    setText(editor.querySelector('[data-reservation-original-name]'), `네이버 원본: ${originalName || '-'}`);
  };

  const enhanceCards = () => {
    enhanceFrame = null;
    let hasMissingRows = false;
    list.querySelectorAll('[data-reservation-id]').forEach((card) => {
      const row = rowsById.get(String(card.dataset.reservationId || ''));
      if (!row) { hasMissingRows = true; return; }
      renderCardName(card, row);
    });
    applyNameSearch();
    if (hasMissingRows && !loadingNames) loadNames();
  };

  const scheduleEnhance = () => {
    if (enhanceFrame !== null) return;
    enhanceFrame = window.requestAnimationFrame(enhanceCards);
  };

  const loadNames = async () => {
    const client = window.barunjariAdmin?.client;
    if (!client || loadingNames) return;
    loadingNames = true;
    const { data, error } = await client.from('reservations')
      .select('id,reservation_name,customer_name').eq('source', 'naver').limit(500);
    loadingNames = false;
    if (error) {
      console.error('reservation name load failed', error);
      showStatus(`예약자 이름 정보를 불러오지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }
    rowsById.clear();
    (data || []).forEach((row) => rowsById.set(String(row.id), row));
    scheduleEnhance();
  };

  const saveName = async (button) => {
    const card = button.closest('[data-reservation-id]');
    const id = String(card?.dataset?.reservationId || '');
    const input = card?.querySelector('[data-reservation-customer-name]');
    const client = window.barunjariAdmin?.client;
    if (!client || !id || !input) {
      showStatus('저장할 예약 정보를 찾지 못했습니다.', 'error');
      return;
    }

    const nextName = normalizeName(input.value);
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '저장 중';
    const { data, error } = await client.from('reservations')
      .update({ customer_name: nextName || null }).eq('id', id)
      .select('id,reservation_name,customer_name').single();
    button.disabled = false;
    button.textContent = originalLabel;

    if (error) {
      console.error('reservation name update failed', error);
      showStatus(`이름을 저장하지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }
    if (normalizeName(data?.customer_name) !== nextName) {
      showStatus('이름 저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.', 'error');
      return;
    }

    rowsById.set(id, data);
    renderCardName(card, data);
    applyNameSearch();
    showStatus(nextName ? `${nextName} 이름을 저장했습니다.` : '관리자 확인 이름을 비웠습니다.', 'success');
  };

  nameSearchInput?.addEventListener('input', () => {
    const query = normalizeName(nameSearchInput.value);
    if (query && rangeFilter && rangeFilter.value !== 'all') {
      rangeFilter.value = 'all';
      rangeFilter.dispatchEvent(new Event('change', { bubbles: true }));
      window.setTimeout(scheduleEnhance, 0);
      return;
    }
    applyNameSearch();
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save-reservation-name]');
    if (!button) return;
    event.preventDefault();
    saveName(button);
  });

  list.addEventListener('keydown', (event) => {
    const input = event.target.closest('[data-reservation-customer-name]');
    if (!input || event.key !== 'Enter') return;
    event.preventDefault();
    const button = input.closest('[data-reservation-name-editor]')?.querySelector('[data-save-reservation-name]');
    if (button && !button.disabled) saveName(button);
  });

  new MutationObserver(scheduleEnhance).observe(list, { childList: true });
  refreshButton?.addEventListener('click', () => window.setTimeout(loadNames, 250));
  window.addEventListener('barunjari:admin-ready', loadNames);
  if (window.barunjariAdmin?.client) loadNames();
})();
