// Dashboard: Yaklaşan bakımlar
(async () => {
  const tbody = document.querySelector('[data-role="upcoming-maintenance-body"]');
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="3" class="text-center text-muted">Yükleniyor...</td></tr>';

  const fmt = (v) => (v ? new Date(v).toLocaleDateString('tr-TR') : '-');

  try {
    const rows = await apiFetch('/dashboard/upcoming-maintenance');

    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="text-center text-muted">Kayıt yok</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map(
        (r) => `
        <tr>
          <td>${[r.asset_name, r.asset_code].filter(Boolean).join(' - ')}</td>
          <td>${fmt(r.due_date)}</td>
          <td><span class="badge bg-label-info">${r.status}</span></td>
        </tr>
      `
      )
      .join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center text-danger">Yüklenemedi</td></tr>';
  }
})();

