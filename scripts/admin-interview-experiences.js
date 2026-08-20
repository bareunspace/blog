(() => {
  const root = document.getElementById('adminInterviewExperiencesRoot');
  if (!root) return;

  const listNode = root.querySelector('[data-interview-admin-list]');
  const statusNode = root.querySelector('[data-interview-admin-status]');
  const statusFilter = root.querySelector('[data-interview-admin-status-filter]');
  const publicFilter = root.querySelector('[data-interview-admin-public-filter]');
  const queryFilter = root.querySelector('[data-interview-admin-query-filter]');
  const refreshButton = root.querySelector('[data-interview-admin-refresh]');
  const statPending = root.querySelector('[data-interview-stat-pending]');
  const statApproved = root.querySelector('[data-interview-stat-approved]');
  const statPublic = root.querySelector('[data-interview-stat-public]');
  const statRejected = root.querySelector('[data-interview-stat-rejected]');

  const resultLabels = {
    passed: '합격',
    rejected: '불합격',
    next_stage: '다음 전형 진행',
    pending: '결과 대기',
    undisclosed: '결과 비공개'
  };

  const actionLabels = {
    general_qa: '일반 문답',
    experience_explanation: '경험 설명',
    pt_presentation: 'PT·발표',
    task_explanation: '과제·작업 설명',
    situational_response: '상황 대응',
    video_ai: '영상·AI',
    other: '기타'
  };

  const prepLabels = {
    self_intro: '자기소개',
    experience_examples: '경험 정리',
    ai_answer_practice: 'AI 답변 연습',
    hiring_process_check: '전형 확인',
    full_rehearsal: '실전 리허설',
    final_check: '직전 점검',
    other: '기타 준비'
  };

  const moderationLabels = {
    pending: '새 경험',
    approved: '검토 완료',
    rejected: '제외'
  };

  let client = null;
  let allRows = [];
  let initialized = false;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const showStatus = (message, kind = 'info') => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.hidden = !message;
    statusNode.classList.remove('is-error', 'is-success');
    if (kind === 'error') statusNode.classList.add('is-error');
    if (kind === 'success') statusNode.classList.add('is-success');
  };

  const renderTags = (values, labels) => {
    if (!Array.isArray(values) || !values.length) return '<span class="interview-admin-empty-inline">없음</span>';
    return values.map((value) => `<span class="interview-admin-tag">${escapeHtml(labels[value] || value)}</span>`).join('');
  };

  const updateStats = () => {
    const pending = allRows.filter((row) => row.moderation_status === 'pending').length;
    const approved = allRows.filter((row) => row.moderation_status === 'approved').length;
    const publicApproved = allRows.filter((row) => row.moderation_status === 'approved' && row.public_consent && row.published_at).length;
    const rejected = allRows.filter((row) => row.moderation_status === 'rejected').length;
    if (statPending) statPending.textContent = String(pending);
    if (statApproved) statApproved.textContent = String(approved);
    if (statPublic) statPublic.textContent = String(publicApproved);
    if (statRejected) statRejected.textContent = String(rejected);
  };

  const getFilteredRows = () => {
    const statusValue = statusFilter?.value || 'pending';
    const publicValue = publicFilter?.value || 'all';
    const query = String(queryFilter?.value || '').trim().toLowerCase();
    return allRows.filter((row) => {
      if (statusValue !== 'all' && row.moderation_status !== statusValue) return false;
      if (publicValue === 'yes' && !row.public_consent) return false;
      if (publicValue === 'no' && row.public_consent) return false;
      if (query) {
        const haystack = [row.company_name, row.job_role, row.helpful_preparation, row.unexpected_point, row.public_excerpt]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  };

  const render = () => {
    if (!listNode) return;
    updateStats();
    const rows = getFilteredRows();
    if (!rows.length) {
      listNode.innerHTML = '<p class="admin-empty">조건에 맞는 면접 경험이 없습니다.</p>';
      return;
    }

    listNode.innerHTML = rows.map((row) => {
      const publicAllowed = Boolean(row.public_consent);
      const isPublic = row.moderation_status === 'approved' && publicAllowed && Boolean(row.published_at);
      const company = row.company_name || '기업 미입력';
      const role = row.job_role || '직무 미입력';
      const approvalLabel = publicAllowed ? '공개용으로 승인' : '검토 완료';
      const approvalHint = publicAllowed
        ? '공개 동의가 있습니다. 공개용 문구를 확인한 뒤 승인하면 공개 후보가 됩니다.'
        : '공개 동의가 없으므로 내부 분석용으로만 보관합니다.';
      const publicEditor = publicAllowed ? `
        <div class="interview-admin-editor interview-admin-public-editor">
          <label class="admin-field"><span>공개용 기업 표시 <small>예: IT 기업 / 반도체 기업</small></span><input type="text" maxlength="80" data-field="public_company_label" value="${escapeHtml(row.public_company_label || '')}" placeholder="필요할 때만 익명화"></label>
          <label class="admin-field"><span>공개용 경험 문구</span><textarea rows="4" maxlength="500" data-field="public_excerpt" placeholder="식별 가능한 내용을 빼고 핵심 경험만 정리">${escapeHtml(row.public_excerpt || '')}</textarea></label>
        </div>` : `
        <input type="hidden" data-field="public_company_label" value="${escapeHtml(row.public_company_label || '')}">
        <textarea data-field="public_excerpt" hidden>${escapeHtml(row.public_excerpt || '')}</textarea>`;

      return `
        <article class="interview-admin-card" data-interview-row="${row.id}">
          <div class="interview-admin-card-head">
            <div>
              <p class="interview-admin-meta">#${row.id} · ${escapeHtml(formatDate(row.created_at))}</p>
              <h3>${escapeHtml(company)} <span>· ${escapeHtml(role)}</span></h3>
            </div>
            <div class="interview-admin-badges">
              <span class="interview-admin-state is-${escapeHtml(row.moderation_status)}">${escapeHtml(moderationLabels[row.moderation_status] || row.moderation_status)}</span>
              <span class="interview-admin-consent ${publicAllowed ? 'is-yes' : 'is-no'}">공개 동의 ${publicAllowed ? '있음' : '없음'}</span>
              ${isPublic ? '<span class="interview-admin-live">공개 후보</span>' : ''}
            </div>
          </div>

          <div class="interview-admin-scan-row">
            <div><span>결과</span><strong>${escapeHtml(resultLabels[row.result] || row.result || '-')}</strong></div>
            <div><span>실제 면접에서 요구받은 것</span><div class="interview-admin-tags">${renderTags(row.interview_actions, actionLabels)}</div></div>
          </div>

          <details class="interview-admin-details">
            <summary>상세 보기</summary>
            <div class="interview-admin-detail-body">
              <div class="interview-admin-facts">
                <div><span>준비하면서 해본 것</span><div class="interview-admin-tags">${renderTags(row.preparation_actions, prepLabels)}</div></div>
              </div>

              <div class="interview-admin-copy-grid">
                <div class="interview-admin-original"><span>가장 도움 됐던 준비</span><p>${escapeHtml(row.helpful_preparation || '작성 없음')}</p></div>
                <div class="interview-admin-original"><span>예상과 달랐던 점</span><p>${escapeHtml(row.unexpected_point || '작성 없음')}</p></div>
              </div>

              ${publicEditor}
              <div class="interview-admin-editor interview-admin-note-editor">
                <label class="admin-field"><span>관리자 메모 <small>외부에 공개되지 않음</small></span><textarea rows="2" data-field="admin_note" placeholder="필요한 경우만 기록">${escapeHtml(row.admin_note || '')}</textarea></label>
              </div>

              <p class="interview-admin-approval-hint">${escapeHtml(approvalHint)}</p>
              <div class="interview-admin-actions">
                <button type="button" class="admin-btn admin-btn-outline" data-action="save">저장</button>
                <button type="button" class="admin-btn" data-action="approve">${escapeHtml(approvalLabel)}</button>
                <button type="button" class="admin-btn admin-btn-danger" data-action="reject">제외</button>
                ${row.moderation_status !== 'pending' ? '<button type="button" class="admin-btn admin-btn-outline" data-action="pending">새 경험으로 되돌리기</button>' : ''}
              </div>
              <p class="admin-status interview-admin-card-status" data-card-status hidden></p>
            </div>
          </details>
        </article>`;
    }).join('');
  };

  const readCardFields = (card) => ({
    public_company_label: String(card.querySelector('[data-field="public_company_label"]')?.value || '').trim() || null,
    public_excerpt: String(card.querySelector('[data-field="public_excerpt"]')?.value || '').trim() || null,
    admin_note: String(card.querySelector('[data-field="admin_note"]')?.value || '').trim() || null
  });

  const showCardStatus = (card, message, kind = 'info') => {
    const node = card.querySelector('[data-card-status]');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    node.classList.remove('is-error', 'is-success');
    if (kind === 'error') node.classList.add('is-error');
    if (kind === 'success') node.classList.add('is-success');
  };

  const updateRow = async (id, patch) => {
    const { data, error } = await client
      .from('interview_experiences')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    allRows = allRows.map((row) => row.id === id ? data : row);
    return data;
  };

  const handleAction = async (button) => {
    const card = button.closest('[data-interview-row]');
    if (!card || !client) return;
    const id = Number(card.dataset.interviewRow);
    const row = allRows.find((item) => item.id === id);
    if (!row) return;
    const action = button.dataset.action;
    const fields = readCardFields(card);
    const buttons = Array.from(card.querySelectorAll('button'));
    buttons.forEach((item) => { item.disabled = true; });

    try {
      if (action === 'save') {
        await updateRow(id, fields);
        showCardStatus(card, '저장했습니다.', 'success');
      }

      if (action === 'approve') {
        if (row.public_consent && !fields.public_excerpt) {
          showCardStatus(card, '공개용 경험 문구를 먼저 작성해 주세요.', 'error');
          return;
        }
        await updateRow(id, {
          ...fields,
          moderation_status: 'approved',
          published_at: row.public_consent ? (row.published_at || new Date().toISOString()) : null
        });
        showStatus(row.public_consent ? '공개용 경험으로 승인했습니다.' : '검토 완료 처리했습니다.', 'success');
        render();
      }

      if (action === 'reject') {
        await updateRow(id, {
          ...fields,
          moderation_status: 'rejected',
          published_at: null
        });
        showStatus('제외 처리했습니다.', 'success');
        render();
      }

      if (action === 'pending') {
        await updateRow(id, {
          ...fields,
          moderation_status: 'pending',
          published_at: null
        });
        showStatus('새 경험 상태로 되돌렸습니다.', 'success');
        render();
      }
    } catch (error) {
      console.error('Interview experience admin action failed', error);
      showCardStatus(card, `저장하지 못했습니다. ${error?.message || ''}`.trim(), 'error');
    } finally {
      buttons.forEach((item) => { item.disabled = false; });
    }
  };

  const loadRows = async () => {
    if (!client) return;
    showStatus('면접 경험을 불러오는 중입니다.');
    const { data, error } = await client
      .from('interview_experiences')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('Interview experience admin load failed', error);
      showStatus(`목록을 불러오지 못했습니다. ${error.message || ''}`.trim(), 'error');
      return;
    }
    allRows = Array.isArray(data) ? data : [];
    showStatus(`면접 경험 ${allRows.length}건`, 'success');
    render();
  };

  const init = async () => {
    if (initialized) return;
    const admin = window.barunjariAdmin;
    if (!admin?.client) return;
    initialized = true;
    client = admin.client;

    statusFilter?.addEventListener('change', render);
    publicFilter?.addEventListener('change', render);
    queryFilter?.addEventListener('input', render);
    refreshButton?.addEventListener('click', loadRows);
    listNode?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (button) handleAction(button);
    });

    await loadRows();
  };

  window.addEventListener('barunjari:admin-ready', init, { once: true });
  if (window.barunjariAdmin?.client) init();
})();
