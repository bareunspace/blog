(() => {
  const configNode = document.getElementById('adminAuthConfig');
  if (!configNode) {
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
  const loginPath = config.loginPath || '/admin-login.html';
  const dashboardPath = config.dashboardPath || '/admin.html';
  const allowedAdmins = Array.isArray(config.allowedAdmins)
    ? config.allowedAdmins
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const statusNode = document.getElementById('adminAuthStatus');
  const showStatus = (message, kind = 'error') => {
    if (!statusNode) {
      return;
    }
    statusNode.textContent = message;
    statusNode.hidden = false;
    statusNode.classList.remove('is-error', 'is-success');
    statusNode.classList.add(kind === 'success' ? 'is-success' : 'is-error');
  };

  const isLoginPage = Boolean(document.getElementById('adminLoginRoot'));
  const isDashboardPage = Boolean(document.getElementById('adminDashboardRoot'));

  if (!supabaseUrl || !supabaseAnonKey) {
    showStatus('Supabase 설정이 비어 있습니다. _config.yml의 supabase_url, supabase_anon_key를 입력해 주세요.');
    return;
  }

  if (!allowedAdmins.length) {
    showStatus('관리자 허용 이메일 목록이 비어 있습니다. _config.yml의 admin_allowed_emails를 설정해 주세요.');
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    showStatus('Supabase SDK를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  const isAllowedAdmin = (email = '') => {
    return allowedAdmins.includes(String(email).trim().toLowerCase());
  };

  const goTo = (path) => {
    if (window.location.pathname === path) {
      return;
    }
    window.location.replace(path);
  };

  const signOutAndGoLogin = async (message) => {
    await client.auth.signOut();
    const loginUrl = new URL(loginPath, window.location.origin);
    if (message) {
      loginUrl.searchParams.set('reason', message);
    }
    window.location.replace(loginUrl.toString());
  };

  const syncLoginReason = () => {
    if (!isLoginPage) {
      return;
    }
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (!reason) {
      return;
    }
    showStatus(decodeURIComponent(reason));
  };

  const boot = async () => {
    syncLoginReason();

    const { data, error } = await client.auth.getUser();
    if (error && isDashboardPage) {
      await signOutAndGoLogin('로그인 세션을 확인할 수 없어 다시 로그인해 주세요.');
      return;
    }

    const currentUser = error ? null : (data?.user || null);
    const email = (currentUser?.email || '').toLowerCase();
    const authorized = currentUser && isAllowedAdmin(email);

    if (isLoginPage) {
      if (authorized) {
        goTo(dashboardPath);
        return;
      }

      const form = document.getElementById('adminLoginForm');
      if (!form) {
        return;
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById('adminEmail');
        const passwordInput = document.getElementById('adminPassword');
        const emailValue = (emailInput?.value || '').trim();
        const passwordValue = passwordInput?.value || '';

        if (!emailValue || !passwordValue) {
          showStatus('이메일과 비밀번호를 모두 입력해 주세요.');
          return;
        }

        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue
        });

        if (signInError) {
          showStatus('로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해 주세요.');
          return;
        }

        const signedInEmail = (signInData?.user?.email || '').toLowerCase();
        if (!isAllowedAdmin(signedInEmail)) {
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
      if (signOutButton) {
        signOutButton.addEventListener('click', async () => {
          await client.auth.signOut();
          goTo(loginPath);
        });
      }

      window.barunjariAdmin = {
        client,
        currentUser,
        allowedAdmins
      };
      window.dispatchEvent(new CustomEvent('barunjari:admin-ready', {
        detail: {
          email: currentUser.email
        }
      }));
    }
  };

  boot().catch(() => {
    showStatus('인증 초기화 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  });
})();
