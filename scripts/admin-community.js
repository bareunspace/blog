(() => {
  const root = document.getElementById('adminCommunityApplications');

  if (!root) {
    return;
  }

  const listNode = root.querySelector('[data-community-admin-list]');
  const statusNode = root.querySelector('[data-community-admin-status]');
  const refreshButton = root.querySelector('[data-community-admin-refresh]');
  const statusFilter = root.querySelector('[data-community-admin-status-filter]');
  const typeFilter = root.querySelector('[data-community-admin-type-filter]');
  const groupFilter = root.querySelector('[data-community-admin-group-filter]');
  const statsNode = root.querySelector('[data-community-admin-stats]');
  let allRows = [];

  const labels = {
    interest: '관심 등록',
    host: '모임 시작',
    existing_group: '기존 모임 등록',
    interview: '면접 준비',
    reading: '독서모임',
    ai: 'AI 사용',
    other: '기타',
    new: '새 신청',
    reviewing: '검토 중',
    contacted: '연락 완료',
    matched: '매칭/진행',
    closed: '종료'
  };

  const showStatus = (message, kind = 'info') => {
    if (!statusNode) {
      return;
    }
    statusNode.textContent = message;
    statusNode.hidden = false;
    statusNode.classList.remove('is-error', 'is-success');
    if (kind === 'error') {
      statusNode.classList.add('is-error');
    }
    if (kind === 'success') {
      statusNode.classList.add('is-success');
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return '';
    }
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  };

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const renderEmpty = () => {
    if (!listNode) {
      return;
    }
    listNode.innerHTML = '<p class="admin-empty">아직 커뮤니티 신청이 없습니다.</p>';
  };

  const renderStats = (rows) => {
    if (!statsNode) {
      return;
    }

    const counts = rows.reduce((acc, row) => {
      acc.total += 1;
      acc.status[row.status] = (acc.status[row.status] || 0) + 1;
      if (row.application_type === 'interest') {
        acc.interest[row.group_key] = (acc.interest[row.group_key] || 0) + 1;
      }
      return acc;
    }, {
      total: 0,
      status: {},
      interest: {}
    });

    statsNode.innerHTML = [
      ['total', '전체 신청', counts.total],
      ['interest-interview', '면접 관심', counts.interest.interview || 0],
      ['interest-reading', '독서 관심', counts.interest.reading || 0],
      ['interest-ai', 'AI 관심', counts.interest.ai || 0],
      ['new', labels.new, counts.status.new || 0]
    ].map(([key, label, count]) => `
      <div class="admin-stat admin-stat-${key}">
        <span>${escapeHtml(label)}</span>
        <strong>${count}</strong>
      </div>
    `).join('');
  };

  const getVisibleRows = () => {
    const selectedStatus = statusFilter?.value || 'all';
    const selectedType = typeFilter?.value || 'all';
    const selectedGroup = groupFilter?.value || 'all';

    return allRows.filter((row) => {
      return (selectedStatus === 'all' || row.status === selectedStatus)
        && (selectedType === 'all' || row.application_type === selectedType)
        && (selectedGroup === 'all' || row.group_key === selectedGroup);
    });
  };

  const renderVisibleRows = () => {
    const visibleRows = getVisibleRows();
    renderRows(visibleRows);
    if (allRows.length) {
      showStatus(`조건에 맞는 신청 ${visibleRows.length}건을 표시합니다.`, 'success');
    }
  };

  const renderRows = (rows) => {
    if (!listNode) {
      return;
    }

    if (!rows.length) {
      renderEmpty();
      return;
    }

    listNode.innerHTML = rows.map((row) => `
      <article class="admin-community-item admin-community-item-${escapeHtml(row.status)}" data-application-id="${row.id}">
        <div class="admin-community-item-head">
          <div>
            <p class="admin-community-eyebrow">${escapeHtml(labels[row.application_type] || row.application_type)} · ${escapeHtml(labels[row.group_key] || row.group_key)}</p>
            <h3>${escapeHtml(row.group_title)}</h3>
          </div>
          <span class="admin-community-status admin-community-status-${escapeHtml(row.status)}">${escapeHtml(labels[row.status] || row.status)}</span>
        </div>
        <dl class="admin-community-meta">
          <div><dt>신청자</dt><dd>${escapeHtml(row.applicant_name)}</dd></div>
          <div><dt>이메일</dt><dd><a href="mailto:${escapeHtml(row.contact_email)}">${escapeHtml(row.contact_email)}</a></dd></div>
          <div><dt>전화</dt><dd>${escapeHtml(row.contact_phone || '-')}</dd></div>
          <div><dt>가능 일정</dt><dd>${escapeHtml(row.availability || '-')}</dd></div>
          <div><dt>신청일</dt><dd>${escapeHtml(formatDate(row.created_at))}</dd></div>
        </dl>
        ${row.existing_group_summary ? `<p class="admin-community-message"><strong>기존 모임</strong>${escapeHtml(row.existing_group_summary)}</p>` : ''}
        ${row.message ? `<p class="admin-community-message"><strong>메시지</strong>${escapeHtml(row.message)}</p>` : ''}
        <label class="admin-community-status-control">
          상태
          <select data-community-status-select>
            ${['new', 'reviewing', 'contacted', 'matched', 'closed'].map((status) => `
              <option value="${status}" ${row.status === status ? 'selected' : ''}>${labels[status]}</option>
            `).join('')}
          </select>
        </label>
      </article>
    `).join('');
  };

  const loadApplications = async () => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client) {
      showStatus('관리자 인증 정보를 기다리는 중입니다.');
      return;
    }

    showStatus('커뮤니티 신청을 불러오는 중입니다.', 'success');

    const { data, error } = await client
      .from('community_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      showStatus('커뮤니티 신청을 불러오지 못했습니다. Supabase 정책 또는 마이그레이션을 확인해 주세요.', 'error');
      return;
    }

    allRows = data || [];
    renderStats(allRows);
    renderVisibleRows();
  };

  const updateStatus = async (item, nextStatus) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    const id = item?.dataset?.applicationId;

    if (!client || !id) {
      return;
    }

    const { error } = await client
      .from('community_applications')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      showStatus('상태를 변경하지 못했습니다.', 'error');
      return;
    }

    const badge = item.querySelector('.admin-community-status');
    if (badge) {
      badge.textContent = labels[nextStatus] || nextStatus;
      badge.className = `admin-community-status admin-community-status-${nextStatus}`;
    }
    const row = allRows.find((item) => String(item.id) === String(id));
    if (row) {
      row.status = nextStatus;
    }
    item.className = `admin-community-item admin-community-item-${nextStatus}`;
    renderStats(allRows);
    showStatus('상태가 저장되었습니다.', 'success');
  };

  listNode?.addEventListener('change', (event) => {
    const select = event.target.closest('[data-community-status-select]');
    if (!select) {
      return;
    }
    updateStatus(select.closest('[data-application-id]'), select.value);
  });

  statusFilter?.addEventListener('change', renderVisibleRows);
  typeFilter?.addEventListener('change', renderVisibleRows);
  groupFilter?.addEventListener('change', renderVisibleRows);
  refreshButton?.addEventListener('click', loadApplications);
  window.addEventListener('barunjari:admin-ready', loadApplications);

  if (window.barunjariAdmin?.client) {
    loadApplications();
  }
})();
