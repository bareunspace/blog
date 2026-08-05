(() => {
  const configNode = document.getElementById('communityApplicationConfig');
  const forms = Array.from(document.querySelectorAll('[data-community-application-form]'));

  if (!configNode || !forms.length) {
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
  const groupLabels = {
    interview: '면접 준비 모임',
    reading: '책 읽고 이야기 나누는 모임',
    ai: 'AI 같이 써보는 모임',
    other: '기타 목적형 모임'
  };

  const typeLabels = {
    interest: '관심 등록',
    host: '모임 시작',
    existing_group: '기존 모임 등록'
  };

  const getValue = (form, name) => String(new FormData(form).get(name) || '').trim();

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

  forms.forEach((form) => {
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
      const availability = getValue(form, 'availability');
      const message = getValue(form, 'message');
      const existingGroupSummary = getValue(form, 'existing_group_summary');
      const privacyConsent = Boolean(new FormData(form).get('privacy_consent'));

      if (!applicationType || !groupKey || !applicantName || !contactEmail || !privacyConsent) {
        showStatus(form, '필수 항목과 개인정보 동의를 확인해 주세요.');
        return;
      }

      const payload = {
        application_type: applicationType,
        group_key: groupKey,
        group_title: groupLabels[groupKey] || '기타 목적형 모임',
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
      showStatus(form, '신청이 접수되었습니다. 확인 후 연락드리겠습니다.', 'success');
    });
  });
})();
