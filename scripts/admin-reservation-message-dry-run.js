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
    const numberNode = Array.from(card.querySelectorAll('.admin-community-subcopy')).find((node) => node.textContent?.includes('예약번호'));
    const reservationNumber = String(numberNode?.textContent || '').replace(/^.*예약번호\s*/, '').trim();
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
    }
  };

  const enhanceCards = () => {
    root.querySelectorAll('[data-reservation-id]').forEach((card) => {
      if (card.querySelector('[data-reservation-dry-run]')) return;
      const numberNode = Array.from(card.querySelectorAll('.admin-community-subcopy')).find((node) => node.textContent?.includes('예약번호'));
      if (!numberNode) return;
      const actions = document.createElement('div');
      actions.className = 'admin-community-card-actions';
      actions.innerHTML = `
        <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-reservation-dry-run>출입 안내 테스트</button>
        <span class="admin-community-subcopy">실제 톡톡/SMS 발송은 비활성화되어 있습니다.</span>
      `;
      card.appendChild(actions);
    });
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-reservation-dry-run]');
    if (button) runDryRun(button);
  });

  new MutationObserver(enhanceCards).observe(root, { childList: true, subtree: true });
  enhanceCards();
})();
