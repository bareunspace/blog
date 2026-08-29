(() => {
  const configNode = document.getElementById('interviewAuthConfig');
  const panel = document.querySelector('[data-interview-auth]');
  if (!configNode || !panel) return;

  const titleNode = panel.querySelector('[data-interview-auth-title]');
  const messageNode = panel.querySelector('[data-interview-auth-message]');
  const loginButton = panel.querySelector('[data-interview-auth-login]');
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
    if (loginButton) loginButton.disabled = busy;
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
    if (loginButton) loginButton.hidden = true;
    if (logoutButton) logoutButton.hidden = true;
    return;
  }

  const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  const redirectTo = new URL(redirectPath, siteUrl).toString();
  let currentUser = null;
  let syncedUserId = '';

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
    journey.setState(mergedState, 'sync');

    const { error: saveError } = await saveJourneyState(user, journey.getState());
    if (saveError) throw saveError;
    syncedUserId = user.id;
  };

  const render = (user) => {
    const email = user?.email || '';
    if (user) {
      setMessage('Google 로그인됨', email ? `${email} 계정으로 로그인되어 있습니다. 면접 준비 상태를 다른 기기에서도 이어볼 수 있습니다.` : 'Google 계정으로 로그인되어 있습니다. 면접 준비 상태를 다른 기기에서도 이어볼 수 있습니다.');
      if (loginButton) loginButton.hidden = true;
      if (logoutButton) logoutButton.hidden = false;
      return;
    }
    setMessage('Google로 로그인하기', '로그인하면 면접 준비 상태를 계정에 저장해 다른 기기에서도 이어볼 수 있습니다.');
    if (loginButton) loginButton.hidden = false;
    if (logoutButton) logoutButton.hidden = true;
  };

  const refresh = async () => {
    const { data, error } = await client.auth.getUser();
    currentUser = error ? null : data?.user || null;
    render(currentUser);
    if (currentUser) {
      syncJourneyState(currentUser).catch(() => {
        setMessage('Google 로그인됨', '로그인은 되어 있지만 준비 상태 동기화가 잠시 지연되고 있습니다. 이 기기의 기록은 그대로 남아 있습니다.');
      });
    }
  };

  loginButton?.addEventListener('click', async () => {
    setBusy(true);
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      setBusy(false);
      setMessage('Google 로그인을 시작하지 못했습니다', '잠시 후 다시 시도해 주세요. 기기 안에 저장된 준비 기록은 그대로 남아 있습니다.');
    }
  });

  logoutButton?.addEventListener('click', async () => {
    setBusy(true);
    const { error } = await client.auth.signOut();
    setBusy(false);
    if (error) {
      setMessage('로그아웃하지 못했습니다', '잠시 후 다시 시도해 주세요. 기기 안에 저장된 준비 기록은 그대로 남아 있습니다.');
      return;
    }
    render(null);
  });

  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    render(currentUser);
    setBusy(false);
    if (currentUser && currentUser.id !== syncedUserId) {
      syncJourneyState(currentUser).catch(() => {
        setMessage('Google 로그인됨', '로그인은 되어 있지만 준비 상태 동기화가 잠시 지연되고 있습니다. 이 기기의 기록은 그대로 남아 있습니다.');
      });
    }
  });

  window.addEventListener('bareunjari:interview-journey-change', (event) => {
    if (!currentUser || event.detail?.action === 'sync') return;
    saveJourneyState(currentUser, event.detail?.state).catch(() => {
      setMessage('준비 상태 저장 지연', '기록은 이 기기에 남아 있습니다. 연결이 안정되면 다시 저장을 시도해 주세요.');
    });
  });

  refresh().catch(() => render(null));
})();
