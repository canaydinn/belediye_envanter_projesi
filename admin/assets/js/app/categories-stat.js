const API_BASE_URL = 'http://localhost:4000/api';

const selectors = {
  totalCategories: document.getElementById('total_categories'),
  totalActiveCategories: document.getElementById('total_active_categories'),
  maxAssetCategory: document.getElementById('max_asset_category'),
  totalEmptyCategories: document.getElementById('total_empty_categories'),
};

const clearAlert = () => {
  const existingAlert = document.querySelector('[data-role="category-stats-alert"]');
  if (existingAlert?.parentElement) {
    existingAlert.parentElement.removeChild(existingAlert);
  }
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

const setMetricValue = (element, value) => {
  if (!element) return;
  element.textContent = value;
};

const formatMaxCategory = (category) => {
  if (!category) return '-';

  const name = category.name || 'Kategori bulunamadı';
  const assetCount = Number.isFinite(Number(category.asset_count))
    ? Number(category.asset_count)
    : null;

  if (assetCount && assetCount > 0) {
    return `${name} (${assetCount})`;
  }

  return name;
};

const renderStats = (stats) => {
  const totalCategoriesValue = Number.isFinite(Number(stats?.total_categories))
    ? Number(stats.total_categories)
    : '-';
  const totalActiveCategoriesValue = Number.isFinite(Number(stats?.total_active_categories))
    ? Number(stats.total_active_categories)
    : '-';
  const totalEmptyCategoriesValue = Number.isFinite(Number(stats?.total_empty_categories))
    ? Number(stats.total_empty_categories)
    : '-';

  setMetricValue(selectors.totalCategories, totalCategoriesValue);
  setMetricValue(selectors.totalActiveCategories, totalActiveCategoriesValue);
  setMetricValue(selectors.totalEmptyCategories, totalEmptyCategoriesValue);
  setMetricValue(selectors.maxAssetCategory, formatMaxCategory(stats?.max_asset_category));
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `İstek başarısız (status: ${response.status})`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('Sunucu yanıtı işlenemedi');
  }
};

const loadCategoryStats = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    renderStats({});
    showAlert('Oturum bulunamadı. Lütfen yeniden giriş yapın.', 'warning');
    return;
  }

  try {
    const stats = await fetchJson(`${API_BASE_URL}/asset-categories/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    renderStats(stats);
    clearAlert();
  } catch (error) {
    console.error('Kategori istatistikleri yüklenemedi:', error);
    showAlert('Kategori istatistikleri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
  }
};

const initPage = () => {
  const start = () => {
    loadCategoryStats();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
};

initPage();