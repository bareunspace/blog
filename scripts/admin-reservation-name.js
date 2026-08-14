(() => {
  const root = document.getElementById('adminReservations');
  if (!root) return;

  const list = root.querySelector('[data-reservations-list]');
  const status = root.querySelector('[data-reservations-status]');
  if (!list) return;

  let rowsById = new Map();
  let enhancing = false;

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const showStatus = (message, kind = 'success') => {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    status.classList.remove('is-error', 'is-success');
    status.classList.add(kind === 'error' ? 'is-error' : 'is-success');
  };

  const enhanceCards = () => {
    if (enhancing) return;
    enhancing = true;
    try {
      list.querySelectorAll('[data-reservation-id]').forEach((card) => {
        const id = String(card.dataset.reservationId || '');
        const row = rowsById.get(id);
        if (!row) return;

        const originalName = String(row.reservation_name || '').trim();
        const adminName = String(row.customer_name || '').trim();
        const displayName = adminName || originalName || '예약자명 없음';
        const title = card.querySelector('.admin-community-item-head h3');
        if (title) title.textContent = displayName;

        let editor = card.querySelector('[data-reservation-name-editor]');
        if (!editor) {
          editor = document.createElement('form');
          editor.className = 'admin-reservation-name-editor';
          editor.dataset.reservationNameEditor = 'true';
          editor.innerHTML = `
            <div class="admin-form-row admin-reservation-name-row">
              <label>관리자 확인 이름</label>
              <div class="admin-reservation-name-controls">
                <input type="text" name="customer_name" autocomplete="off" placeholder="실명 또는 확인한 이름" value="${escapeHtml(adminName)}" />
                <button class="admin-btn admin-btn-outline admin-btn-small" type="submit">이름 저장</button>
              </div>
              <p class="admin-community-subcopy">네이버 원본: ${escapeHtml(originalName || '-')}</p>
            </div>`;
          const meta = card.querySelector('.admin-reservation-meta');
          if (meta) meta.insertAdjacentElement('beforebegin', editor);
          else card.appendChild(editor);
        } else {
          const input = editor.elements?.customer_name;
          if (input && document.activeElement !== input) input.value = adminName;
          const note = editor.querySelector('.admin-community-subcopy');
          if (note) note.textContent = `네이버 원본: ${originalName || '-'}`;
        }
      });
    } finally {
      enhancing = false;
    }
  };

  const loadNames = async () => {
    const client = window.barunjariAdmin?.client;
    if (!client) return;

    const { data, error } = await client
      .from('reservations')
      .select('id,reservation_name,customer_name')
      .eq('source', 'naver')
      .limit(500);

    if (error) {
      console.error('reservation name load failed', error);
      showStatus(`예약자 이름 정보를 불러오지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    rowsById = new Map((data || []).map((row) => [String(row.id), row]));
    enhanceCards();
  };

  list.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-reservation-name-editor]');
    if (!form) return;
    event.preventDefault();

    const card = form.closest('[data-reservation-id]');
    const id = String(card?.dataset?.reservationId || '');
    const client = window.barunjariAdmin?.client;
    if (!client || !id) return;

    const input = form.elements.customer_name;
    const button = form.querySelector('button[type="submit"]');
    const nextName = String(input?.value || '').trim();
    if (button) button.disabled = true;

    const { data, error } = await client
      .from('reservations')
      .update({ customer_name: nextName || null })
      .eq('id', id)
      .select('id,reservation_name,customer_name')
      .single();

    if (button) button.disabled = false;
    if (error) {
      console.error('reservation name update failed', error);
      showStatus(`이름을 저장하지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    rowsById.set(id, data);
    enhanceCards();
    showStatus(nextName ? `${nextName} 이름을 저장했습니다.` : '관리자 확인 이름을 비웠습니다.', 'success');
  });

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(enhanceCards);
  });
  observer.observe(list, { childList: true, subtree: true });

  window.addEventListener('barunjari:admin-ready', loadNames);
  if (window.barunjariAdmin?.client) loadNames();
})();
