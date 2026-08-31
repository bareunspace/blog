(() => {
  const root = document.getElementById('adminLearningCandidates');
  if (!root) return;
  if (root.dataset.learningControllerAttached === 'true') return;
  root.dataset.learningControllerAttached = 'true';

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

  const statusLabels = { detected: '검토 대기', pending_review: '추가 관찰', approved: '승인됨', rejected: '기각됨', promoted: 'KB 반영 완료', validated: '검증 완료', invalidated: '검증 실패' };
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
    const previousReviewByKey = new Map();
    [...reviewRows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).forEach((row) => {
      const decision = row.payload?.decision || '';
      const key = `${row.candidate_id}|${row.actor_label || ''}|${decision}`;
      const previous = previousReviewByKey.get(key);
      const elapsed = previous ? new Date(row.created_at) - new Date(previous.created_at) : Infinity;
      const isDuplicate = previous && elapsed >= 0 && elapsed <= 2000 && row.from_status === row.to_status;
      previousReviewByKey.set(key, row);
      if (isDuplicate) return;
      const rows = reviewsByCandidate.get(row.candidate_id) || [];
      rows.unshift(row);
      reviewsByCandidate.set(row.candidate_id, rows);
    });

    const counts = candidates.reduce((result, candidate) => {
      result[candidate.status] = (result[candidate.status] || 0) + 1;
      return result;
    }, {});

    const cards = candidates.map((candidate) => {
      const evidence = evidenceByCandidate.get(candidate.id) || {};
      const payload = evidence.payload || {};
      const confidence = Math.round(Number(candidate.confidence || 0) * 100);
      const reviews = reviewsByCandidate.get(candidate.id) || [];
      const analysis = candidate.ai_analysis || {};
      const checkpoints = candidate.outcome_summary?.checkpoints || {};
      const evidenceValidated = candidate.evidence_validation_status === 'validated';
      const evidenceValidationView = `
        <div class="admin-learning-evidence-validation ${evidenceValidated ? 'is-validated' : 'is-monitoring'}">
          <strong>${evidenceValidated ? '근거 즉시 검증 완료' : '근거 추가 관찰'}</strong>
          <span>${evidenceValidated
            ? '예약 10건·고객 5명·활동 3주·신뢰도 85% 기준을 충족했습니다.'
            : '현재 근거는 KB에 반영되었으며, 7·14·28일 결과를 계속 추적합니다.'}</span>
        </div>`;
      const checkpointResult = (key, label) => checkpoints[key]
        ? `<span class="is-complete">${label} ✓</span>` : `<span>${label}</span>`;
      const checkpointView = ['promoted', 'validated', 'invalidated'].includes(candidate.status) ? `
        <div class="admin-learning-checkpoints">
          ${checkpointResult('7d', '7일 조기 확인')}
          ${checkpointResult('14d', '14일 방향 판단')}
          ${checkpointResult('28d', '28일 최종 검증')}
        </div>` : '';
      const draft = candidate.ai_analysis_status === 'completed' && analysis.proposed_path ? `
        <details class="admin-learning-details admin-learning-draft" open>
          <summary><span>KB 반영 초안</span><small>내용 확인</small></summary>
          <div class="admin-learning-details-body">
            <p class="admin-learning-classification">${escapeHtml(analysis.classification || 'HYPOTHESIS')}</p>
            <p><strong>저장소</strong><br>${escapeHtml(analysis.repository || 'bareunspace/knowledge-base')}</p>
            <p><strong>내부 경로</strong><br><code>${escapeHtml(analysis.proposed_path)}</code></p>
            <p>${escapeHtml(analysis.summary)}</p>
            <p><strong>검증 규칙</strong><br>${escapeHtml(analysis.promotion_rule)}</p>
          </div>
        </details>` : '';
      const promotionUrl = candidate.promoted_commit_sha && candidate.github_repo
        ? `https://github.com/${candidate.github_repo}/commit/${candidate.promoted_commit_sha}` : '';
      const promotionControl = promotionUrl
        ? `<a class="admin-btn admin-btn-outline" href="${escapeHtml(promotionUrl)}" target="_blank" rel="noopener">KB 반영 commit 열기</a>`
        : (candidate.status === 'approved' && candidate.ai_analysis_status === 'completed'
          ? '<button type="button" class="admin-btn" data-learning-promote>KB에 직접 반영</button>' : '');
      const reviewHistory = reviews.length ? `<details class="admin-learning-details"><summary><span>판단 이력</span><small>${reviews.length}건</small></summary><div class="admin-learning-details-body"><ul class="admin-learning-history">${reviews.map((review) => {
        const reviewPayload = review.payload || {};
        return `<li>${escapeHtml(formatDateTime(review.created_at))} · ${escapeHtml(decisionLabels[reviewPayload.decision] || reviewPayload.decision)} · ${escapeHtml(review.actor_label || '')}${reviewPayload.note ? ` — ${escapeHtml(reviewPayload.note)}` : ''}</li>`;
      }).join('')}</ul></div></details>` : '';
      const currentStep = ['promoted', 'validated', 'invalidated'].includes(candidate.status) ? 4 : candidate.ai_analysis_status === 'completed' ? 3 : candidate.status === 'approved' ? 2 : 1;
      const reviewPanel = ['detected', 'pending_review', 'approved', 'rejected'].includes(candidate.status) ? `
        <details class="admin-learning-review" ${candidate.status === 'detected' ? 'open' : ''}>
          <summary><span>${candidate.reviewed_at ? '판단 변경' : '후보 판단하기'}</span><small>메모와 함께 저장</small></summary>
          <div class="admin-learning-review-body">
            <label>판단 메모 <span>(선택)</span>
              <textarea data-learning-review-note maxlength="2000" rows="3" placeholder="승인 근거 또는 추가로 필요한 증거를 적어주세요.">${escapeHtml(candidate.review_note || '')}</textarea>
            </label>
            <div class="admin-learning-decision-actions">
              <button type="button" class="admin-btn admin-learning-approve" data-learning-review-decision="approved">승인</button>
              <button type="button" class="admin-btn admin-btn-outline" data-learning-review-decision="hold">추가 관찰</button>
              <button type="button" class="admin-btn admin-btn-danger" data-learning-review-decision="rejected">기각</button>
            </div>
          </div>
        </details>` : '';
      return `
        <article class="admin-learning-card is-${escapeHtml(candidate.status)}" data-learning-candidate-id="${escapeHtml(candidate.id)}">
          <div class="admin-learning-card-head">
            <div class="admin-learning-title-wrap">
              <div class="admin-learning-step">${currentStep}</div>
              <div>
              <p class="admin-community-eyebrow">반복 수요 · 최근 28일</p>
              <h3>${escapeHtml(candidate.title)}</h3>
              <p class="admin-community-subcopy">${escapeHtml(candidate.hypothesis)}</p>
              </div>
            </div>
            <span class="admin-learning-status is-${escapeHtml(candidate.status)}">${escapeHtml(statusLabels[candidate.status] || candidate.status)}</span>
          </div>
          <dl class="admin-learning-metrics">
            <div><dt>예약</dt><dd>${Number(evidence.metric_value || 0)}건</dd></div>
            <div><dt>고객</dt><dd>${Number(payload.distinct_customers || 0)}명</dd></div>
            <div><dt>활동 주</dt><dd>${Number(payload.active_weeks || 0)}주</dd></div>
            <div><dt>순매출</dt><dd>${formatCurrency(payload.net_revenue)}</dd></div>
            <div class="admin-learning-confidence"><dt>신뢰도</dt><dd><strong>${confidence}%</strong><span><i style="width:${confidence}%"></i></span></dd></div>
          </dl>
          <div class="admin-learning-window">관찰 기간 ${escapeHtml(candidate.evidence_window_start)} ~ ${escapeHtml(candidate.evidence_window_end)}</div>
          ${['promoted', 'validated', 'invalidated'].includes(candidate.status) ? evidenceValidationView : ''}
          ${reviewPanel}
          <div class="admin-learning-next-action">
            ${candidate.status === 'approved' && candidate.ai_analysis_status !== 'completed' ? `<div><strong>다음 단계</strong><span>승인된 근거를 KB 문서 초안으로 정리합니다.</span></div><button type="button" class="admin-btn" data-learning-create-draft>KB 초안 생성</button>` : ''}
            ${candidate.status === 'approved' && candidate.ai_analysis_status === 'completed' ? `<div><strong>최종 확인</strong><span>초안을 확인한 뒤 Knowledge Base에 반영하세요.</span></div>${promotionControl}` : ''}
            ${candidate.status === 'promoted' ? `<div><strong>KB 반영 완료</strong><span>근거 검증과 별개로 7·14·28일에 반영 결과를 추적합니다.</span></div>${promotionControl}` : ''}
            ${candidate.status === 'validated' ? `<div><strong>가설 검증 완료</strong><span>실제 반복 예약 수요로 확인됐습니다.</span></div>${promotionControl}` : ''}
            ${candidate.status === 'invalidated' ? `<div><strong>가설 검증 실패</strong><span>KB 내용을 재검토하거나 보완해야 합니다.</span></div>${promotionControl}` : ''}
          </div>
          ${checkpointView}
          ${draft}
          ${reviewHistory}
        </article>`;
    }).join('');

    listNode.innerHTML = `
      <div class="admin-learning-overview">
        <div><span>전체 후보</span><strong>${candidates.length}</strong></div>
        <div><span>검토 대기</span><strong>${Number(counts.detected || 0)}</strong></div>
        <div><span>승인·초안</span><strong>${Number(counts.approved || 0)}</strong></div>
        <div><span>KB 반영</span><strong>${Number(counts.promoted || 0) + Number(counts.validated || 0) + Number(counts.invalidated || 0)}</strong></div>
      </div>
      <div class="admin-learning-flow" aria-label="학습 후보 처리 단계">
        <span>1 근거 확인</span><i>→</i><span>2 승인</span><i>→</i><span>3 KB 초안</span><i>→</i><span>4 직접 반영</span>
      </div>
      <div class="admin-learning-list">${cards}</div>`;
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
    const promoteButton = event.target.closest('[data-learning-promote]');
    if (promoteButton) {
      const card = promoteButton.closest('[data-learning-candidate-id]');
      const candidateId = card?.dataset.learningCandidateId;
      if (!candidateId || !window.confirm('검토한 초안을 knowledge-base main에 직접 반영할까요? GitHub commit 이력은 보존됩니다.')) return;
      if (card.dataset.learningSaving === 'true') return;
      card.dataset.learningSaving = 'true';
      promoteButton.disabled = true;
      showStatus('Knowledge Base에 직접 반영하는 중입니다.', 'success');
      const client = window.barunjariAdmin?.client;
      const { data, error } = await client.functions.invoke('learning-detector', {
        body: { action: 'promote', candidate_id: candidateId }
      });
      if (error || !data?.ok) {
        delete card.dataset.learningSaving;
        promoteButton.disabled = false;
        const reason = data?.error === 'github_token_not_configured' ? 'GitHub 연결 키가 아직 설정되지 않았습니다.' : (data?.error || error?.message || '알 수 없는 오류');
        showStatus(`KB에 반영하지 못했습니다. (${reason})`, 'error');
        return;
      }
      showStatus('Knowledge Base 반영과 감사 이력 저장을 완료했습니다.', 'success');
      await loadCandidates();
      return;
    }
    const draftButton = event.target.closest('[data-learning-create-draft]');
    if (draftButton) {
      const card = draftButton.closest('[data-learning-candidate-id]');
      const candidateId = card?.dataset.learningCandidateId;
      if (!candidateId) return;
      if (card.dataset.learningSaving === 'true') return;
      card.dataset.learningSaving = 'true';
      draftButton.disabled = true;
      showStatus('Knowledge Base 반영 초안을 생성하는 중입니다.', 'success');
      const client = window.barunjariAdmin?.client;
      const { data, error } = await client.functions.invoke('learning-detector', {
        body: { action: 'draft', candidate_id: candidateId }
      });
      if (error || !data?.ok) {
        delete card.dataset.learningSaving;
        draftButton.disabled = false;
        showStatus(`초안을 생성하지 못했습니다. (${data?.error || error?.message || '알 수 없는 오류'})`, 'error');
        return;
      }
      showStatus('Knowledge Base 반영 초안을 저장했습니다.', 'success');
      await loadCandidates();
      return;
    }
    const button = event.target.closest('[data-learning-review-decision]');
    if (!button) return;
    const card = button.closest('[data-learning-candidate-id]');
    const candidateId = card?.dataset.learningCandidateId;
    const decision = button.dataset.learningReviewDecision;
    const note = card?.querySelector('[data-learning-review-note]')?.value || '';
    if (!candidateId || !decision) return;
    if (decision === 'rejected' && !window.confirm('이 학습 후보를 기각할까요? 판단 이력은 보존됩니다.')) return;
    if (card.dataset.learningSaving === 'true') return;
    card.dataset.learningSaving = 'true';

    const buttons = card.querySelectorAll('[data-learning-review-decision]');
    buttons.forEach((node) => { node.disabled = true; });
    showStatus(`${decisionLabels[decision]} 판단을 저장하는 중입니다.`, 'success');
    const client = window.barunjariAdmin?.client;
    const { data, error } = await client.functions.invoke('learning-detector', {
      body: { action: 'review', candidate_id: candidateId, decision, note }
    });
    if (error || !data?.ok) {
      delete card.dataset.learningSaving;
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
