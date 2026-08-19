(() => {
  const root = document.getElementById('adminReservations');
  if (!root) return;
  const tools = root.querySelector('.admin-community-tools');
  const list = root.querySelector('[data-reservations-list]');
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
      const nameInput = card.querySelector('[data-reservation-name-input]');
      const name = String(nameInput?.value || card.textContent || '').toLowerCase();
      card.hidden = Boolean(query) && !name.includes(query);
    });
  };

  input.addEventListener('input', apply);
  list.addEventListener('input', (event) => {
    if (event.target.closest('[data-reservation-name-input]')) apply();
  });
  new MutationObserver(apply).observe(list, { childList: true });
})();
