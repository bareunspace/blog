(() => {
  const configNode = document.getElementById('adminAuthConfig');
  if (!configNode) return;

  const parseConfig = () => {
    try { return JSON.parse(configNode.textContent || '{}'); }
    catch (error) { return {}; }
  };

  const config = parseConfig();
  const supabaseUrl = (config.supabaseUrl || '').trim();
  const supabaseAnonKey = (config.supabaseAnonKey || '').trim();
  const siteUrl = (config.siteUrl || window.location.origin).trim();
  const loginPath = config.loginPath || '/admin-login.html';
  const dashboardPath = config.dashboardPath || '/admin.html';

  const statusNode = document.getElementById('adminAuthStatus');
  const showStatus = (message, kind = 'error') => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.hidden = false;
    statusNode.classList.remove('is-error', 'is-success');
    statusNode.classList.add(kind === 'success' ? 'is-success' : 'is-error');
  };

  const getAuthErrorDetail = (error) => {
    if (!error) return '';
    const detail = [error.message, error.code, error.status ? `status ${error.status}` : ''].filter(Boolean).join(' / ');
    return detail ? ` Supabase 오류: ${detail}` : ' Supabase 오류 상세를 불러오지 못했습니다.';
  };

  const isLoginPage = Boolean(document.getElementById('adminLoginRoot'));
  const isDashboardPage = Boolean(document.getElementById('adminDashboardRoot'));

  if (!supabaseUrl || !supabaseAnonKey) {
    showStatus('Supabase 설정이 비어 있습니다.');
    return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    showStatus('Supabase SDK를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  const isAllowedAdmin = async (email = '') => {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) return false;
    const { data, error } = await client
      .from('admin_users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (error) {
      console.error('Admin authorization lookup failed', error);
      return false;
    }
    return Boolean(data?.email);
  };

  const goTo = (path) => {
    if (window.location.pathname !== path) window.location.replace(path);
  };

  const getRecoveryParams = () => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return {
      isRecovery: hashParams.get('type') === 'recovery',
      accessToken: hashParams.get('access_token') || '',
      refreshToken: hashParams.get('refresh_token') || ''
    };
  };

  const signOutAndGoLogin = async (message) => {
    await client.auth.signOut();
    const loginUrl = new URL(loginPath, window.location.origin);
    if (message) loginUrl.searchParams.set('reason', message);
    window.location.replace(loginUrl.toString());
  };

  const syncLoginReason = () => {
    if (!isLoginPage) return;
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason) showStatus(decodeURIComponent(reason));
  };

  const boot = async () => {
    syncLoginReason();
    const recoveryParams = getRecoveryParams();
    if (recoveryParams.isRecovery && recoveryParams.accessToken && recoveryParams.refreshToken) {
      await client.auth.setSession({ access_token: recoveryParams.accessToken, refresh_token: recoveryParams.refreshToken });
    }

    const { data, error } = await client.auth.getUser();
    if (error && isDashboardPage) {
      await signOutAndGoLogin('로그인 세션을 확인할 수 없어 다시 로그인해 주세요.');
      return;
    }

    const currentUser = error ? null : (data?.user || null);
    const email = (currentUser?.email || '').toLowerCase();
    const authorized = currentUser ? await isAllowedAdmin(email) : false;

    if (isLoginPage) {
      const form = document.getElementById('adminLoginForm');
      const resetForm = document.getElementById('adminPasswordResetForm');

      if (recoveryParams.isRecovery && recoveryParams.accessToken) {
        if (!currentUser) {
          showStatus('비밀번호 재설정 세션을 확인하지 못했습니다. 리셋 메일을 다시 요청해 주세요.');
          return;
        }
        if (!authorized) {
          await client.auth.signOut();
          showStatus('관리자 권한이 없는 계정입니다.');
          return;
        }
        if (form) form.hidden = true;
        if (resetForm) {
          resetForm.hidden = false;
          resetForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const passwordValue = document.getElementById('adminNewPassword')?.value || '';
            const confirmValue = document.getElementById('adminNewPasswordConfirm')?.value || '';
            if (passwordValue.length < 8) return showStatus('새 비밀번호는 8자 이상으로 입력해 주세요.');
            if (passwordValue !== confirmValue) return showStatus('새 비밀번호와 확인 입력이 일치하지 않습니다.');
            const { error: updateError } = await client.auth.updateUser({ password: passwordValue });
            if (updateError) return showStatus('비밀번호를 저장하지 못했습니다. 리셋 링크가 만료되었으면 다시 요청해 주세요.');
            await signOutAndGoLogin('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.');
          });
        }
        showStatus('새 비밀번호를 입력해 주세요.', 'success');
        return;
      }

      if (authorized) {
        goTo(dashboardPath);
        return;
      }
      if (!form) return;

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const emailValue = (document.getElementById('adminEmail')?.value || '').trim();
        const passwordValue = document.getElementById('adminPassword')?.value || '';
        if (!emailValue || !passwordValue) return showStatus('이메일과 비밀번호를 모두 입력해 주세요.');

        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email: emailValue, password: passwordValue });
        if (signInError) return showStatus('로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해 주세요.');

        const signedInEmail = (signInData?.user?.email || '').toLowerCase();
        if (!(await isAllowedAdmin(signedInEmail))) {
          await client.auth.signOut();
          showStatus('관리자 권한이 없는 계정입니다.');
          return;
        }
        showStatus('로그인되었습니다. 관리자 페이지로 이동합니다.', 'success');
        goTo(dashboardPath);
      });
      return;
    }

    if (isDashboardPage) {
      if (!authorized) {
        await signOutAndGoLogin('관리자 인증이 필요합니다.');
        return;
      }

      const userInfo = document.getElementById('adminUserInfo');
      if (userInfo) {
        userInfo.hidden = false;
        userInfo.textContent = `로그인 계정: ${currentUser.email}`;
      }
      const signOutButton = document.getElementById('adminSignOutBtn');
      if (signOutButton) signOutButton.addEventListener('click', async () => { await client.auth.signOut(); goTo(loginPath); });

      const accountForm = document.querySelector('[data-admin-password-reset-form]');
      const accountStatus = document.querySelector('[data-admin-account-status]');
      const showAccountStatus = (message, kind = 'error') => {
        if (!accountStatus) return;
        accountStatus.textContent = message;
        accountStatus.hidden = false;
        accountStatus.classList.remove('is-error', 'is-success');
        accountStatus.classList.add(kind === 'success' ? 'is-success' : 'is-error');
      };

      if (accountForm) {
        const emailInput = accountForm.querySelector('input[name="email"]');
        if (emailInput && !emailInput.value) emailInput.value = currentUser.email || '';
        accountForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const targetEmail = (emailInput?.value || '').trim().toLowerCase();
          if (!targetEmail) return showAccountStatus('비밀번호를 재설정할 관리자 이메일을 입력해 주세요.');
          if (!(await isAllowedAdmin(targetEmail))) return showAccountStatus('Supabase 관리자 목록에 등록되지 않은 이메일입니다.');
          const resetUrl = new URL(loginPath, siteUrl);
          const { error: resetError } = await client.auth.resetPasswordForEmail(targetEmail, { redirectTo: resetUrl.toString() });
          if (resetError) return showAccountStatus(`리셋 메일을 보내지 못했습니다.${getAuthErrorDetail(resetError)}`);
          showAccountStatus(`${targetEmail} 주소로 비밀번호 리셋 메일을 보냈습니다.`, 'success');
        });
      }

      window.barunjariAdmin = { client, currentUser, isAllowedAdmin };
      window.dispatchEvent(new CustomEvent('barunjari:admin-ready', { detail: { email: currentUser.email } }));
    }
  };

  boot().catch((error) => {
    console.error(error);
    showStatus('인증 초기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  });
})();
