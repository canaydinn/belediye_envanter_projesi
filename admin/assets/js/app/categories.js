const API_BASE_URL = 'http://localhost:4000/api';

const getToken = () => localStorage.getItem('token');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Sunucudan geçerli JSON verisi alınamadı.');
  }
};

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
    cell.colSpan = 7; // ✅ tablo sütun sayısı: kod, ad, varlık sayısı, durum, oluşturulma, güncelleme, işlemler
    cell.className = 'text-center text-muted';
    cell.textContent = 'Henüz kategori bulunmuyor.';
    emptyRow.appendChild(cell);
    tableBody.appendChild(emptyRow);
    summary.textContent = 'Gösterilen: 0 / 0';
    return;
  }

  categories.forEach((category) => {
    const row = document.createElement('tr');

    // 1) Kod
    const codeCell = document.createElement('td');
    codeCell.textContent = category.code || '-';

    // 2) Kategori adı
    const nameCell = document.createElement('td');
    nameCell.textContent = category.name || '-';

    // 3) Varlık sayısı
    const assetCountCell = document.createElement('td');
    assetCountCell.textContent = formatNumber(category.asset_count);

    // 4) Durum (badge)
    const statusCell = document.createElement('td');
    const isActive = category.is_active !== false; // default true varsayalım
    const statusBadge = document.createElement('span');
    statusBadge.className = isActive
      ? 'badge bg-label-success'
      : 'badge bg-label-secondary';
    statusBadge.textContent = isActive ? 'Aktif' : 'Pasif';
    statusCell.appendChild(statusBadge);

    // 5) Oluşturulma tarihi
    const createdCell = document.createElement('td');
    createdCell.textContent = formatDate(category.created_at);

    // 6) Son güncelleme tarihi
    const updatedCell = document.createElement('td');
    updatedCell.textContent = formatDate(category.updated_at);

    // 7) İşlemler
    const actionsCell = document.createElement('td');
    actionsCell.className = 'd-flex gap-1';

    // Detay
    const detailLink = document.createElement('a');
    detailLink.href = `category-detail.html?id=${category.id}`;
    detailLink.className = 'btn btn-sm btn-icon btn-text-secondary';
    detailLink.title = 'Detay';
    detailLink.setAttribute('aria-label', 'Detay');
    detailLink.innerHTML = '<i class="feather icon-eye"></i>';

    // Düzenle
    const editLink = document.createElement('a');
    editLink.href = `category-edit.html?id=${category.id}`;
    editLink.className = 'btn btn-sm btn-icon btn-text-secondary';
    editLink.title = 'Düzenle';
    editLink.setAttribute('aria-label', 'Düzenle');
    editLink.innerHTML = '<i class="feather icon-edit"></i>';

    // Sil (isteğe bağlı)
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn btn-sm btn-icon btn-text-danger';
    deleteButton.title = 'Sil';
    deleteButton.setAttribute('aria-label', 'Sil');
    deleteButton.innerHTML = '<i class="feather icon-trash-2"></i>';
    // Buraya ileride silme handler'ını bağlayabilirsin
    // deleteButton.addEventListener('click', () => handleDelete(category.id));

    actionsCell.append(detailLink, editLink, deleteButton);

    // Satırı tabloya ekle
    row.append(
      codeCell,
      nameCell,
      assetCountCell,
      statusCell,
      createdCell,
      updatedCell,
      actionsCell
    );

    tableBody.appendChild(row);
  });

  summary.textContent = `Gösterilen: ${categories.length} / ${categories.length}`;
};

const fetchCategories = async () => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/asset-categories?limit=100`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Kategori listesi alınamadı.');
  }

  return parseJsonSafely(response);
};

const initPage = () => {
  const tableBody = document.getElementById('categoryTableBody');
  const summary = document.getElementById('categorySummary');
  const contentWrapper = document.querySelector('.container-xxl');

  if (!tableBody || !summary) return;

  fetchCategories()
    .then((categories) => {
      const items = Array.isArray(categories) ? categories.slice(0, 100) : [];
      renderCategories(items, tableBody, summary);
    })
    .catch((error) => {
      console.error('Kategori listesi yüklenirken hata:', error);
      summary.textContent = 'Kategori listesi yüklenemedi.';
      tableBody.replaceChildren();
      const alert = createAlert(error.message || 'Beklenmeyen bir hata oluştu.');
      contentWrapper?.prepend(alert);
    });
};

initPage();