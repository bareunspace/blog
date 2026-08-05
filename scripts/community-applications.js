(() => {
  const configNode = document.getElementById('communityApplicationConfig');
  const forms = Array.from(document.querySelectorAll('[data-community-application-form]'));
  const liveGroupsNode = document.querySelector('[data-community-live-groups]');
  const ownerLookupForm = document.querySelector('[data-community-owner-lookup-form]');
  const ownerStatusNode = document.querySelector('[data-community-owner-status]');
  const ownerListNode = document.querySelector('[data-community-owner-list]');

  if (!configNode || (!forms.length && !liveGroupsNode && !ownerLookupForm)) {
    return;
  }

  const parseConfig = () => {
    try {
      return JSON.parse(configNode.textContent || '{}');
    } catch (error) {
      return {};
    }
  };

  const config = parseConfig();
  const supabaseUrl = (config.supabaseUrl || '').trim();
  const supabaseAnonKey = (config.supabaseAnonKey || '').trim();

  const showStatus = (form, message, kind = 'error') => {
    const statusNode = form.querySelector('[data-community-application-status]');
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.hidden = false;
    statusNode.classList.remove('is-error', 'is-success');
    statusNode.classList.add(kind === 'success' ? 'is-success' : 'is-error');
  };

  if (!supabaseUrl || !supabaseAnonKey || !window.supabase || typeof window.supabase.createClient !== 'function') {
    forms.forEach((form) => {
      showStatus(form, '신청 기능을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    });
    return;
  }

  const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  const MIN_VISIBLE_INTEREST_COUNT = 3;
  const OWNER_EDITABLE_STATUSES = ['new', 'reviewing'];
  const OWNER_GROUP_STATUSES = ['recruiting', 'closed'];
  let interestCounts = {
    topics: {},
    groups: {}
  };
  let ownerSession = {
    email: '',
    phone: ''
  };
  let ownerApplications = [];

  const groupLabels = {
    interview: '면접 준비 모임',
    reading: '책 읽고 이야기 나누는 모임',
    ai: 'AI 같이 써보는 모임',
    other: '기타 목적형 모임'
  };

  const typeLabels = {
    interest: '참여 관심',
    host: '모임 개설 신청'
  };

  const groupShortLabels = {
    interview: '면접 준비',
    reading: '독서모임',
    ai: 'AI 사용',
    other: '기타'
  };

  const statusLabels = {
    interest: '🟢 관심 등록',
    scheduled: '🟡 모집 예정',
    recruiting: '🔵 모집 중',
    closed: '🔴 모집 마감',
    new: '새 신청',
    reviewing: '검토 중',
    contacted: '연락 완료',
    matched: '매칭/진행',
    deleted_by_owner: '작성자 삭제'
  };

  const formatInterestText = (count) => {
    const parsedCount = Number(count || 0);
    if (parsedCount >= MIN_VISIBLE_INTEREST_COUNT) {
      return `${parsedCount}명`;
    }
    if (parsedCount > 0) {
      return '모집 준비 중';
    }
    return '관심 등록 가능';
  };

  const setApplicationType = (form, value) => {
    const typeNodes = form.querySelectorAll('input[name="application_type"]');
    if (typeNodes.length) {
      typeNodes.forEach((node) => {
        node.checked = node.value === value;
      });
      return;
    }

    if (form.elements.application_type) {
      form.elements.application_type.value = value;
    }
  };

  const toggleCustomTitleField = (form) => {
    const customTitleRow = form.querySelector('.community-form-row-custom-title');
    const groupSelect = form.elements.group_key;
    if (!customTitleRow || !groupSelect) {
      return;
    }

    const shouldShow = groupSelect.value === 'other';
    customTitleRow.hidden = !shouldShow;
    const customTitleInput = form.elements.custom_group_title;
    if (customTitleInput) {
      customTitleInput.required = shouldShow;
      customTitleInput.disabled = !shouldShow;
      customTitleInput.value = shouldShow ? customTitleInput.value : '';
      customTitleInput.setAttribute('aria-disabled', String(!shouldShow));
    }
  };

  const getValue = (form, name) => String(new FormData(form).get(name) || '').trim();

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value) => /^(\+?82[-\s]?)?0?\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}$/.test(String(value || '').trim());

  const setSubmitting = (form, isSubmitting) => {
    form.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    Array.from(form.querySelectorAll('button, input, select, textarea')).forEach((node) => {
      node.disabled = isSubmitting;
    });
  };

  const normalizePhone = (value) => {
    const digits = String(value || '').replace(/[^0-9]/g, '');
    if (!digits) {
      return '';
    }
    if (digits.startsWith('82')) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  };

  const showOwnerStatus = (message, kind = 'error') => {
    if (!ownerStatusNode) {
      return;
    }

    ownerStatusNode.textContent = message;
    ownerStatusNode.hidden = false;
    ownerStatusNode.classList.remove('is-error', 'is-success');
    ownerStatusNode.classList.add(kind === 'success' ? 'is-success' : 'is-error');
  };

  const setOwnerSubmitting = (isSubmitting) => {
    if (!ownerLookupForm) {
      return;
    }
    ownerLookupForm.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    Array.from(ownerLookupForm.querySelectorAll('button, input')).forEach((node) => {
      node.disabled = isSubmitting;
    });
  };

  const notifyAdmin = async (payload) => {
    try {
      await client.functions.invoke('community-application-notify', {
        body: {
          application: payload,
          adminUrl: `${window.location.origin}/admin.html`
        }
      });
    } catch (error) {
      // Email notification is best-effort. The database insert is the source of truth.
    }
  };

  const syncGroupDraft = async (applicationId, application) => {
    if (!applicationId) {
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
      // Group syncing is best-effort so the application submit flow still succeeds.
    }
  };

  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const renderLiveGroups = (groups) => {
    if (!liveGroupsNode) {
      return;
    }

    if (!groups.length) {
      liveGroupsNode.innerHTML = `
        <div class="community-live-empty">
          <strong>현재 첫 번째 모임을 준비하고 있습니다.</strong>
          <span>관심 등록을 남겨주시면 가장 먼저 안내드립니다.</span>
        </div>
      `;
      return;
    }

    liveGroupsNode.innerHTML = `
      <div class="community-live-heading">
        <h3>지금 참여할 수 있는 모임</h3>
        <p>운영자가 일정과 내용을 확인한 실제 모임입니다.</p>
      </div>
      <div class="community-group-grid community-live-grid">
        ${groups.map((group) => `
          <article class="community-group-card community-live-card">
            <div class="community-group-topline">
              <span class="community-category">${escapeHtml(groupShortLabels[group.group_key] || group.group_key)}</span>
              <span class="community-status">${escapeHtml(statusLabels[group.status] || group.status)}</span>
            </div>
            <h3>${escapeHtml(group.title)}</h3>
            ${group.description ? `<p>${escapeHtml(group.description)}</p>` : '<p>자세한 진행 방식은 신청 후 개별 안내드립니다.</p>'}
            <dl class="community-group-meta">
              <div>
                <dt>일정</dt>
                <dd>${escapeHtml(group.schedule_text || '개별 안내')}</dd>
              </div>
              <div>
                <dt>정원</dt>
                <dd>${escapeHtml(group.capacity ? `${group.capacity}명` : '협의')}</dd>
              </div>
              <div>
                <dt>모임장</dt>
                <dd>${escapeHtml(group.host_name || '바른자리 확인 중')}</dd>
              </div>
              <div>
                <dt>참여 관심</dt>
                <dd>${escapeHtml(formatInterestText(interestCounts.groups[group.id]))}</dd>
              </div>
            </dl>
            <div class="community-card-actions">
              <button
                class="btn-primary community-card-btn"
                type="button"
                data-community-group-join
                data-group-id="${escapeHtml(group.id)}"
                data-group-key="${escapeHtml(group.group_key)}"
                data-group-title="${escapeHtml(group.title)}"
              >참여 관심 등록</button>
              <button
                class="btn-outline community-card-btn community-card-btn-report"
                type="button"
                data-community-group-report
                data-group-id="${escapeHtml(group.id)}"
                data-group-title="${escapeHtml(group.title)}"
              >신고</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  };

  const renderOwnerApplications = (applications) => {
    if (!ownerListNode) {
      return;
    }

    if (!applications.length) {
      ownerListNode.innerHTML = '<p class="community-owner-empty">일치하는 신청 내역이 없습니다. 입력한 이메일/전화번호를 확인해 주세요.</p>';
      return;
    }

    ownerListNode.innerHTML = applications.map((row) => {
      const canEdit = OWNER_EDITABLE_STATUSES.includes(String(row.status || ''));
      const linkedGroup = row.linked_group || null;
      const canToggleGroupStatus = Boolean(linkedGroup && row.application_type === 'host');
      return `
        <article class="community-owner-item" data-owner-application-id="${escapeHtml(row.id)}" data-owner-group-id="${escapeHtml(linkedGroup?.id || '')}">
          <div class="community-owner-item-head">
            <div>
              <p class="community-owner-item-eyebrow">${escapeHtml(typeLabels[row.application_type] || row.application_type)} · ${escapeHtml(groupShortLabels[row.group_key] || row.group_key)}</p>
              <h4>${escapeHtml(row.group_title || '모임 신청')}</h4>
            </div>
            <span class="community-owner-item-status">${escapeHtml(statusLabels[row.status] || row.status || '-')}</span>
          </div>
          <dl class="community-owner-item-meta">
            <div><dt>신청일</dt><dd>${escapeHtml(new Date(row.created_at).toLocaleString('ko-KR'))}</dd></div>
            <div><dt>희망 일정</dt><dd>${escapeHtml(row.availability || '-')}</dd></div>
            <div><dt>연락처</dt><dd>${escapeHtml(row.contact_email || '-')} / ${escapeHtml(row.contact_phone || '-')}</dd></div>
          </dl>
          <div class="community-owner-edit-grid">
            <div class="community-form-row community-form-row-full">
              <label>모임 이름</label>
              <input type="text" name="group_title" value="${escapeHtml(row.group_title || '')}" ${canEdit ? '' : 'disabled'} />
            </div>
            <div class="community-form-row community-form-row-full">
              <label>희망 일정</label>
              <input type="text" name="availability" value="${escapeHtml(row.availability || '')}" ${canEdit ? '' : 'disabled'} />
            </div>
            <div class="community-form-row community-form-row-full">
              <label>신청 메시지</label>
              <textarea name="message" rows="3" ${canEdit ? '' : 'disabled'}>${escapeHtml(row.message || '')}</textarea>
            </div>
          </div>
          <div class="community-owner-actions">
            <button type="button" class="btn-primary community-owner-btn" data-owner-save ${canEdit ? '' : 'disabled'}>수정 저장</button>
            <button type="button" class="btn-outline community-owner-btn" data-owner-delete>신청 삭제</button>
          </div>
          ${canToggleGroupStatus ? `
            <div class="community-owner-group-status">
              <label>
                모집 상태
                <select data-owner-group-status>
                  ${OWNER_GROUP_STATUSES.map((status) => `<option value="${status}" ${linkedGroup.status === status ? 'selected' : ''}>${escapeHtml(statusLabels[status] || status)}</option>`).join('')}
                </select>
              </label>
              <p>내가 개설한 모임은 모집 상태를 직접 바꿀 수 있습니다.</p>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');
  };

  const invokeCommunityAction = async (action, payload) => {
    const { data, error } = await client.functions.invoke('community-application-notify', {
      body: {
        action,
        ...payload
      }
    });

    if (error || !data?.ok) {
      throw new Error(data?.detail || error?.message || '요청을 처리하지 못했습니다.');
    }

    return data;
  };

  const reloadOwnerApplications = async () => {
    if (!ownerSession.email || !ownerSession.phone) {
      return;
    }
    const data = await invokeCommunityAction('owner-list', {
      contactEmail: ownerSession.email,
      contactPhone: ownerSession.phone
    });
    ownerApplications = Array.isArray(data.applications) ? data.applications : [];
    renderOwnerApplications(ownerApplications);
  };

  const reportGroup = async (groupId, groupTitle) => {
    const reason = window.prompt('신고 사유를 입력해 주세요. (최소 5자)');
    if (!reason) {
      return;
    }
    if (reason.trim().length < 5) {
      const form = forms[0];
      if (form) {
        showStatus(form, '신고 사유를 5자 이상 입력해 주세요.');
      }
      return;
    }

    await invokeCommunityAction('report-group', {
      groupId: Number(groupId),
      groupTitle,
      reason: reason.trim(),
      sourcePath: window.location.pathname,
      reporterEmail: ownerSession.email || null,
      reporterPhone: ownerSession.phone || null
    });

    const form = forms[0];
    if (form) {
      showStatus(form, '신고가 접수되었습니다. 운영자가 확인 후 조치합니다.', 'success');
    }
  };

  const loadLiveGroups = async () => {
    if (!liveGroupsNode) {
      return;
    }

    await loadInterestCounts();

    const { data, error } = await client
      .from('community_groups')
      .select('id, group_key, title, description, status, host_name, schedule_text, capacity')
      .in('status', ['recruiting', 'scheduled'])
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      liveGroupsNode.innerHTML = '';
      return;
    }

    renderLiveGroups(data || []);
  };

  const renderTopicCounts = () => {
    Object.entries(interestCounts.topics).forEach(([groupKey, count]) => {
      const node = document.querySelector(`[data-community-topic-count="${groupKey}"]`);
      if (node) {
        node.textContent = formatInterestText(count);
      }
    });

    document.querySelectorAll('[data-community-topic-count]').forEach((node) => {
      if (!node.textContent || node.textContent === '확인 중') {
        node.textContent = '관심 등록 가능';
      }
    });
  };

  const loadInterestCounts = async () => {
    const { data, error } = await client.rpc('get_community_interest_counts');

    if (error) {
      renderTopicCounts();
      return;
    }

    interestCounts = (data || []).reduce((acc, row) => {
      const count = Number(row.interest_count || 0);
      if (row.count_scope === 'topic' && row.group_key) {
        acc.topics[row.group_key] = count;
      }
      if (row.count_scope === 'group' && row.target_group_id) {
        acc.groups[row.target_group_id] = count;
      }
      return acc;
    }, {
      topics: {},
      groups: {}
    });

    renderTopicCounts();
  };

  const focusFormForGroup = (button) => {
    const form = forms[0];
    if (!form) {
      return;
    }

    const groupId = button.dataset.groupId || '';
    const groupKey = button.dataset.groupKey || 'other';
    const groupTitle = button.dataset.groupTitle || groupLabels[groupKey] || '기타 목적형 모임';

    setApplicationType(form, 'interest');
    if (form.elements.group_key) {
      form.elements.group_key.value = groupKey;
    }
    if (form.elements.target_group_id) {
      form.elements.target_group_id.value = groupId;
    }
    if (form.elements.target_group_title) {
      form.elements.target_group_title.value = groupTitle;
    }
    if (form.elements.message && !form.elements.message.value.trim()) {
      form.elements.message.value = `${groupTitle} 참여에 관심 있습니다.`;
    }

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showStatus(form, `${groupTitle} 참여 관심 등록으로 신청할 수 있습니다.`, 'success');
  };

  liveGroupsNode?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-community-group-join]');
    if (button) {
      focusFormForGroup(button);
      return;
    }

    const reportButton = event.target.closest('[data-community-group-report]');
    if (!reportButton) {
      return;
    }

    reportGroup(reportButton.dataset.groupId, reportButton.dataset.groupTitle)
      .catch((error) => {
        const form = forms[0];
        if (form) {
          showStatus(form, error.message || '신고를 접수하지 못했습니다.');
        }
      });
  });

  loadLiveGroups();

  forms.forEach((form) => {
    const groupSelect = form.elements.group_key;
    if (groupSelect) {
      groupSelect.addEventListener('change', () => toggleCustomTitleField(form));
    }
    toggleCustomTitleField(form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (getValue(form, 'website')) {
        showStatus(form, '신청이 접수되었습니다.', 'success');
        form.reset();
        return;
      }

      const applicationType = getValue(form, 'application_type');
      const groupKey = getValue(form, 'group_key');
      const applicantName = getValue(form, 'applicant_name');
      const contactEmail = getValue(form, 'contact_email');
      const contactPhone = getValue(form, 'contact_phone');
      const availabilitySlots = Array.from(form.querySelectorAll('input[name="availability_slots"]:checked'))
        .map((node) => String(node.value || '').trim())
        .filter(Boolean);
      const availability = availabilitySlots.join(', ');
      const message = getValue(form, 'message');
      const existingGroupSummary = getValue(form, 'existing_group_summary');
      const targetGroupId = getValue(form, 'target_group_id');
      const targetGroupTitle = getValue(form, 'target_group_title');
      const customGroupTitle = getValue(form, 'custom_group_title');
      const privacyConsent = Boolean(new FormData(form).get('privacy_consent'));

      if (!applicationType || !groupKey || !applicantName || !contactEmail || !contactPhone || !message || !privacyConsent) {
        showStatus(form, '필수 항목과 개인정보 동의를 확인해 주세요.');
        return;
      }

      if (!isValidEmail(contactEmail)) {
        showStatus(form, '이메일 형식을 확인해 주세요.');
        return;
      }

      if (!isValidPhone(contactPhone)) {
        showStatus(form, '전화번호 형식을 확인해 주세요. 예: 010-1234-5678');
        return;
      }

      const resolvedGroupTitle = groupKey === 'other'
        ? (customGroupTitle || targetGroupTitle || groupLabels[groupKey] || '기타 목적형 모임')
        : (targetGroupTitle || groupLabels[groupKey] || '기타 목적형 모임');

      const payload = {
        application_type: applicationType,
        group_key: groupKey,
        group_title: resolvedGroupTitle,
        target_group_id: targetGroupId ? Number(targetGroupId) : null,
        applicant_name: applicantName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        availability: availability || null,
        message: message || null,
        existing_group_summary: existingGroupSummary || null,
        privacy_consent: privacyConsent,
        source_path: window.location.pathname
      };

      setSubmitting(form, true);
      showStatus(form, '신청을 저장하는 중입니다.', 'success');

      const { data: insertedRows, error } = await client
        .from('community_applications')
        .insert(payload)
        .select('*');

      setSubmitting(form, false);

      if (error) {
        showStatus(form, '신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      const insertedApplication = insertedRows?.[0];
      const applicationPayload = {
        ...payload,
        id: insertedApplication?.id,
        application_type_label: typeLabels[applicationType] || applicationType
      };

      await notifyAdmin(applicationPayload);
      await syncGroupDraft(insertedApplication?.id, applicationPayload);

      form.reset();
      await loadLiveGroups();
      showStatus(form, '신청이 접수되었습니다. 확인 후 연락드리겠습니다.', 'success');
    });
  });

  ownerLookupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const contactEmail = String(new FormData(ownerLookupForm).get('contact_email') || '').trim().toLowerCase();
    const contactPhoneRaw = String(new FormData(ownerLookupForm).get('contact_phone') || '').trim();
    const contactPhone = normalizePhone(contactPhoneRaw);

    if (!isValidEmail(contactEmail)) {
      showOwnerStatus('이메일 형식을 확인해 주세요.');
      return;
    }

    if (!isValidPhone(contactPhoneRaw)) {
      showOwnerStatus('전화번호 형식을 확인해 주세요. 예: 010-1234-5678 또는 +82 10-1234-5678');
      return;
    }

    ownerSession = {
      email: contactEmail,
      phone: contactPhone
    };

    setOwnerSubmitting(true);
    showOwnerStatus('신청 내역을 조회하는 중입니다.', 'success');

    try {
      await reloadOwnerApplications();
      showOwnerStatus(`신청 ${ownerApplications.length}건을 불러왔습니다.`, 'success');
    } catch (error) {
      showOwnerStatus(error.message || '신청 내역을 불러오지 못했습니다.');
    } finally {
      setOwnerSubmitting(false);
    }
  });

  ownerListNode?.addEventListener('click', async (event) => {
    const item = event.target.closest('[data-owner-application-id]');
    if (!item) {
      return;
    }

    const applicationId = Number(item.dataset.ownerApplicationId);
    if (!applicationId) {
      return;
    }

    const saveButton = event.target.closest('[data-owner-save]');
    if (saveButton) {
      const groupTitle = item.querySelector('input[name="group_title"]')?.value?.trim() || '';
      const availability = item.querySelector('input[name="availability"]')?.value?.trim() || '';
      const message = item.querySelector('textarea[name="message"]')?.value?.trim() || '';
      try {
        showOwnerStatus('수정 내용을 저장하는 중입니다.', 'success');
        await invokeCommunityAction('owner-update', {
          applicationId,
          contactEmail: ownerSession.email,
          contactPhone: ownerSession.phone,
          fields: {
            group_title: groupTitle,
            availability,
            message
          }
        });
        await reloadOwnerApplications();
        await loadLiveGroups();
        showOwnerStatus('신청 수정이 완료되었습니다.', 'success');
      } catch (error) {
        showOwnerStatus(error.message || '신청을 수정하지 못했습니다.');
      }
      return;
    }

    const deleteButton = event.target.closest('[data-owner-delete]');
    if (deleteButton) {
      const confirmed = window.confirm('내 신청을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.');
      if (!confirmed) {
        return;
      }

      try {
        showOwnerStatus('신청을 삭제하는 중입니다.', 'success');
        await invokeCommunityAction('owner-delete', {
          applicationId,
          contactEmail: ownerSession.email,
          contactPhone: ownerSession.phone
        });
        await reloadOwnerApplications();
        await loadLiveGroups();
        showOwnerStatus('신청이 삭제되었습니다.', 'success');
      } catch (error) {
        showOwnerStatus(error.message || '신청을 삭제하지 못했습니다.');
      }
    }
  });

  ownerListNode?.addEventListener('change', async (event) => {
    const select = event.target.closest('[data-owner-group-status]');
    if (!select) {
      return;
    }

    const item = select.closest('[data-owner-application-id]');
    const applicationId = Number(item?.dataset?.ownerApplicationId || 0);
    const groupId = Number(item?.dataset?.ownerGroupId || 0);
    if (!applicationId || !groupId) {
      return;
    }

    try {
      showOwnerStatus('모집 상태를 변경하는 중입니다.', 'success');
      await invokeCommunityAction('owner-update-group-status', {
        applicationId,
        groupId,
        status: select.value,
        contactEmail: ownerSession.email,
        contactPhone: ownerSession.phone
      });
      await reloadOwnerApplications();
      await loadLiveGroups();
      showOwnerStatus('모집 상태가 변경되었습니다.', 'success');
    } catch (error) {
      showOwnerStatus(error.message || '모집 상태를 변경하지 못했습니다.');
    }
  });
})();
