// Categories list - Load and display categories
(() => {
  const { apiFetch } = window.API;

  const createAlert = (message, type = 'danger') => {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');

    alert.appendChild(closeButton);
    return alert;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('tr-TR');
  };

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString('tr-TR') : '0';
  };

  const renderCategories = (categories, tableBody, summary) => {
    tableBody.replaceChildren();

    if (!Array.isArray(categories) || categories.length === 0) {
      const emptyRow = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.className = 'text-center text-muted';
      cell.textContent = 'Henüz kategori bulunmuyor.';
      emptyRow.appendChild(cell);
      tableBody.appendChild(emptyRow);
      summary.textContent = 'Gösterilen: 0 / 0';
      return;
    }

    categories.forEach((category) => {
      const row = document.createElement('tr');

      const codeCell = document.createElement('td');
      codeCell.textContent = category.code || '-';

      const nameCell = document.createElement('td');
      nameCell.textContent = category.name || '-';

      const assetCountCell = document.createElement('td');
      assetCountCell.textContent = formatNumber(category.asset_count);

      const statusCell = document.createElement('td');
      const isActive = category.is_active !== false;
      const badge = document.createElement('span');
      badge.className = isActive ? 'badge bg-label-success' : 'badge bg-label-secondary';
      badge.textContent = isActive ? 'Aktif' : 'Pasif';
      statusCell.appendChild(badge);

      const createdCell = document.createElement('td');
      createdCell.textContent = formatDate(category.created_at);

      const updatedCell = document.createElement('td');
      updatedCell.textContent = formatDate(category.updated_at);

      const actionsCell = document.createElement('td');
      actionsCell.className = 'd-flex gap-1';

      const detailLink = document.createElement('a');
      detailLink.href = `category-detail.html?id=${category.id}`;
      detailLink.className = 'btn btn-sm btn-icon btn-text-info';
      detailLink.title = 'Detaylar';
      detailLink.innerHTML = '<i class="ti ti-eye"></i>';

      const editLink = document.createElement('a');
      editLink.href = `category-edit.html?id=${category.id}`;
      editLink.className = 'btn btn-sm btn-icon btn-text-secondary';
      editLink.title = 'Düzenle';
      editLink.setAttribute('data-role', 'edit-category');
      editLink.setAttribute('data-rbac-mode', 'disable');
      editLink.innerHTML = '<i class="ti ti-edit"></i>';

      const deleteLink = document.createElement('a');
      deleteLink.href = `category-delete.html?id=${category.id}`;
      deleteLink.className = 'btn btn-sm btn-icon btn-text-danger';
      deleteLink.title = 'Sil';
      deleteLink.setAttribute('data-role', 'delete-category');
      deleteLink.setAttribute('data-rbac-mode', 'disable');
      deleteLink.innerHTML = '<i class="ti ti-trash"></i>';

      actionsCell.append(detailLink, editLink, deleteLink);

      row.append(codeCell, nameCell, assetCountCell, statusCell, createdCell, updatedCell, actionsCell);
      tableBody.appendChild(row);
    });

    summary.textContent = `Gösterilen: ${categories.length} / ${categories.length}`;
  };

  const init = async () => {
    const tableBody = document.getElementById('categoryTableBody');
    const summary = document.getElementById('categorySummary');
    const contentWrapper = document.querySelector('.container-xxl');

    if (!tableBody || !summary) return;

    try {
      const categories = await apiFetch('/asset-categories?limit=100');
      const items = Array.isArray(categories) ? categories.slice(0, 100) : [];
      renderCategories(items, tableBody, summary);
    } catch (error) {
      console.error('Kategori listesi yüklenirken hata:', error);
      summary.textContent = 'Kategori listesi yüklenemedi.';
      tableBody.replaceChildren();
      contentWrapper?.prepend(createAlert(error.message || 'Beklenmeyen bir hata oluştu.'));
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

