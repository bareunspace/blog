(() => {
  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  loadScript('/scripts/admin-community-core.js?v=20260814-1')
    .then(() => loadScript('/scripts/admin-reservation-name.js?v=20260814-1'))
    .catch((error) => console.error('admin dashboard script load failed', error));
})();
