// Categories distribution - Display category distribution
(() => {
  const { apiFetch } = window.API;

  const badgeClasses = ['bg-label-primary', 'bg-label-info', 'bg-label-success', 'bg-label-warning', 'bg-label-secondary'];

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
    const li = document.createElement('li');
    li.className = 'text-muted';
    li.textContent = message;
    return li;
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
      const li = document.createElement('li');
      li.className = 'd-flex justify-content-between align-items-center mb-2';
      if (index === categories.length - 1) li.classList.remove('mb-2');

      const left = document.createElement('div');
      left.className = 'd-flex align-items-center';

      const badge = document.createElement('span');
      badge.className = `badge ${getBadgeClass(index)} rounded-pill me-2`;
      badge.textContent = '●';

      const label = document.createElement('span');
      label.textContent = category?.name || 'Bilinmeyen Kategori';

      left.append(badge, label);

      const count = document.createElement('span');
      count.className = 'fw-semibold';
      count.textContent = formatCountLabel(Number(category?.asset_count));

      li.append(left, count);
      listElement.appendChild(li);
    });
  };

  const init = async () => {
    const { distributionList, alertBox } = selectElements();
    if (!distributionList) return;

    distributionList.replaceChildren(createStatusItem('Kategori türleri yükleniyor...'));

    try {
      const data = await apiFetch('/asset-categories/distribution');
      const distribution = Array.isArray(data) ? data : [];
      renderDistribution(distributionList, alertBox, distribution);
    } catch (error) {
      console.error('Kategori dağılımı alınırken hata oluştu:', error);
      showAlert(alertBox, 'Kategori bilgileri yüklenirken bir hata oluştu.');
      distributionList.replaceChildren(createStatusItem('Kategoriler yüklenemedi.'));
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

