// Categories stats - Display category statistics
(() => {
  const { apiFetch } = window.API;

  const selectors = {
    totalCategories: document.getElementById('total_categories'),
    totalActiveCategories: document.getElementById('total_active_categories'),
    maxAssetCategory: document.getElementById('max_asset_category'),
    totalEmptyCategories: document.getElementById('total_empty_categories'),
  };

  const clearAlert = () => {
    const existing = document.querySelector('[data-role="category-stats-alert"]');
    if (existing?.parentElement) existing.parentElement.removeChild(existing);
  };

  const showAlert = (message, variant = 'danger') => {
    clearAlert();
    const container = document.querySelector('.container-xxl');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${variant} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.dataset.role = 'category-stats-alert';
    alert.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Kapat');

    alert.appendChild(closeButton);
    container.prepend(alert);
  };

  const setMetricValue = (el, value) => {
    if (!el) return;
    el.textContent = value;
  };

  const formatMaxCategory = (category) => {
    if (!category) return '-';
    const name = category.name || 'Kategori bulunamadı';
    const assetCount = Number.isFinite(Number(category.asset_count)) ? Number(category.asset_count) : null;
    return assetCount && assetCount > 0 ? `${name} (${assetCount})` : name;
  };

  const renderStats = (stats) => {
    const total = Number.isFinite(Number(stats?.total_categories)) ? Number(stats.total_categories) : '-';
    const active = Number.isFinite(Number(stats?.total_active_categories)) ? Number(stats.total_active_categories) : '-';
    const empty = Number.isFinite(Number(stats?.total_empty_categories)) ? Number(stats.total_empty_categories) : '-';

    setMetricValue(selectors.totalCategories, total);
    setMetricValue(selectors.totalActiveCategories, active);
    setMetricValue(selectors.totalEmptyCategories, empty);
    setMetricValue(selectors.maxAssetCategory, formatMaxCategory(stats?.max_asset_category));
  };

  const init = async () => {
    try {
      const stats = await apiFetch('/asset-categories/stats');
      renderStats(stats);
      clearAlert();
    } catch (error) {
      console.error('Kategori istatistikleri yüklenemedi:', error);
      renderStats({});
      showAlert('Kategori istatistikleri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

