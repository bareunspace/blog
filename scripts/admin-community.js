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
  const groupsRoot = document.getElementById('adminCommunityGroups');
  const groupForm = groupsRoot?.querySelector('[data-community-group-form]');
  const groupsListNode = groupsRoot?.querySelector('[data-community-groups-list]');
  const groupsStatusNode = groupsRoot?.querySelector('[data-community-groups-status]');
  let allRows = [];
  let allGroups = [];

  const labels = {
    interest: '참여 관심',
    host: '모임장 신청',
    existing_group: '기존 모임 등록',
    interview: '면접 준비',
    reading: '독서모임',
    ai: 'AI 사용',
    other: '기타',
    new: '새 신청',
    reviewing: '검토 중',
    contacted: '연락 완료',
    matched: '매칭/진행',
    closed: '종료',
    draft: '준비 중',
    recruiting: '모집 중',
    scheduled: '일정 확정'
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

  const showGroupsStatus = (message, kind = 'info') => {
    if (!groupsStatusNode) {
      return;
    }
    groupsStatusNode.textContent = message;
    groupsStatusNode.hidden = false;
    groupsStatusNode.classList.remove('is-error', 'is-success');
    if (kind === 'error') {
      groupsStatusNode.classList.add('is-error');
    }
    if (kind === 'success') {
      groupsStatusNode.classList.add('is-success');
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
          <div><dt>대상 모임</dt><dd>${escapeHtml(row.target_group_id || '-')}</dd></div>
        </dl>
        ${row.existing_group_summary ? `<p class="admin-community-message"><strong>기존 모임</strong>${escapeHtml(row.existing_group_summary)}</p>` : ''}
        ${row.message ? `<p class="admin-community-message"><strong>메시지</strong>${escapeHtml(row.message)}</p>` : ''}
        <div class="admin-community-card-actions">
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-edit-application>수정</button>
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-create-group-from-application>모임 만들기</button>
          <button class="admin-btn admin-btn-danger admin-btn-small" type="button" data-delete-application>신청 삭제</button>
          <label class="admin-community-status-control">
            상태
            <select data-community-status-select>
              ${['new', 'reviewing', 'contacted', 'matched', 'closed'].map((status) => `
                <option value="${status}" ${row.status === status ? 'selected' : ''}>${labels[status]}</option>
              `).join('')}
            </select>
          </label>
        </div>
      </article>
    `).join('');
  };

  const renderGroups = (groups) => {
    if (!groupsListNode) {
      return;
    }

    if (!groups.length) {
      groupsListNode.innerHTML = '<p class="admin-empty">아직 만들어진 모임이 없습니다.</p>';
      return;
    }

    groupsListNode.innerHTML = groups.map((group) => `
      <article class="admin-community-item admin-group-item" data-group-id="${group.id}">
        <div class="admin-community-item-head">
          <div>
            <p class="admin-community-eyebrow">${escapeHtml(labels[group.group_key] || group.group_key)} · ${escapeHtml(labels[group.status] || group.status)}</p>
            <h3>${escapeHtml(group.title)}</h3>
          </div>
          <span class="admin-community-status admin-community-status-${escapeHtml(group.status)}">${escapeHtml(labels[group.status] || group.status)}</span>
        </div>
        <dl class="admin-community-meta">
          <div><dt>일정</dt><dd>${escapeHtml(group.schedule_text || '-')}</dd></div>
          <div><dt>정원</dt><dd>${escapeHtml(group.capacity || '-')}</dd></div>
          <div><dt>모임장</dt><dd>${escapeHtml(group.host_name || '-')}</dd></div>
          <div><dt>오픈채팅</dt><dd>${group.open_chat_url ? '저장됨' : '-'}</dd></div>
          <div><dt>생성일</dt><dd>${escapeHtml(formatDate(group.created_at))}</dd></div>
          <div><dt>신청 ID</dt><dd>${escapeHtml(group.source_application_id || '-')}</dd></div>
        </dl>
        ${group.description ? `<p class="admin-community-message"><strong>설명</strong>${escapeHtml(group.description)}</p>` : ''}
        <div class="admin-community-card-actions">
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-copy-open-chat-message ${group.open_chat_url ? '' : 'disabled'}>안내문 복사</button>
          <label class="admin-community-status-control">
            운영 상태
            <select data-community-group-status-select>
              ${['draft', 'recruiting', 'scheduled', 'closed'].map((status) => `
                <option value="${status}" ${group.status === status ? 'selected' : ''}>${labels[status]}</option>
              `).join('')}
            </select>
          </label>
        </div>
      </article>
    `).join('');
  };

  const loadGroups = async () => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client || !groupsRoot) {
      return;
    }

    showGroupsStatus('모임 목록을 불러오는 중입니다.', 'success');

    const { data, error } = await client
      .from('community_groups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      showGroupsStatus('모임 목록을 불러오지 못했습니다. migration 적용 상태를 확인해 주세요.', 'error');
      return;
    }

    allGroups = data || [];
    renderGroups(allGroups);
    showGroupsStatus(`모임 ${allGroups.length}개를 불러왔습니다.`, 'success');
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

  const editApplication = async (item) => {
    const id = item?.dataset?.applicationId;
    const row = allRows.find((entry) => String(entry.id) === String(id));

    if (!row) {
      return;
    }

    const nextMessage = window.prompt('신청 메모를 수정하세요.', row.message || '');
    if (nextMessage === null) {
      return;
    }

    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    if (!client) {
      showStatus('관리자 인증 정보를 기다리는 중입니다.', 'error');
      return;
    }

    const { error } = await client
      .from('community_applications')
      .update({ message: nextMessage })
      .eq('id', id);

    if (error) {
      showStatus('신청 내용을 수정하지 못했습니다.', 'error');
      return;
    }

    row.message = nextMessage;
    renderVisibleRows();
    showStatus('신청 내용이 수정되었습니다.', 'success');
  };

  const deleteApplication = async (item) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    const id = item?.dataset?.applicationId;

    if (!client || !id) {
      return;
    }

    const confirmed = window.confirm('이 신청 내역을 영구 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.');
    if (!confirmed) {
      return;
    }

    showStatus('신청을 삭제하는 중입니다.', 'success');

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'delete',
        applicationId: id
      }
    });

    if (error || !data?.ok) {
      showStatus('신청을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
      return;
    }

    allRows = allRows.filter((row) => String(row.id) !== String(id));
    renderStats(allRows);
    renderVisibleRows();
    showStatus('신청 내역이 삭제되었습니다.', 'success');
  };

  const updateGroupStatus = async (item, nextStatus) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    const id = item?.dataset?.groupId;

    if (!client || !id) {
      return;
    }

    const { error } = await client
      .from('community_groups')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      showGroupsStatus('모임 상태를 변경하지 못했습니다.', 'error');
      return;
    }

    const group = allGroups.find((item) => String(item.id) === String(id));
    if (group) {
      group.status = nextStatus;
    }
    renderGroups(allGroups);
    showGroupsStatus('모임 상태가 저장되었습니다.', 'success');
  };

  const prefillGroupForm = (applicationId) => {
    if (!groupForm) {
      return;
    }

    const row = allRows.find((item) => String(item.id) === String(applicationId));
    if (!row) {
      return;
    }

    groupForm.elements.title.value = row.group_title || '';
    groupForm.elements.group_key.value = row.group_key || 'other';
    groupForm.elements.status.value = 'draft';
    groupForm.elements.host_name.value = row.application_type === 'host' ? row.applicant_name : '';
    groupForm.elements.schedule_text.value = row.availability || '';
    groupForm.elements.open_chat_url.value = '';
    groupForm.elements.description.value = [row.existing_group_summary, row.message].filter(Boolean).join('\n\n');
    groupForm.elements.source_application_id.value = row.id;
    groupsRoot?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showGroupsStatus('신청 내용으로 모임 만들기 양식을 채웠습니다.', 'success');
  };

  const createGroup = async (event) => {
    event.preventDefault();

    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client || !groupForm) {
      return;
    }

    const formData = new FormData(groupForm);
    const capacityValue = String(formData.get('capacity') || '').trim();
    const sourceApplicationId = String(formData.get('source_application_id') || '').trim();
    const payload = {
      title: String(formData.get('title') || '').trim(),
      group_key: String(formData.get('group_key') || 'other').trim(),
      status: String(formData.get('status') || 'draft').trim(),
      schedule_text: String(formData.get('schedule_text') || '').trim() || null,
      capacity: capacityValue ? Number(capacityValue) : null,
      host_name: String(formData.get('host_name') || '').trim() || null,
      open_chat_url: String(formData.get('open_chat_url') || '').trim() || null,
      description: String(formData.get('description') || '').trim() || null,
      source_application_id: sourceApplicationId ? Number(sourceApplicationId) : null
    };

    if (!payload.title) {
      showGroupsStatus('모임 이름을 입력해 주세요.', 'error');
      return;
    }

    showGroupsStatus('모임을 저장하는 중입니다.', 'success');

    const { error } = await client
      .from('community_groups')
      .insert(payload);

    if (error) {
      showGroupsStatus('모임을 저장하지 못했습니다.', 'error');
      return;
    }

    groupForm.reset();
    await loadGroups();
    showGroupsStatus('모임을 만들었습니다.', 'success');
  };

  const copyOpenChatMessage = async (groupId) => {
    const group = allGroups.find((item) => String(item.id) === String(groupId));
    if (!group?.open_chat_url) {
      showGroupsStatus('저장된 오픈채팅 링크가 없습니다.', 'error');
      return;
    }

    const message = [
      `[바른자리 커뮤니티] ${group.title} 안내드립니다.`,
      '',
      `일정: ${group.schedule_text || '개별 안내'}`,
      `장소: 바른자리`,
      '',
      '아래 오픈채팅에 입장해 주세요.',
      group.open_chat_url,
      '',
      '오픈채팅 링크는 신청자에게만 안내드립니다.'
    ].join('\n');

    try {
      await navigator.clipboard.writeText(message);
      showGroupsStatus('오픈채팅 안내문을 복사했습니다.', 'success');
    } catch (error) {
      showGroupsStatus('복사하지 못했습니다. 브라우저 권한을 확인해 주세요.', 'error');
    }
  };

  listNode?.addEventListener('change', (event) => {
    const select = event.target.closest('[data-community-status-select]');
    if (!select) {
      return;
    }
    updateStatus(select.closest('[data-application-id]'), select.value);
  });

  listNode?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-application]');
    if (editButton) {
      const item = editButton.closest('[data-application-id]');
      editApplication(item);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-application]');
    if (deleteButton) {
      const item = deleteButton.closest('[data-application-id]');
      deleteApplication(item);
      return;
    }

    const button = event.target.closest('[data-create-group-from-application]');
    if (!button) {
      return;
    }
    const item = button.closest('[data-application-id]');
    prefillGroupForm(item?.dataset?.applicationId);
  });

  groupsListNode?.addEventListener('change', (event) => {
    const select = event.target.closest('[data-community-group-status-select]');
    if (!select) {
      return;
    }
    updateGroupStatus(select.closest('[data-group-id]'), select.value);
  });

  groupsListNode?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-copy-open-chat-message]');
    if (!button) {
      return;
    }
    const item = button.closest('[data-group-id]');
    copyOpenChatMessage(item?.dataset?.groupId);
  });

  groupForm?.addEventListener('submit', createGroup);

  statusFilter?.addEventListener('change', renderVisibleRows);
  typeFilter?.addEventListener('change', renderVisibleRows);
  groupFilter?.addEventListener('change', renderVisibleRows);
  refreshButton?.addEventListener('click', loadApplications);
  window.addEventListener('barunjari:admin-ready', () => {
    loadGroups();
    loadApplications();
  });

  if (window.barunjariAdmin?.client) {
    loadGroups();
    loadApplications();
  }
})();
