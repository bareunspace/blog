(() => {
  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Always request fresh admin modules so saved reservation fields appear immediately.
  const cacheKey = Date.now();
  loadScript(`/scripts/admin-community-core.js?v=${cacheKey}`)
    .then(() => loadScript(`/scripts/admin-learning.js?v=${cacheKey}`))
    .then(() => loadScript(`/scripts/admin-reservation-name.js?v=${cacheKey}`))
    .then(() => loadScript(`/scripts/admin-reservation-purpose.js?v=${cacheKey}`))
    .then(() => loadScript(`/scripts/admin-reservation-name-search.js?v=${cacheKey}`))
    .then(() => loadScript(`/scripts/admin-reservation-message-dry-run.js?v=${cacheKey}`))
    .catch((error) => console.error('admin dashboard script load failed', error));
})();
