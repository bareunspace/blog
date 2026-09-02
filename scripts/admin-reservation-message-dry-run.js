(() => {
  const root = document.getElementById('adminReservations');
  if (!root) return;

  const getClient = () => window.barunjariAdmin?.client || null;
  const getCurrentEmail = () => window.barunjariAdmin?.currentUser?.email || '';

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const getReservationNumber = (card) => {
    const numberNode = Array.from(card.querySelectorAll('.admin-community-subcopy'))
      .find((node) => node.textContent?.includes('예약번호'));
    return String(numberNode?.textContent || '').replace(/^.*예약번호\s*/, '').trim();
  };

  const formatStatusTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  };

  const getStatusView = (status = {}) => {
    const actual = String(status.actualStatus || '').toLowerCase();
    const latest = String(status.latestStatus || '').toLowerCase();
    const actualTime = formatStatusTime(status.actualCreatedAt);
    const latestTime = formatStatusTime(status.latestCreatedAt);
    const channel = String(status.actualChannel || '').toLowerCase();
    const channelLabel = channel === 'naver_talktalk' ? '네이버 톡톡' : channel === 'sms' || channel === 'sms_fallback' ? 'SMS' : '';

    if (actual === 'sent') {
      return { label: '발송 완료', tone: 'success', detail: [channelLabel, actualTime].filter(Boolean).join(' · ') };
    }
    if (actual === 'queued' || actual === 'sending') {
      return { label: '발송 대기', tone: 'pending', detail: [channelLabel, actualTime].filter(Boolean).join(' · ') };
    }
    if (actual.includes('fail') || actual === 'error') {
      return { label: '발송 실패', tone: 'error', detail: [channelLabel, status.actualErrorCode, actualTime].filter(Boolean).join(' · ') };
    }
    if (status.latestDryRun === true && latest === 'generated') {
      return { label: 'DRY-RUN 완료', tone: 'success', detail: [latestTime, status.latestLogId ? `로그 #${status.latestLogId}` : ''].filter(Boolean).join(' · ') };
    }
    if (status.latestDryRun === true && latest.startsWith('blocked')) {
      return { label: 'DRY-RUN 차단', tone: 'error', detail: [status.latestErrorCode, latestTime].filter(Boolean).join(' · ') };
    }
    return { label: '미실행', tone: 'neutral', detail: '아직 출입 안내 검증/발송 기록이 없습니다.' };
  };

  const renderPersistentStatus = (card, status) => {
    let panel = card.querySelector('[data-reservation-message-status]');
    if (!panel) {
      panel = document.createElement('div');
      panel.dataset.reservationMessageStatus = 'true';
      panel.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap;margin-top:.85rem;padding:.72rem .85rem;border:1px solid #dbe5de;border-radius:12px;background:#f8fbf9;';
      const actions = card.querySelector('[data-reservation-message-actions]');
      if (actions) card.insertBefore(panel, actions);
      else card.appendChild(panel);
    }

    const view = getStatusView(status);
    const toneStyle = view.tone === 'success'
      ? 'background:#eaf6ef;color:#23633e;'
      : view.tone === 'error'
        ? 'background:#fff0ed;color:#9b3c2f;'
        : view.tone === 'pending'
          ? 'background:#fff4e5;color:#8a5a12;'
          : 'background:#eef2ef;color:#607268;';

    panel.innerHTML = `
      <span style="font-size:.78rem;font-weight:800;color:#426252;">출입 안내 상태</span>
      <span style="display:inline-flex;align-items:center;min-height:28px;padding:5px 9px;border-radius:999px;font-size:.73rem;font-weight:850;${toneStyle}">${escapeHtml(view.label)}</span>
      <span style="flex:1 1 100%;font-size:.72rem;line-height:1.5;color:#6a7c72;">${escapeHtml(view.detail)}</span>
    `;
  };

  const refreshStatuses = async () => {
    const client = getClient();
    if (!client) return;
    const cards = Array.from(root.querySelectorAll('[data-reservation-id]'));
    const pairs = cards
      .map((card) => ({ card, reservationNumber: getReservationNumber(card) }))
      .filter(({ reservationNumber }) => reservationNumber && reservationNumber !== '-');
    if (!pairs.length) return;

    try {
      const { data, error } = await client.functions.invoke('reservation-message-dry-run', {
        body: { action: 'status', reservationNumbers: pairs.map(({ reservationNumber }) => reservationNumber) }
      });
      if (error) throw error;
      const statusMap = new Map((data?.statuses || []).map((status) => [String(status.reservationNumber), status]));
      pairs.forEach(({ card, reservationNumber }) => renderPersistentStatus(card, statusMap.get(reservationNumber) || {}));
    } catch (error) {
      pairs.forEach(({ card }) => renderPersistentStatus(card, { latestStatus: 'status_lookup_failed', latestErrorCode: error?.message || 'STATUS_LOOKUP_FAILED' }));
    }
  };

  const renderResult = (card, data) => {
    let panel = card.querySelector('[data-reservation-dry-run-result]');
    if (!panel) {
      panel = document.createElement('div');
      panel.dataset.reservationDryRunResult = 'true';
      panel.className = 'admin-community-message';
      card.appendChild(panel);
    }

    const ok = data?.ok === true;
    const statusLabel = ok ? 'DRY-RUN 통과' : 'DRY-RUN 차단';
    const codeState = data?.codeConfigured ? '설정됨' : '확인 필요';
    const duplicateState = data?.duplicateBlocked ? '중복 발송 차단됨' : '중복 없음';
    const errorLine = data?.errorCode ? `<p><strong>차단 사유</strong> ${escapeHtml(data.errorCode)}</p>` : '';
    const preview = data?.messagePreview ? `<pre style="white-space:pre-wrap;margin:.65rem 0 0;">${escapeHtml(data.messagePreview)}</pre>` : '';

    panel.innerHTML = `
      <strong>${statusLabel}</strong>
      <p>실제 발송: 비활성화 · 요일 코드: ${escapeHtml(data?.codeKey || '-')} · 코드 상태: ${codeState}</p>
      <p>예약자 정보: ${data?.customerReady ? '준비 완료' : '확인 필요'} · ${duplicateState} · 로그 #${escapeHtml(data?.logId || '-')}</p>
      ${errorLine}
      ${preview}
    `;
  };

  const runDryRun = async (button) => {
    const card = button.closest('[data-reservation-id]');
    if (!card) return;
    const reservationNumber = getReservationNumber(card);
    const client = getClient();
    if (!client || !reservationNumber || reservationNumber === '-') return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '검증 중...';
    try {
      const { data, error } = await client.functions.invoke('reservation-message-dry-run', {
        body: { reservationNumber, dryRun: true, requestedBy: getCurrentEmail() }
      });
      if (error) throw error;
      renderResult(card, data || {});
    } catch (error) {
      renderResult(card, { ok: false, errorCode: error?.message || 'DRY_RUN_FAILED' });
    } finally {
      button.disabled = false;
      button.textContent = originalText;
      refreshStatuses();
    }
  };

  let refreshTimer = 0;
  const scheduleStatusRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshStatuses, 120);
  };

  const enhanceCards = () => {
    let changed = false;
    root.querySelectorAll('[data-reservation-id]').forEach((card) => {
      if (card.querySelector('[data-reservation-dry-run]')) return;
      const reservationNumber = getReservationNumber(card);
      if (!reservationNumber) return;
      const actions = document.createElement('div');
      actions.className = 'admin-community-card-actions';
      actions.dataset.reservationMessageActions = 'true';
      actions.innerHTML = `
        <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-reservation-dry-run>출입 안내 테스트</button>
        <span class="admin-community-subcopy">실제 톡톡/SMS 발송은 비활성화되어 있습니다.</span>
      `;
      card.appendChild(actions);
      renderPersistentStatus(card, {});
      changed = true;
    });
    if (changed) scheduleStatusRefresh();
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-reservation-dry-run]');
    if (button) runDryRun(button);
  });

  new MutationObserver(enhanceCards).observe(root, { childList: true, subtree: true });
  enhanceCards();
  window.addEventListener('barunjari:admin-ready', scheduleStatusRefresh, { once: true });
})();
