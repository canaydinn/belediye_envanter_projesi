// Dashboard: Son varlık hareketleri
(async () => {
  const tbody = document.querySelector('[data-role="recent-movements-body"]');
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center text-muted">Yükleniyor...</td></tr>';

  const fmtDate = (v) =>
    v ? new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  const fmtLoc = (d, l) => [d, l].filter(Boolean).join(' / ') || '-';

  const badge = (t) =>
    ({
      assign: 'primary',
      transfer: 'info',
      maintenance: 'warning',
      disposal: 'danger'
    }[t] || 'secondary');

  try {
    const rows = await apiFetch('/dashboard/recent-movements');

    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">Kayıt yok</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map(
        (m) => `
        <tr>
          <td>${fmtDate(m.movement_date)}</td>
          <td>${[m.asset_name, m.asset_code].filter(Boolean).join(' - ')}</td>
          <td>${fmtLoc(m.from_department_name, m.from_location_name)}</td>
          <td>${fmtLoc(m.to_department_name, m.to_location_name)}</td>
          <td><span class="badge bg-label-${badge(m.movement_type)}">${m.movement_type}</span></td>
          <td>${m.performed_by_name || '-'}</td>
        </tr>
      `
      )
      .join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Yüklenemedi</td></tr>';
  }
})();

