(() => {
  const root = document.getElementById('adminReservations');
  if (!root) return;
  const tools = root.querySelector('.admin-community-tools');
  const list = root.querySelector('[data-reservations-list]');
  const rangeFilter = root.querySelector('[data-reservations-range-filter]');
  if (!tools || !list || tools.querySelector('[data-reservations-name-filter]')) return;

  const label = document.createElement('label');
  label.className = 'admin-filter';
  label.innerHTML = '이름<input type="search" data-reservations-name-filter placeholder="예약자 이름 검색" autocomplete="off" />';
  const numberFilter = tools.querySelector('[data-reservations-query-filter]')?.closest('label');
  if (numberFilter) numberFilter.insertAdjacentElement('afterend', label);
  else tools.appendChild(label);

  const input = label.querySelector('[data-reservations-name-filter]');

  const apply = () => {
    const query = String(input.value || '').trim().toLowerCase();
    list.querySelectorAll('[data-reservation-id]').forEach((card) => {
      const adminNameInput = card.querySelector('[data-reservation-customer-name]');
      const headingName = card.querySelector('.admin-community-item-head h3');
      const originalName = card.querySelector('[data-reservation-original-name]');
      const searchableName = [
        adminNameInput?.value,
        headingName?.textContent,
        originalName?.textContent
      ].filter(Boolean).join(' ').toLowerCase();
      card.hidden = Boolean(query) && !searchableName.includes(query);
    });
  };

  input.addEventListener('input', () => {
    const query = String(input.value || '').trim();
    // Name search is expected to find a reservation regardless of today's default range.
    if (query && rangeFilter && rangeFilter.value !== 'all') {
      rangeFilter.value = 'all';
      rangeFilter.dispatchEvent(new Event('change', { bubbles: true }));
      window.setTimeout(apply, 0);
      return;
    }
    apply();
  });

  list.addEventListener('input', (event) => {
    if (event.target.closest('[data-reservation-customer-name]')) apply();
  });

  new MutationObserver(apply).observe(list, { childList: true });
})();
