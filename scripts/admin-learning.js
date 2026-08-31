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

  const statusLabels = { detected: '새 후보', pending_review: '보류', approved: '승인', rejected: '기각' };
  const decisionLabels = { approved: '승인', hold: '보류', rejected: '기각' };
  const formatDateTime = (value) => value ? new Date(value).toLocaleString('ko-KR') : '';

  const render = (candidates, evidenceRows, reviewRows) => {
    if (!listNode) return;
    if (!candidates.length) {
      listNode.innerHTML = '<p class="admin-empty">아직 저장된 학습 후보가 없습니다.</p>';
      return;
    }

    const evidenceByCandidate = new Map();
    evidenceRows.forEach((row) => {
      if (!evidenceByCandidate.has(row.candidate_id)) evidenceByCandidate.set(row.candidate_id, row);
    });
    const reviewsByCandidate = new Map();
    reviewRows.forEach((row) => {
      const rows = reviewsByCandidate.get(row.candidate_id) || [];
      rows.push(row);
      reviewsByCandidate.set(row.candidate_id, rows);
    });

    listNode.innerHTML = candidates.map((candidate) => {
      const evidence = evidenceByCandidate.get(candidate.id) || {};
      const payload = evidence.payload || {};
      const confidence = Math.round(Number(candidate.confidence || 0) * 100);
      const reviews = reviewsByCandidate.get(candidate.id) || [];
      const reviewHistory = reviews.length ? `<details class="admin-desc"><summary>판단 이력 ${reviews.length}건</summary><ul>${reviews.map((review) => {
        const reviewPayload = review.payload || {};
        return `<li>${escapeHtml(formatDateTime(review.created_at))} · ${escapeHtml(decisionLabels[reviewPayload.decision] || reviewPayload.decision)} · ${escapeHtml(review.actor_label || '')}${reviewPayload.note ? ` — ${escapeHtml(reviewPayload.note)}` : ''}</li>`;
      }).join('')}</ul></details>` : '';
      return `
        <article class="admin-community-item admin-learning-card" data-learning-candidate-id="${escapeHtml(candidate.id)}">
          <div class="admin-community-item-head">
            <div>
              <p class="admin-community-eyebrow">${escapeHtml(candidate.candidate_type)} · 최근 28일</p>
              <h3>${escapeHtml(candidate.title)}</h3>
              <p class="admin-community-subcopy">${escapeHtml(candidate.hypothesis)}</p>
            </div>
            <span class="admin-community-status">${escapeHtml(statusLabels[candidate.status] || candidate.status)}</span>
          </div>
          <dl class="admin-community-meta admin-learning-meta">
            <div><dt>예약</dt><dd>${Number(evidence.metric_value || 0)}건</dd></div>
            <div><dt>고객</dt><dd>${Number(payload.distinct_customers || 0)}명</dd></div>
            <div><dt>활동 주</dt><dd>${Number(payload.active_weeks || 0)}주</dd></div>
            <div><dt>순매출</dt><dd>${formatCurrency(payload.net_revenue)}</dd></div>
            <div><dt>신뢰도</dt><dd>${confidence}%</dd></div>
            <div><dt>관찰 기간</dt><dd>${escapeHtml(candidate.evidence_window_start)}~${escapeHtml(candidate.evidence_window_end)}</dd></div>
          </dl>
          <label class="admin-desc">판단 메모 (선택)
            <textarea class="admin-filter" data-learning-review-note maxlength="2000" rows="2" placeholder="판단 근거 또는 추가로 필요한 증거"></textarea>
          </label>
          <div class="admin-community-card-actions">
            <button type="button" class="admin-btn" data-learning-review-decision="approved">승인</button>
            <button type="button" class="admin-btn" data-learning-review-decision="hold">보류</button>
            <button type="button" class="admin-btn admin-btn-danger" data-learning-review-decision="rejected">기각</button>
          </div>
          ${reviewHistory}
          <p class="admin-desc">판단은 이력으로 저장됩니다. Knowledge Base와 GitHub PR은 아직 수정하지 않습니다.</p>
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
    render(data.candidates || [], data.evidence || [], data.review_actions || []);
    showStatus(`${(data.candidates || []).length}개의 학습 후보를 불러왔습니다.`, 'success');
  };

  refreshButton?.addEventListener('click', loadCandidates);
  listNode?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-learning-review-decision]');
    if (!button) return;
    const card = button.closest('[data-learning-candidate-id]');
    const candidateId = card?.dataset.learningCandidateId;
    const decision = button.dataset.learningReviewDecision;
    const note = card?.querySelector('[data-learning-review-note]')?.value || '';
    if (!candidateId || !decision) return;
    if (decision === 'rejected' && !window.confirm('이 학습 후보를 기각할까요? 판단 이력은 보존됩니다.')) return;

    const buttons = card.querySelectorAll('[data-learning-review-decision]');
    buttons.forEach((node) => { node.disabled = true; });
    showStatus(`${decisionLabels[decision]} 판단을 저장하는 중입니다.`, 'success');
    const client = window.barunjariAdmin?.client;
    const { data, error } = await client.functions.invoke('learning-detector', {
      body: { action: 'review', candidate_id: candidateId, decision, note }
    });
    if (error || !data?.ok) {
      buttons.forEach((node) => { node.disabled = false; });
      showStatus(`판단을 저장하지 못했습니다. (${data?.error || error?.message || '알 수 없는 오류'})`, 'error');
      return;
    }
    showStatus(`${decisionLabels[decision]} 판단과 이력을 저장했습니다.`, 'success');
    await loadCandidates();
  });
  window.addEventListener('barunjari:admin-ready', loadCandidates);
  if (window.barunjariAdmin?.client) loadCandidates();
})();
