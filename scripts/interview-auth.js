(() => {
  const configNode = document.getElementById('interviewAuthConfig');
  const panel = document.querySelector('[data-interview-auth]');
  if (!configNode || !panel) return;

  const titleNode = panel.querySelector('[data-interview-auth-title]');
  const messageNode = panel.querySelector('[data-interview-auth-message]');
  const loginButtons = Array.from(panel.querySelectorAll('[data-interview-auth-login]'));
  const logoutButton = panel.querySelector('[data-interview-auth-logout]');

  const parseConfig = () => {
    try { return JSON.parse(configNode.textContent || '{}'); }
    catch (_) { return {}; }
  };

  const setMessage = (title, message) => {
    if (titleNode) titleNode.textContent = title;
    if (messageNode) messageNode.textContent = message;
  };

  const setBusy = (busy) => {
    loginButtons.forEach((button) => { button.disabled = busy; });
    if (logoutButton) logoutButton.disabled = busy;
  };

  const config = parseConfig();
  const supabaseUrl = (config.supabaseUrl || '').trim();
  const supabaseAnonKey = (config.supabaseAnonKey || '').trim();
  const redirectPath = config.redirectPath || '/interview/';
  const siteUrl = (config.siteUrl || window.location.origin).trim();

  panel.hidden = false;

  if (!supabaseUrl || !supabaseAnonKey || !window.supabase || typeof window.supabase.createClient !== 'function') {
    setMessage('로그인 준비 중 문제가 생겼습니다', '잠시 후 다시 시도해 주세요. 기기 안에 저장된 면접 준비 기록은 그대로 사용할 수 있습니다.');
    loginButtons.forEach((button) => { button.hidden = true; });
    if (logoutButton) logoutButton.hidden = true;
    return;
  }

  const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  const redirectTo = new URL(redirectPath, siteUrl).toString();
  let currentUser = null;
  let syncedUserId = '';

  const ANALYTICS_SESSION_KEYS = {
    loginView: 'bareunjari_interview_login_view_tracked',
    loginClick: 'bareunjari_interview_login_click_tracked',
    loginSuccess: 'bareunjari_interview_login_success_tracked',
    resume: 'bareunjari_interview_resume_tracked',
    loginStatus: 'bareunjari_interview_login_status',
    completedCount: 'bareunjari_interview_completed_count',
    resumeSeen: 'bareunjari_interview_resume_seen',
    authProvider: 'bareunjari_interview_auth_provider',
    selectedProvider: 'bareunjari_interview_selected_provider'
  };

  const sessionGet = (key) => {
    try { return window.sessionStorage.getItem(key) || ''; }
    catch (_) { return ''; }
  };

  const sessionSet = (key, value) => {
    try { window.sessionStorage.setItem(key, String(value)); }
    catch (_) {}
  };

  const countCompleted = (state) => Object.keys(state?.tasks || {})
    .filter((taskId) => state.tasks?.[taskId]?.completed_at)
    .length;

  const isDebugMode = () => {
    try {
      const query = new URLSearchParams(window.location.search || '');
      return query.get('ga_debug') === '1' || query.get('debug_mode') === '1';
    } catch (_) {
      return false;
    }
  };

  const trackOnce = (eventName, sessionKey, params = {}) => {
    if (sessionKey && sessionGet(sessionKey)) return;
    if (sessionKey) sessionSet(sessionKey, '1');
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      page_path: window.location.pathname,
      auth_provider: params.auth_provider || sessionGet(ANALYTICS_SESSION_KEYS.authProvider) || sessionGet(ANALYTICS_SESSION_KEYS.selectedProvider) || 'unknown',
      feature_area: 'interview_journey',
      debug_mode: isDebugMode() || undefined,
      ...params
    });
  };

  trackOnce('login_view', ANALYTICS_SESSION_KEYS.loginView, {
    login_surface: 'interview_auth_panel'
  });

  const normalizeProvider = (value) => {
    const provider = String(value || '').toLowerCase();
    if (provider.includes('kakao')) return 'kakao';
    if (provider.includes('google')) return 'google';
    return '';
  };

  const providerLabel = (provider) => {
    const normalized = normalizeProvider(provider);
    if (normalized === 'kakao') return '카카오';
    if (normalized === 'google') return 'Google';
    return '소셜';
  };

  const providerFromUser = (user) => {
    const candidates = [
      user?.app_metadata?.provider,
      ...(Array.isArray(user?.app_metadata?.providers) ? user.app_metadata.providers : []),
      ...(Array.isArray(user?.identities) ? user.identities.map((identity) => identity?.provider) : []),
      ...(Array.isArray(user?.identities) ? user.identities.map((identity) => identity?.identity_data?.provider) : []),
      sessionGet(ANALYTICS_SESSION_KEYS.authProvider),
      sessionGet(ANALYTICS_SESSION_KEYS.selectedProvider)
    ];
    return candidates.map(normalizeProvider).find(Boolean) || 'unknown';
  };

  const waitForJourney = () => new Promise((resolve) => {
    if (window.BareunjariInterviewJourney) {
      resolve(window.BareunjariInterviewJourney);
      return;
    }
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.BareunjariInterviewJourney || attempts > 40) {
        window.clearInterval(timer);
        resolve(window.BareunjariInterviewJourney || null);
      }
    }, 125);
  });

  const saveJourneyState = async (user, state) => {
    if (!user?.id || !state) return { error: null };
    return client
      .from('interview_journey_states')
      .upsert({ user_id: user.id, state }, { onConflict: 'user_id' });
  };

  const syncJourneyState = async (user) => {
    const journey = await waitForJourney();
    if (!user?.id || !journey) return;

    const { data, error } = await client
      .from('interview_journey_states')
      .select('state')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    const localState = journey.getState();
    const mergedState = data?.state ? journey.mergeStates(localState, data.state) : localState;
    const localCompletedCount = countCompleted(localState);
    const remoteCompletedCount = countCompleted(data?.state);
    const mergedCompletedCount = countCompleted(mergedState);
    journey.setState(mergedState, 'sync');

    const { error: saveError } = await saveJourneyState(user, journey.getState());
    if (saveError) throw saveError;
    syncedUserId = user.id;

    sessionSet(ANALYTICS_SESSION_KEYS.completedCount, mergedCompletedCount);
    if (mergedCompletedCount > 0) {
      sessionSet(ANALYTICS_SESSION_KEYS.resumeSeen, '1');
      trackOnce('interview_resume', ANALYTICS_SESSION_KEYS.resume, {
        completed_count: mergedCompletedCount,
        local_completed_count: localCompletedCount,
        remote_completed_count: remoteCompletedCount,
        resume_source: remoteCompletedCount > 0 ? 'account_or_merged' : 'current_device'
      });
    }
  };

  const render = (user) => {
    const email = user?.email || '';
    if (user) {
      const provider = providerFromUser(user);
      sessionSet(ANALYTICS_SESSION_KEYS.loginStatus, 'signed_in');
      sessionSet(ANALYTICS_SESSION_KEYS.authProvider, provider);
      setMessage(`${providerLabel(provider)} 로그인됨`, email ? `${email} 계정으로 로그인되어 있습니다. 면접 준비 상태를 다른 기기에서도 이어볼 수 있습니다.` : `${providerLabel(provider)} 계정으로 로그인되어 있습니다. 면접 준비 상태를 다른 기기에서도 이어볼 수 있습니다.`);
      loginButtons.forEach((button) => { button.hidden = true; });
      if (logoutButton) logoutButton.hidden = false;
      return;
    }
    sessionSet(ANALYTICS_SESSION_KEYS.loginStatus, 'signed_out');
    setMessage('로그인하기', '로그인하면 면접 준비 상태를 계정에 저장해 다른 기기에서도 이어볼 수 있습니다.');
    loginButtons.forEach((button) => { button.hidden = false; });
    if (logoutButton) logoutButton.hidden = true;
  };

  const refresh = async () => {
    const { data, error } = await client.auth.getUser();
    currentUser = error ? null : data?.user || null;
    render(currentUser);
    if (currentUser) {
      trackOnce('login_success', ANALYTICS_SESSION_KEYS.loginSuccess, {
        login_surface: 'interview_auth_panel',
        auth_provider: providerFromUser(currentUser)
      });
      syncJourneyState(currentUser).catch(() => {
        setMessage(`${providerLabel(providerFromUser(currentUser))} 로그인됨`, '로그인은 되어 있지만 준비 상태 동기화가 잠시 지연되고 있습니다. 이 기기의 기록은 그대로 남아 있습니다.');
      });
    }
  };

  loginButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const provider = button.dataset.interviewAuthProvider === 'kakao' ? 'kakao' : 'google';
      sessionSet(ANALYTICS_SESSION_KEYS.selectedProvider, provider);
      trackOnce('login_click', `${ANALYTICS_SESSION_KEYS.loginClick}_${provider}`, {
        login_surface: 'interview_auth_panel',
        auth_provider: provider
      });
      setBusy(true);
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo }
      });
      if (error) {
        setBusy(false);
        setMessage(`${providerLabel(provider)} 로그인을 시작하지 못했습니다`, '잠시 후 다시 시도해 주세요. 기기 안에 저장된 준비 기록은 그대로 남아 있습니다.');
      }
    });
  });

  logoutButton?.addEventListener('click', async () => {
    setBusy(true);
    const { error } = await client.auth.signOut();
    setBusy(false);
    if (error) {
      setMessage('로그아웃하지 못했습니다', '잠시 후 다시 시도해 주세요. 기기 안에 저장된 준비 기록은 그대로 남아 있습니다.');
      return;
    }
    sessionSet(ANALYTICS_SESSION_KEYS.authProvider, '');
    sessionSet(ANALYTICS_SESSION_KEYS.selectedProvider, '');
    render(null);
  });

  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    render(currentUser);
    setBusy(false);
    if (currentUser && currentUser.id !== syncedUserId) {
      trackOnce('login_success', ANALYTICS_SESSION_KEYS.loginSuccess, {
        login_surface: 'interview_auth_panel',
        auth_provider: providerFromUser(currentUser)
      });
      syncJourneyState(currentUser).catch(() => {
        setMessage(`${providerLabel(providerFromUser(currentUser))} 로그인됨`, '로그인은 되어 있지만 준비 상태 동기화가 잠시 지연되고 있습니다. 이 기기의 기록은 그대로 남아 있습니다.');
      });
    }
  });

  window.addEventListener('bareunjari:interview-journey-change', (event) => {
    if (!currentUser || event.detail?.action === 'sync') return;
    sessionSet(ANALYTICS_SESSION_KEYS.completedCount, countCompleted(event.detail?.state));
    saveJourneyState(currentUser, event.detail?.state).catch(() => {
      setMessage('준비 상태 저장 지연', '기록은 이 기기에 남아 있습니다. 연결이 안정되면 다시 저장을 시도해 주세요.');
    });
  });

  refresh().catch(() => render(null));
})();
