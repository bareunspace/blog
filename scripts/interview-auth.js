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

  const render = (user) => {
    const email = user?.email || '';
    if (user) {
      setMessage('Google 로그인됨', email ? `${email} 계정으로 로그인되어 있습니다. 이 기기의 면접 준비 기록은 계속 유지됩니다.` : 'Google 계정으로 로그인되어 있습니다. 이 기기의 면접 준비 기록은 계속 유지됩니다.');
      if (loginButton) loginButton.hidden = true;
      if (logoutButton) logoutButton.hidden = false;
      return;
    }
    setMessage('Google로 로그인하기', 'Google 계정으로 로그인할 수 있습니다. 지금 쓰는 기기의 면접 준비 기록은 그대로 유지됩니다.');
    if (loginButton) loginButton.hidden = false;
    if (logoutButton) logoutButton.hidden = true;
  };

  const refresh = async () => {
    const { data, error } = await client.auth.getUser();
    render(error ? null : data?.user || null);
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
    render(session?.user || null);
    setBusy(false);
  });

  refresh().catch(() => render(null));
})();
