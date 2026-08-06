(() => {
  const root = document.getElementById('adminDashboardRoot');

  if (!root) {
    return;
  }

  const applicationsRoot = document.getElementById('adminCommunityApplications');
  const groupsRoot = document.getElementById('adminCommunityGroups');

  if (!applicationsRoot || !groupsRoot) {
    return;
  }

  const listNode = applicationsRoot.querySelector('[data-community-admin-list]');
  const statusNode = applicationsRoot.querySelector('[data-community-admin-status]');
  const editPanel = applicationsRoot.querySelector('[data-community-edit-panel]');
  const editForm = applicationsRoot.querySelector('[data-community-edit-form]');
  const groupEditPanel = groupsRoot?.querySelector('[data-community-group-edit-panel]');
  const groupEditForm = groupsRoot?.querySelector('[data-community-group-edit-form]');
  const groupCreatePanel = groupsRoot?.querySelector('[data-community-group-create-panel]');
  const groupCreateToggle = groupsRoot?.querySelector('[data-community-group-create-toggle]');
  const groupCreateCancelButtons = groupsRoot?.querySelectorAll('[data-community-group-create-cancel]') || [];
  const cancelEditButtons = applicationsRoot.querySelectorAll('[data-community-edit-cancel]');
  const cancelGroupEditButtons = groupsRoot?.querySelectorAll('[data-community-group-edit-cancel]') || [];
  const refreshButton = applicationsRoot.querySelector('[data-community-admin-refresh]');
  const statusFilter = applicationsRoot.querySelector('[data-community-admin-status-filter]');
  const typeFilter = applicationsRoot.querySelector('[data-community-admin-type-filter]');
  const groupFilter = applicationsRoot.querySelector('[data-community-admin-group-filter]');
  const statsNode = applicationsRoot.querySelector('[data-community-admin-stats]');
  const reportsStatusNode = root.querySelector('[data-community-reports-status]');
  const reportsListNode = root.querySelector('[data-community-reports-list]');
  const groupForm = groupsRoot?.querySelector('[data-community-group-form]');
  const groupsListNode = groupsRoot?.querySelector('[data-community-groups-list]');
  const groupsStatusNode = groupsRoot?.querySelector('[data-community-groups-status]');
  const workspaceTabs = Array.from(root.querySelectorAll('[data-admin-workspace-tab]'));
  const workspacePanels = Array.from(root.querySelectorAll('[data-admin-workspace-panel]'));
  const overviewPendingNode = root.querySelector('[data-admin-overview-pending]');
  const overviewNewNode = root.querySelector('[data-admin-overview-new]');
  const overviewGroupsNode = root.querySelector('[data-admin-overview-groups]');
  const overviewActiveGroupsNode = root.querySelector('[data-admin-overview-active-groups]');
  let allRows = [];
  let allGroups = [];
  let allReports = [];

  const labels = {
    interest: '참여 관심',
    host: '모임장 신청',
    existing_group: '기존 모임 등록',
    interview: '면접 준비',
    reading: '소모임',
    ai: 'AI 사용',
    other: '기타',
    new: '새 신청',
    reviewing: '검토 중',
    contacted: '연락 완료',
    matched: '매칭/진행',
    closed: '종료',
    draft: '준비 중',
    recruiting: '모집 중',
    scheduled: '일정 확정',
    open: '신고 접수',
    resolved: '처리 완료',
    dismissed: '반려'
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

  const showReportsStatus = (message, kind = 'info') => {
    if (!reportsStatusNode) {
      return;
    }
    reportsStatusNode.textContent = message;
    reportsStatusNode.hidden = false;
    reportsStatusNode.classList.remove('is-error', 'is-success');
    if (kind === 'error') {
      reportsStatusNode.classList.add('is-error');
    }
    if (kind === 'success') {
      reportsStatusNode.classList.add('is-success');
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

  const COMMUNITY_IMAGE_BUCKET = 'community-images';
  const COMMUNITY_IMAGE_PREFIX = 'images/community';
  const COMMUNITY_IMAGE_MAX_BYTES = 500000;
  const COMMUNITY_IMAGE_MAX_WIDTH = 1600;

  const slugify = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'community-group';

  const loadImageFromFile = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지 파일을 읽지 못했습니다.'));
    };
    image.src = url;
  });

  const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('이미지를 변환하지 못했습니다.'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

  const convertToWebpBlob = async (file) => {
    if (!String(file?.type || '').startsWith('image/')) {
      throw new Error('이미지 파일만 업로드할 수 있습니다.');
    }
    if (Number(file.size || 0) > 15 * 1024 * 1024) {
      throw new Error('원본 이미지는 15MB 이하만 업로드할 수 있습니다.');
    }

    const image = await loadImageFromFile(file);
    const ratio = Math.min(1, COMMUNITY_IMAGE_MAX_WIDTH / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('이미지 변환용 캔버스를 준비하지 못했습니다.');
    }
    ctx.drawImage(image, 0, 0, width, height);

    const qualities = [0.86, 0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54];
    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality);
      if (blob.size <= COMMUNITY_IMAGE_MAX_BYTES) {
        return blob;
      }
    }

    throw new Error('이미지가 너무 큽니다. 더 작은 이미지를 선택해 주세요.');
  };

  const extractStorageObjectPath = (value) => {
    const marker = `/storage/v1/object/public/${COMMUNITY_IMAGE_BUCKET}/`;
    if (!value || !value.includes(marker)) {
      return null;
    }
    return decodeURIComponent(value.split(marker)[1].split('?')[0]);
  };

  const uploadCommunityImage = async (client, file, baseName) => {
    const blob = await convertToWebpBlob(file);
    const objectPath = `${COMMUNITY_IMAGE_PREFIX}/${Date.now()}-${slugify(baseName)}.webp`;

    const { error: uploadError } = await client.storage.from(COMMUNITY_IMAGE_BUCKET).upload(objectPath, blob, {
      contentType: 'image/webp',
      upsert: false,
      cacheControl: '31536000'
    });

    if (uploadError) {
      throw new Error(`이미지 업로드 실패: ${uploadError.message || '알 수 없는 오류'}`);
    }

    const { data: publicUrlData } = client.storage.from(COMMUNITY_IMAGE_BUCKET).getPublicUrl(objectPath);
    return {
      objectPath,
      publicUrl: publicUrlData?.publicUrl || null
    };
  };

  const renderEmpty = () => {
    if (!listNode) {
      return;
    }
    listNode.innerHTML = '<p class="admin-empty">아직 커뮤니티 신청이 없습니다.</p>';
  };

  const switchWorkspace = (workspace) => {
    workspaceTabs.forEach((button) => {
      const isActive = button.dataset.adminWorkspaceTab === workspace;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });

    workspacePanels.forEach((panel) => {
      panel.hidden = panel.dataset.adminWorkspacePanel !== workspace;
    });
  };

  const renderOverview = () => {
    const pendingCount = allRows.filter((row) => row.status === 'new' || row.status === 'reviewing').length;
    const newCount = allRows.filter((row) => row.status === 'new').length;
    const activeGroupCount = allGroups.filter((group) => group.status === 'recruiting' || group.status === 'scheduled').length;

    if (overviewPendingNode) {
      overviewPendingNode.textContent = String(pendingCount);
    }
    if (overviewNewNode) {
      overviewNewNode.textContent = String(newCount);
    }
    if (overviewGroupsNode) {
      overviewGroupsNode.textContent = String(allGroups.length);
    }
    if (overviewActiveGroupsNode) {
      overviewActiveGroupsNode.textContent = String(activeGroupCount);
    }
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
      ['interest-reading', '소모임 관심', counts.interest.reading || 0],
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

    listNode.innerHTML = rows.map((row) => {
      const linkedGroup = allGroups.find((group) => String(group.source_application_id) === String(row.id));

      return `
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
        <div class="admin-community-card-actions">
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-edit-application>신청 수정</button>
          ${linkedGroup
            ? `<button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-open-linked-group data-linked-group-id="${linkedGroup.id}">만들어진 모임 열기</button>`
            : `<button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-create-group-from-application>이 신청으로 모임 만들기</button>`}
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
    `;
    }).join('');
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
        ${group.image_path ? `<p class="admin-community-subcopy">이미지: ${escapeHtml(group.image_path)}</p>` : ''}
        <div class="admin-community-item-head">
          <div>
            <p class="admin-community-eyebrow">${escapeHtml(labels[group.group_key] || group.group_key)} · ${escapeHtml(labels[group.status] || group.status)}</p>
            <h3>${escapeHtml(group.title)}</h3>
            <p class="admin-community-subcopy">${group.source_application_id ? `원본 신청 #${escapeHtml(group.source_application_id)}에서 만든 모임입니다.` : '관리자가 직접 만든 모임입니다.'}</p>
          </div>
          <span class="admin-community-status admin-community-status-${escapeHtml(group.status)}">${escapeHtml(labels[group.status] || group.status)}</span>
        </div>
        <dl class="admin-community-meta">
          <div><dt>일정</dt><dd>${escapeHtml(group.schedule_text || '-')}</dd></div>
          <div><dt>정원</dt><dd>${escapeHtml(group.capacity || '-')}</dd></div>
          <div><dt>모임장</dt><dd>${escapeHtml(group.host_name || '-')}</dd></div>
          <div><dt>오픈채팅</dt><dd>${group.open_chat_url ? '저장됨' : '-'}</dd></div>
          <div><dt>대표 이미지</dt><dd>${group.image_path ? '저장됨' : '-'}</dd></div>
          <div><dt>생성일</dt><dd>${escapeHtml(formatDate(group.created_at))}</dd></div>
          <div><dt>신청 ID</dt><dd>${escapeHtml(group.source_application_id || '-')}</dd></div>
        </dl>
        ${group.description ? `<p class="admin-community-message"><strong>설명</strong>${escapeHtml(group.description)}</p>` : ''}
        <div class="admin-community-card-actions">
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-edit-group>모임 수정</button>
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-open-source-application data-source-application-id="${escapeHtml(group.source_application_id || '')}" ${group.source_application_id ? '' : 'disabled'}>원본 신청 열기</button>
          <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-copy-open-chat-message ${group.open_chat_url ? '' : 'disabled'}>안내문 복사</button>
          <button class="admin-btn admin-btn-danger admin-btn-small" type="button" data-delete-group>모임 삭제</button>
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

  const renderReports = (reports) => {
    if (!reportsListNode) {
      return;
    }

    if (!reports.length) {
      reportsListNode.innerHTML = '<p class="admin-empty">현재 접수된 신고가 없습니다.</p>';
      return;
    }

    reportsListNode.innerHTML = reports.map((report) => {
      const canDeleteGroup = Boolean(report.group_id && report.group_exists);
      return `
        <article class="admin-community-item admin-report-item admin-community-item-${escapeHtml(report.status || 'open')}" data-report-id="${escapeHtml(report.id)}" data-report-group-id="${escapeHtml(report.group_id || '')}">
          <div class="admin-community-item-head">
            <div>
              <p class="admin-community-eyebrow">신고 · ${escapeHtml(labels[report.status] || report.status || 'open')}</p>
              <h3>${escapeHtml(report.group_title || `모임 #${report.group_id || '-'}`)}</h3>
              <p class="admin-community-subcopy">모임 ID: ${escapeHtml(report.group_id || '-')} · 신고일: ${escapeHtml(formatDate(report.created_at))}</p>
            </div>
            <span class="admin-community-status admin-community-status-${escapeHtml(report.status || 'open')}">${escapeHtml(labels[report.status] || report.status || 'open')}</span>
          </div>
          <p class="admin-community-message"><strong>신고 사유</strong>${escapeHtml(report.reason || '-')}</p>
          ${report.reporter_email || report.reporter_phone ? `<p class="admin-community-message"><strong>신고자</strong>${escapeHtml(report.reporter_email || '-')} / ${escapeHtml(report.reporter_phone || '-')}</p>` : ''}
          ${report.source_path ? `<p class="admin-community-message"><strong>유입 페이지</strong>${escapeHtml(report.source_path)}</p>` : ''}
          ${report.resolved_note ? `<p class="admin-community-message"><strong>처리 메모</strong>${escapeHtml(report.resolved_note)}</p>` : ''}
          <div class="admin-community-card-actions">
            <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-open-reported-group ${canDeleteGroup ? '' : 'disabled'}>모임 열기</button>
            <button class="admin-btn admin-btn-danger admin-btn-small" type="button" data-delete-reported-group ${canDeleteGroup ? '' : 'disabled'}>신고 반영 삭제</button>
            <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-resolve-report="resolved">처리 완료</button>
            <button class="admin-btn admin-btn-outline admin-btn-small" type="button" data-resolve-report="dismissed">반려</button>
          </div>
        </article>
      `;
    }).join('');
  };

  const loadReports = async () => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client || !reportsListNode) {
      return;
    }

    showReportsStatus('신고 목록을 불러오는 중입니다.', 'success');

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'list-reports'
      }
    });

    if (error || !data?.ok) {
      console.error('loadReports failed', error, data);
      showReportsStatus(`신고 목록을 불러오지 못했습니다. (${data?.detail || error?.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    allReports = Array.isArray(data.reports) ? data.reports : [];
    renderReports(allReports);
    showReportsStatus(`신고 ${allReports.length}건을 불러왔습니다.`, 'success');
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
      console.error('community_groups load failed', error);
      showGroupsStatus(`모임 목록을 불러오지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    allGroups = data || [];
    renderGroups(allGroups);
    renderOverview();
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
      console.error('community_applications load failed', error);
      showStatus(`커뮤니티 신청을 불러오지 못했습니다. (${error.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    allRows = data || [];
    renderOverview();
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
    if (row) {
      await syncGroupFromApplication(id, { ...row, status: nextStatus });
    }
    renderStats(allRows);
    renderOverview();
    showStatus('상태가 저장되었습니다.', 'success');
  };

  const syncGroupFromApplication = async (applicationId, application) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client || !applicationId) {
      return;
    }

    try {
      await client.functions.invoke('community-application-notify', {
        body: {
          action: 'sync-group',
          applicationId,
          application
        }
      });
    } catch (error) {
      // Group sync is best-effort so the admin edit flow still succeeds.
    }
  };

  const closeEditPanel = () => {
    if (editPanel) {
      editPanel.hidden = true;
    }
    if (editForm) {
      editForm.reset();
    }
  };

  const openGroupCreatePanel = () => {
    if (groupCreatePanel) {
      groupCreatePanel.hidden = false;
    }
    if (groupCreateToggle) {
      groupCreateToggle.setAttribute('aria-expanded', 'true');
    }
  };

  const closeGroupCreatePanel = () => {
    if (groupCreatePanel) {
      groupCreatePanel.hidden = true;
    }
    if (groupForm) {
      groupForm.reset();
    }
    if (groupCreateToggle) {
      groupCreateToggle.setAttribute('aria-expanded', 'false');
    }
  };

  const closeGroupEditPanel = () => {
    if (groupEditPanel) {
      groupEditPanel.hidden = true;
    }
    if (groupEditForm) {
      groupEditForm.reset();
    }
  };

  const openEditPanel = (item) => {
    const id = item?.dataset?.applicationId;
    const row = allRows.find((entry) => String(entry.id) === String(id));

    if (!row || !editPanel || !editForm) {
      return;
    }

    switchWorkspace('applications');
    editForm.elements.application_id.value = id;
    editForm.elements.group_title.value = row.group_title || '';
    editForm.elements.application_type.value = row.application_type || 'interest';
    editForm.elements.group_key.value = row.group_key || 'other';
    editForm.elements.status.value = row.status || 'new';
    editForm.elements.applicant_name.value = row.applicant_name || '';
    editForm.elements.contact_email.value = row.contact_email || '';
    editForm.elements.contact_phone.value = row.contact_phone || '';
    editForm.elements.availability.value = row.availability || '';
    editForm.elements.existing_group_summary.value = row.existing_group_summary || '';
    editForm.elements.description.value = row.description || '';
    editForm.elements.admin_note.value = row.admin_note || '';
    editForm.elements.message.value = row.message || '';
    editPanel.hidden = false;
    editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openGroupEditPanel = (item) => {
    const id = item?.dataset?.groupId;
    const group = allGroups.find((entry) => String(entry.id) === String(id));

    if (!group || !groupEditPanel || !groupEditForm) {
      return;
    }

    switchWorkspace('groups');
    closeGroupCreatePanel();
    groupEditForm.elements.group_id.value = id;
    groupEditForm.elements.title.value = group.title || '';
    groupEditForm.elements.group_key.value = group.group_key || 'other';
    groupEditForm.elements.status.value = group.status || 'draft';
    groupEditForm.elements.schedule_text.value = group.schedule_text || '';
    groupEditForm.elements.capacity.value = group.capacity || '';
    groupEditForm.elements.host_name.value = group.host_name || '';
    groupEditForm.elements.open_chat_url.value = group.open_chat_url || '';
    groupEditForm.elements.image_path.value = group.image_path || '';
    groupEditForm.elements.image_file.value = '';
    groupEditForm.elements.description.value = group.description || '';
    groupEditPanel.hidden = false;
    groupEditPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitGroupEditForm = async (event) => {
    event.preventDefault();

    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    const id = groupEditForm?.elements?.group_id?.value;

    if (!client || !id) {
      showGroupsStatus('수정할 모임을 찾지 못했습니다.', 'error');
      return;
    }

    const currentImagePath = groupEditForm.elements.image_path.value.trim() || null;
    const imageFile = groupEditForm.elements.image_file?.files?.[0] || null;
    let nextImagePath = currentImagePath;

    if (imageFile) {
      try {
        showGroupsStatus('대표 이미지를 WebP로 변환하고 업로드하는 중입니다.', 'success');
        const uploaded = await uploadCommunityImage(client, imageFile, groupEditForm.elements.title.value || imageFile.name);
        nextImagePath = uploaded.publicUrl;

        const oldObjectPath = extractStorageObjectPath(currentImagePath);
        if (oldObjectPath) {
          await client.storage.from(COMMUNITY_IMAGE_BUCKET).remove([oldObjectPath]);
        }
      } catch (error) {
        showGroupsStatus(error.message || '대표 이미지를 업로드하지 못했습니다.', 'error');
        return;
      }
    }

    const values = {
      title: groupEditForm.elements.title.value.trim(),
      group_key: groupEditForm.elements.group_key.value.trim(),
      status: groupEditForm.elements.status.value.trim(),
      schedule_text: groupEditForm.elements.schedule_text.value.trim(),
      capacity: groupEditForm.elements.capacity.value ? Number(groupEditForm.elements.capacity.value) : null,
      host_name: groupEditForm.elements.host_name.value.trim(),
      open_chat_url: groupEditForm.elements.open_chat_url.value.trim(),
      image_path: nextImagePath,
      description: groupEditForm.elements.description.value.trim()
    };

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'update-group',
        groupId: id,
        values
      }
    });

    if (error || !data?.ok) {
      console.error('submitGroupEditForm failed', error, data);
      showGroupsStatus(`모임 정보를 수정하지 못했습니다. (${data?.detail || error?.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    const group = allGroups.find((entry) => String(entry.id) === String(id));
    if (group) {
      Object.assign(group, values);
    }

    renderGroups(allGroups);
    renderOverview();
    closeGroupEditPanel();
    showGroupsStatus('모임 정보가 저장되었습니다.', 'success');
  };

  const submitEditForm = async (event) => {
    event.preventDefault();

    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    const id = editForm?.elements?.application_id?.value;

    if (!client || !id) {
      showStatus('수정할 신청을 찾지 못했습니다.', 'error');
      return;
    }

    const values = {
      group_title: editForm.elements.group_title.value.trim(),
      application_type: editForm.elements.application_type.value.trim(),
      group_key: editForm.elements.group_key.value.trim(),
      status: editForm.elements.status.value.trim(),
      applicant_name: editForm.elements.applicant_name.value.trim(),
      contact_email: editForm.elements.contact_email.value.trim(),
      contact_phone: editForm.elements.contact_phone.value.trim(),
      availability: editForm.elements.availability.value.trim(),
      existing_group_summary: editForm.elements.existing_group_summary.value.trim(),
      description: editForm.elements.description.value.trim(),
      admin_note: editForm.elements.admin_note.value.trim(),
      message: editForm.elements.message.value.trim()
    };

    console.log('submitEditForm payload', { applicationId: id, values });

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'update',
        applicationId: id,
        fields: values
      }
    });

    if (error || !data?.ok) {
      console.error('submitEditForm failed', { error, data });
      showStatus(`신청 내용을 수정하지 못했습니다. (${data?.detail || error?.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    const row = allRows.find((entry) => String(entry.id) === String(id));
    if (row) {
      Object.assign(row, values);
    }

    await syncGroupFromApplication(id, { ...(row || {}), ...values, id });
    renderVisibleRows();
    closeEditPanel();
    showStatus('신청 정보가 저장되었습니다.', 'success');
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
    renderOverview();
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

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'update-group',
        groupId: id,
        values: { status: nextStatus }
      }
    });

    if (error || !data?.ok) {
      console.error('updateGroupStatus failed', error, data);
      showGroupsStatus('모임 상태를 변경하지 못했습니다.', 'error');
      return;
    }

    const group = allGroups.find((item) => String(item.id) === String(id));
    if (group) {
      group.status = nextStatus;
    }
    renderGroups(allGroups);
    renderOverview();
    showGroupsStatus('모임 상태가 저장되었습니다.', 'success');
  };

  const deleteGroupById = async (groupId) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client || !groupId) {
      return false;
    }

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'delete-group',
        groupId
      }
    });

    if (error || !data?.ok) {
      console.error('deleteGroupById failed', error, data);
      return false;
    }

    allGroups = allGroups.filter((group) => String(group.id) !== String(groupId));
    renderGroups(allGroups);
    renderOverview();
    closeGroupEditPanel();
    return true;
  };

  const resolveReport = async (reportId, nextStatus) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;

    if (!client || !reportId) {
      return;
    }

    const note = window.prompt('처리 메모(선택)를 입력해 주세요.', '');
    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'resolve-report',
        reportId,
        status: nextStatus,
        note: (note || '').trim()
      }
    });

    if (error || !data?.ok) {
      console.error('resolveReport failed', error, data);
      showReportsStatus(`신고 상태를 저장하지 못했습니다. (${data?.detail || error?.message || '알 수 없는 오류'})`, 'error');
      return;
    }

    await loadReports();
    showReportsStatus('신고 상태를 저장했습니다.', 'success');
  };

  const deleteGroup = async (item) => {
    const adminContext = window.barunjariAdmin;
    const client = adminContext?.client;
    const id = item?.dataset?.groupId;

    if (!client || !id) {
      return;
    }

    const confirmed = window.confirm('이 모임 정보를 영구 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.');
    if (!confirmed) {
      return;
    }

    showGroupsStatus('모임을 삭제하는 중입니다.', 'success');

    const deleted = await deleteGroupById(id);
    if (!deleted) {
      showGroupsStatus('모임을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
      return;
    }

    await loadReports();
    showGroupsStatus('모임이 삭제되었습니다.', 'success');
  };

  const openApplicationById = (applicationId) => {
    if (!applicationId) {
      return;
    }

    if (statusFilter) {
      statusFilter.value = 'all';
    }
    if (typeFilter) {
      typeFilter.value = 'all';
    }
    if (groupFilter) {
      groupFilter.value = 'all';
    }

    renderVisibleRows();
    switchWorkspace('applications');

    const item = listNode?.querySelector(`[data-application-id="${String(applicationId)}"]`);
    if (item) {
      openEditPanel(item);
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const openGroupById = (groupId) => {
    if (!groupId) {
      return;
    }

    switchWorkspace('groups');

    const item = groupsListNode?.querySelector(`[data-group-id="${String(groupId)}"]`);
    if (item) {
      openGroupEditPanel(item);
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    groupForm.elements.image_path.value = '';
    groupForm.elements.description.value = [row.existing_group_summary, row.message].filter(Boolean).join('\n\n');
    groupForm.elements.source_application_id.value = row.id;
    switchWorkspace('groups');
    closeGroupEditPanel();
    openGroupCreatePanel();
    groupsRoot?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showGroupsStatus('선택한 신청 내용으로 모임 초안을 채웠습니다.', 'success');
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
    let imagePathValue = String(formData.get('image_path') || '').trim() || null;
    const imageFile = formData.get('image_file');

    if (imageFile instanceof File && imageFile.size > 0) {
      try {
        showGroupsStatus('대표 이미지를 WebP로 변환하고 업로드하는 중입니다.', 'success');
        const uploaded = await uploadCommunityImage(client, imageFile, formData.get('title') || imageFile.name);
        imagePathValue = uploaded.publicUrl;
      } catch (error) {
        showGroupsStatus(error.message || '대표 이미지를 업로드하지 못했습니다.', 'error');
        return;
      }
    }

    const payload = {
      title: String(formData.get('title') || '').trim(),
      group_key: String(formData.get('group_key') || 'other').trim(),
      status: String(formData.get('status') || 'draft').trim(),
      schedule_text: String(formData.get('schedule_text') || '').trim() || null,
      capacity: capacityValue ? Number(capacityValue) : null,
      host_name: String(formData.get('host_name') || '').trim() || null,
      open_chat_url: String(formData.get('open_chat_url') || '').trim() || null,
      image_path: imagePathValue,
      description: String(formData.get('description') || '').trim() || null,
      source_application_id: sourceApplicationId ? Number(sourceApplicationId) : null
    };

    if (!payload.title) {
      showGroupsStatus('모임 이름을 입력해 주세요.', 'error');
      return;
    }

    showGroupsStatus('모임을 저장하는 중입니다.', 'success');

    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action: 'create-group',
        values: payload
      }
    });

    if (error || !data?.ok) {
      console.error('createGroup failed', error, data);
      showGroupsStatus('모임을 저장하지 못했습니다.', 'error');
      return;
    }

    groupForm.reset();
    closeGroupCreatePanel();
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
      openEditPanel(item);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-application]');
    if (deleteButton) {
      const item = deleteButton.closest('[data-application-id]');
      deleteApplication(item);
      return;
    }

    const linkedGroupButton = event.target.closest('[data-open-linked-group]');
    if (linkedGroupButton) {
      openGroupById(linkedGroupButton.dataset.linkedGroupId);
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
    const editButton = event.target.closest('[data-edit-group]');
    if (editButton) {
      const item = editButton.closest('[data-group-id]');
      openGroupEditPanel(item);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-group]');
    if (deleteButton) {
      const item = deleteButton.closest('[data-group-id]');
      deleteGroup(item);
      return;
    }

    const sourceButton = event.target.closest('[data-open-source-application]');
    if (sourceButton) {
      openApplicationById(sourceButton.dataset.sourceApplicationId);
      return;
    }

    const button = event.target.closest('[data-copy-open-chat-message]');
    if (!button) {
      return;
    }
    const item = button.closest('[data-group-id]');
    copyOpenChatMessage(item?.dataset?.groupId);
  });

  reportsListNode?.addEventListener('click', async (event) => {
    const item = event.target.closest('[data-report-id]');
    if (!item) {
      return;
    }

    const reportId = item.dataset.reportId;
    const groupId = item.dataset.reportGroupId;

    const openButton = event.target.closest('[data-open-reported-group]');
    if (openButton) {
      openGroupById(groupId);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-reported-group]');
    if (deleteButton) {
      if (!groupId) {
        showReportsStatus('삭제할 모임 정보를 찾지 못했습니다.', 'error');
        return;
      }

      const confirmed = window.confirm('신고 반영으로 해당 모임을 삭제하시겠습니까? 이 작업은 복구할 수 없습니다.');
      if (!confirmed) {
        return;
      }

      showReportsStatus('신고 모임을 삭제하는 중입니다.', 'success');
      const deleted = await deleteGroupById(groupId);
      if (!deleted) {
        showReportsStatus('신고 모임을 삭제하지 못했습니다.', 'error');
        return;
      }

      await resolveReport(reportId, 'resolved');
      showGroupsStatus('신고 모임 삭제를 완료했습니다.', 'success');
      return;
    }

    const resolveButton = event.target.closest('[data-resolve-report]');
    if (!resolveButton) {
      return;
    }

    await resolveReport(reportId, resolveButton.dataset.resolveReport || 'resolved');
  });

  groupForm?.addEventListener('submit', createGroup);
  groupCreateToggle?.addEventListener('click', () => {
    if (groupCreatePanel?.hidden) {
      openGroupCreatePanel();
      closeGroupEditPanel();
      return;
    }

    closeGroupCreatePanel();
  });
  groupCreateCancelButtons.forEach((button) => {
    button.addEventListener('click', closeGroupCreatePanel);
  });
  groupEditForm?.addEventListener('submit', submitGroupEditForm);
  cancelGroupEditButtons.forEach((button) => {
    button.addEventListener('click', closeGroupEditPanel);
  });
  editForm?.addEventListener('submit', submitEditForm);
  cancelEditButtons.forEach((button) => {
    button.addEventListener('click', closeEditPanel);
  });

  statusFilter?.addEventListener('change', renderVisibleRows);
  typeFilter?.addEventListener('change', renderVisibleRows);
  groupFilter?.addEventListener('change', renderVisibleRows);
  refreshButton?.addEventListener('click', () => {
    loadApplications();
    loadReports();
  });
  workspaceTabs.forEach((button) => {
    button.addEventListener('click', () => {
      switchWorkspace(button.dataset.adminWorkspaceTab || 'applications');
    });
  });
  window.addEventListener('barunjari:admin-ready', () => {
    loadGroups();
    loadApplications();
    loadReports();
  });

  switchWorkspace('applications');
  if (window.barunjariAdmin?.client) {
    loadGroups();
    loadApplications();
    loadReports();
  }
})();
