(() => {
  const configNode = document.getElementById('communityApplicationConfig');
  const forms = Array.from(document.querySelectorAll('[data-community-application-form]'));
  const liveGroupsNode = document.querySelector('[data-community-live-groups]');

  if (!configNode || (!forms.length && !liveGroupsNode)) {
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
  let interestCounts = {
    topics: {},
    groups: {}
  };
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
    closed: '🔴 모집 마감'
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
  const isValidPhone = (value) => /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(value.replace(/\s+/g, ''));

  const setSubmitting = (form, isSubmitting) => {
    form.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    Array.from(form.querySelectorAll('button, input, select, textarea')).forEach((node) => {
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
            </div>
          </article>
        `).join('')}
      </div>
    `;
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
    if (!button) {
      return;
    }
    focusFormForGroup(button);
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

      const { error } = await client
        .from('community_applications')
        .insert(payload);

      setSubmitting(form, false);

      if (error) {
        showStatus(form, '신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      await notifyAdmin({
        ...payload,
        application_type_label: typeLabels[applicationType] || applicationType
      });

      form.reset();
      await loadLiveGroups();
      showStatus(form, '신청이 접수되었습니다. 확인 후 연락드리겠습니다.', 'success');
    });
  });
})();
