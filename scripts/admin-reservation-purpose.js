(() => {
  const root = document.getElementById('adminReservations');
  if (!root) return;

  const list = root.querySelector('[data-reservations-list]');
  const status = root.querySelector('[data-reservations-status]');
  const refreshButton = root.querySelector('[data-reservations-refresh]');
  if (!list) return;

  const PURPOSES = [
    '면접·발표 연습',
    '스터디·팀 프로젝트',
    '미팅·업무',
    '개인 작업·집중',
    '영어·외국어 연습',
    '상담·대화',
    '기타'
  ];

  const rowsById = new Map();
  let loading = false;
  let enhanceFrame = null;

  const normalize = (value) => String(value || '').trim();
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

  const renderCard = (card, row) => {
    const id = String(card.dataset.reservationId || '');
    const currentPurpose = normalize(row?.usage_purpose);

    let editor = card.querySelector('[data-reservation-purpose-editor]');
    if (!editor) {
      editor = document.createElement('div');
      editor.className = 'admin-reservation-purpose-editor';
      editor.dataset.reservationPurposeEditor = 'true';
      editor.innerHTML = `
        <div class="admin-form-row" style="display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;margin-top:.65rem;">
          <label for="reservationUsagePurpose-${escapeHtml(id)}" style="flex:0 0 auto;margin:0;white-space:nowrap;">이용 목적</label>
          <div style="display:flex;align-items:center;gap:.45rem;flex:1 1 320px;min-width:0;">
            <select id="reservationUsagePurpose-${escapeHtml(id)}" data-reservation-usage-purpose style="flex:1 1 auto;min-width:0;">
              <option value="">선택 안 함</option>
              ${PURPOSES.map((purpose) => `<option value="${escapeHtml(purpose)}">${escapeHtml(purpose)}</option>`).join('')}
            </select>
            <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-save-reservation-purpose style="flex:0 0 auto;white-space:nowrap;">목적 저장</button>
          </div>
        </div>`;

      const nameEditor = card.querySelector('[data-reservation-name-editor]');
      const meta = card.querySelector('.admin-reservation-meta');
      if (nameEditor) nameEditor.insertAdjacentElement('afterend', editor);
      else if (meta) meta.insertAdjacentElement('beforebegin', editor);
      else card.appendChild(editor);
    }

    const select = editor.querySelector('[data-reservation-usage-purpose]');
    if (select && document.activeElement !== select && select.dataset.persistedPurpose !== currentPurpose) {
      select.value = PURPOSES.includes(currentPurpose) ? currentPurpose : '';
    }
    if (select) select.dataset.persistedPurpose = currentPurpose;
  };

  const enhanceCards = () => {
    enhanceFrame = null;
    let hasMissingRows = false;
    list.querySelectorAll('[data-reservation-id]').forEach((card) => {
      const row = rowsById.get(String(card.dataset.reservationId || ''));
      if (!row) {
        hasMissingRows = true;
        return;
      }
      renderCard(card, row);
    });
    if (hasMissingRows && !loading) loadPurposes();
  };

  const scheduleEnhance = () => {
    if (enhanceFrame !== null) return;
    enhanceFrame = window.requestAnimationFrame(enhanceCards);
  };

  const loadPurposes = async () => {
    const client = window.barunjariAdmin?.client;
    if (!client || loading) return;
    loading = true;
    const { data, error } = await client.from('reservations')
      .select('id,usage_purpose').eq('source', 'naver').limit(500);
    loading = false;

    if (error) {
      console.error('reservation purpose load failed', error);
      showStatus(`이용 목적 정보를 불러오지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    rowsById.clear();
    (data || []).forEach((row) => rowsById.set(String(row.id), row));
    scheduleEnhance();
  };

  const savePurpose = async (button) => {
    const card = button.closest('[data-reservation-id]');
    const id = String(card?.dataset?.reservationId || '');
    const select = card?.querySelector('[data-reservation-usage-purpose]');
    const client = window.barunjariAdmin?.client;
    if (!client || !id || !select) {
      showStatus('저장할 예약 정보를 찾지 못했습니다.', 'error');
      return;
    }

    const nextPurpose = normalize(select.value);
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '저장 중';

    const { data, error } = await client.from('reservations')
      .update({ usage_purpose: nextPurpose || null })
      .eq('id', id)
      .select('id,usage_purpose')
      .single();

    button.disabled = false;
    button.textContent = originalLabel;

    if (error) {
      console.error('reservation purpose update failed', error);
      showStatus(`이용 목적을 저장하지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    if (normalize(data?.usage_purpose) !== nextPurpose) {
      showStatus('이용 목적 저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.', 'error');
      return;
    }

    rowsById.set(id, data);
    renderCard(card, data);
    showStatus(nextPurpose ? `${nextPurpose}으로 이용 목적을 저장했습니다.` : '이용 목적을 비웠습니다.', 'success');
  };

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save-reservation-purpose]');
    if (!button) return;
    event.preventDefault();
    savePurpose(button);
  });

  list.addEventListener('change', (event) => {
    const select = event.target.closest('[data-reservation-usage-purpose]');
    if (!select) return;
    const button = select.closest('[data-reservation-purpose-editor]')?.querySelector('[data-save-reservation-purpose]');
    if (button) button.disabled = normalize(select.value) === normalize(select.dataset.persistedPurpose);
  });

  new MutationObserver(scheduleEnhance).observe(list, { childList: true });
  refreshButton?.addEventListener('click', () => window.setTimeout(loadPurposes, 250));
  window.addEventListener('barunjari:admin-ready', loadPurposes);
  if (window.barunjariAdmin?.client) loadPurposes();
})();
