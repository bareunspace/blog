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
    const originalName = normalizeName(row?.reservation_name);
    const customerName = normalizeName(row?.customer_name);
    setText(card.querySelector('.admin-community-item-head h3'), customerName || originalName || '예약자명 없음');

    // customer_name is populated automatically now; the old manual editor is no longer used.
    card.querySelector('[data-reservation-name-editor]')?.remove();
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

  new MutationObserver(scheduleEnhance).observe(list, { childList: true });
  refreshButton?.addEventListener('click', () => window.setTimeout(loadNames, 250));
  window.addEventListener('barunjari:admin-ready', loadNames);
  if (window.barunjariAdmin?.client) loadNames();
})();
