// Recent assets - Show recently added assets
(async () => {
  const tableBody = document.querySelector('[data-role="recent-assets-body"]');
  if (!tableBody) return;

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR');
  };

  tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Yükleniyor...</td></tr>';

  try {
    const assets = await apiFetch('/assets/recent-assets', { method: 'GET' });

    if (!Array.isArray(assets) || !assets.length) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Henüz varlık eklenmemiş.</td></tr>';
      return;
    }

    tableBody.innerHTML = assets
      .map(
        (a) => `
        <tr data-asset-id="${a.id}">
          <td>${a.name || '-'}</td>
          <td>${formatDate(a.created_at)}</td>
          <td>${a.department_name || '-'}</td>
        </tr>`
      )
      .join('');
  } catch (err) {
    console.error('Son eklenen varlıklar alınamadı:', err);
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Yüklenemedi</td></tr>';
  }
})();

