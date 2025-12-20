// Dashboard: Kategori dağılımı
(async () => {
  const list = document.querySelector('[data-role="category-distribution-list"]');
  if (!list) return;

  list.innerHTML = '<li class="text-muted">Yükleniyor...</li>';

  try {
    const data = await apiFetch('/dashboard/category-distribution');
    const items = data?.distribution || [];

    if (!items.length) {
      list.innerHTML = '<li class="text-muted">Kayıt yok</li>';
      return;
    }

    list.innerHTML = items
      .map(
        (c) => `
        <li class="d-flex justify-content-between">
          <span>${c.category_name || 'Diğer'}</span>
          <small>${c.percentage.toFixed(2)}%</small>
        </li>
      `
      )
      .join('');
  } catch (err) {
    console.error(err);
    list.innerHTML = '<li class="text-danger">Hata oluştu</li>';
  }
})();

