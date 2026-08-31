(() => {
  const root = document.getElementById('adminLearningCandidates');
  if (!root) return;

  const listNode = root.querySelector('[data-learning-candidates-list]');
  const statusNode = root.querySelector('[data-learning-candidates-status]');
  const refreshButton = root.querySelector('[data-learning-candidates-refresh]');

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatCurrency = (value) => new Intl.NumberFormat('ko-KR', {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 0
  }).format(Number(value || 0));

  const showStatus = (message, kind = 'info') => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.hidden = false;
    statusNode.classList.remove('is-error', 'is-success');
    if (kind === 'error') statusNode.classList.add('is-error');
    if (kind === 'success') statusNode.classList.add('is-success');
  };

  const render = (candidates, evidenceRows) => {
    if (!listNode) return;
    if (!candidates.length) {
      listNode.innerHTML = '<p class="admin-empty">아직 저장된 학습 후보가 없습니다.</p>';
      return;
    }

    const evidenceByCandidate = new Map();
    evidenceRows.forEach((row) => {
      if (!evidenceByCandidate.has(row.candidate_id)) evidenceByCandidate.set(row.candidate_id, row);
    });

    listNode.innerHTML = candidates.map((candidate) => {
      const evidence = evidenceByCandidate.get(candidate.id) || {};
      const payload = evidence.payload || {};
      const confidence = Math.round(Number(candidate.confidence || 0) * 100);
      return `
        <article class="admin-community-item admin-learning-card">
          <div class="admin-community-item-head">
            <div>
              <p class="admin-community-eyebrow">${escapeHtml(candidate.candidate_type)} · 최근 28일</p>
              <h3>${escapeHtml(candidate.title)}</h3>
              <p class="admin-community-subcopy">${escapeHtml(candidate.hypothesis)}</p>
            </div>
            <span class="admin-community-status">${escapeHtml(candidate.status)}</span>
          </div>
          <dl class="admin-community-meta admin-learning-meta">
            <div><dt>예약</dt><dd>${Number(evidence.metric_value || 0)}건</dd></div>
            <div><dt>고객</dt><dd>${Number(payload.distinct_customers || 0)}명</dd></div>
            <div><dt>활동 주</dt><dd>${Number(payload.active_weeks || 0)}주</dd></div>
            <div><dt>순매출</dt><dd>${formatCurrency(payload.net_revenue)}</dd></div>
            <div><dt>신뢰도</dt><dd>${confidence}%</dd></div>
            <div><dt>관찰 기간</dt><dd>${escapeHtml(candidate.evidence_window_start)}~${escapeHtml(candidate.evidence_window_end)}</dd></div>
          </dl>
          <p class="admin-desc">읽기 전용 후보입니다. 승인·기각 및 KB 반영 기능은 아직 연결되지 않았습니다.</p>
        </article>`;
    }).join('');
  };

  const loadCandidates = async () => {
    const client = window.barunjariAdmin?.client;
    if (!client) return;
    showStatus('학습 후보를 불러오는 중입니다.', 'success');
    const { data, error } = await client.functions.invoke('learning-detector', { body: { action: 'list' } });
    if (error || !data?.ok) {
      showStatus(`학습 후보를 불러오지 못했습니다. (${data?.error || error?.message || '알 수 없는 오류'})`, 'error');
      return;
    }
    render(data.candidates || [], data.evidence || []);
    showStatus(`${(data.candidates || []).length}개의 학습 후보를 불러왔습니다.`, 'success');
  };

  refreshButton?.addEventListener('click', loadCandidates);
  window.addEventListener('barunjari:admin-ready', loadCandidates);
  if (window.barunjariAdmin?.client) loadCandidates();
})();
