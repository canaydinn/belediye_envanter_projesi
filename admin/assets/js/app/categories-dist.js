const API_BASE_URL = 'http://localhost:4000/api';

const badgeClasses = [
  'bg-label-primary',
  'bg-label-info',
  'bg-label-success',
  'bg-label-warning',
  'bg-label-secondary',
];

const selectElements = () => {
  const distributionList = document.querySelector('[data-role="category-distribution-list"]');
  const alertBox = document.querySelector('[data-role="category-distribution-alert"]');

  return { distributionList, alertBox };
};

const formatCountLabel = (count) => {
  const safeCount = Number.isFinite(count) ? count : 0;
  const formatted = new Intl.NumberFormat('tr-TR').format(safeCount);
  return `${formatted} kategori`;
};

const getBadgeClass = (index) => badgeClasses[index % badgeClasses.length];

const createStatusItem = (message) => {
  const listItem = document.createElement('li');
  listItem.className = 'text-muted';
  listItem.textContent = message;
  return listItem;
};

const clearAlert = (alertBox) => {
  if (!alertBox) return;
  alertBox.className = 'alert alert-info d-none';
  alertBox.textContent = '';
};

const showAlert = (alertBox, message, variant = 'danger') => {
  if (!alertBox) return;

  alertBox.className = `alert alert-${variant}`;
  alertBox.textContent = message;
};

const renderDistribution = (listElement, alertBox, categories) => {
  if (!listElement) return;

  listElement.replaceChildren();

  if (!Array.isArray(categories) || categories.length === 0) {
    clearAlert(alertBox);
    listElement.appendChild(createStatusItem('Henüz kategori eklenmemiş.'));
    return;
  }

  clearAlert(alertBox);

  categories.forEach((category, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'd-flex justify-content-between align-items-center mb-2';

    if (index === categories.length - 1) {
      listItem.classList.remove('mb-2');
    }

    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'd-flex align-items-center';

    const badge = document.createElement('span');
    badge.className = `badge ${getBadgeClass(index)} rounded-pill me-2`;
    badge.textContent = '●';

    const label = document.createElement('span');
    label.textContent = category?.name || 'Bilinmeyen Kategori';

    labelWrapper.append(badge, label);

    const count = document.createElement('span');
    count.className = 'fw-semibold';
    count.textContent = formatCountLabel(Number(category?.asset_count));

    listItem.append(labelWrapper, count);
    listElement.appendChild(listItem);
  });
};

const fetchCategoryDistribution = async () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/asset-categories/distribution`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || 'Kategoriler alınamadı. Lütfen daha sonra tekrar deneyin.');
  }

  try {
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error('Sunucu yanıtı beklenen formatta değil.');
  }
};

const initPage = () => {
  document.addEventListener('DOMContentLoaded', async () => {
    const { distributionList, alertBox } = selectElements();

    if (!distributionList) {
      console.warn('Kategori dağılımı listesi bulunamadı.');
      return;
    }

    distributionList.replaceChildren(createStatusItem('Kategori türleri yükleniyor...'));

    try {
      const distribution = await fetchCategoryDistribution();
      renderDistribution(distributionList, alertBox, distribution);
    } catch (error) {
      console.error('Kategori dağılımı alınırken hata oluştu:', error);
      showAlert(alertBox, 'Kategori bilgileri yüklenirken bir hata oluştu.');
      distributionList.replaceChildren(createStatusItem('Kategoriler yüklenemedi.'));
    }
  });
};

initPage();