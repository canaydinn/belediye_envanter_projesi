// List loading and rendering functions for asset movements

let currentMovementsPage = 1;
let lastMovements = [];

async function loadMovements() {
  // Filtre değişince başa dön
  currentMovementsPage = 1;
  const params = new URLSearchParams();

  const assetSearch = document.getElementById('assetSearch');
  const movementType = document.getElementById('movementType');
  const departmentSelect = document.getElementById('departmentSelect');
  const dateRange = document.getElementById('dateRange');

  if (assetSearch?.value) params.append('assetSearch', assetSearch.value.trim());
  if (movementType?.value) params.append('movementType', movementType.value);
  if (departmentSelect?.value) params.append('departmentId', departmentSelect.value);

  // Tarih aralığı işleme
  if (dateRange?.value) {
    const dateRangeValue = dateRange.value.trim();
    // "YYYY-MM-DD - YYYY-MM-DD" formatını parse et
    const parts = dateRangeValue.split('-').map(s => s.trim());
    if (parts.length === 2) {
      params.append('startDate', parts[0]);
      params.append('endDate', parts[1]);
    } else if (parts.length === 1 && parts[0]) {
      // Tek tarih varsa hem başlangıç hem bitiş olarak kullan
      params.append('startDate', parts[0]);
      params.append('endDate', parts[0]);
    }
  }

  const tbody = document.getElementById('movementTableBody');
  tbody.innerHTML =
    `<tr><td colspan="5" class="text-center text-muted">Yükleniyor...</td></tr>`;

  try {
    const data = await apiFetch(`/asset-movements/filter?${params.toString()}`);
    lastMovements = Array.isArray(data) ? data : data.data || [];
    renderMovements(lastMovements);
  } catch (err) {
    console.error('Hareketler yüklenemedi:', err);
    tbody.innerHTML =
      `<tr><td colspan="5" class="text-center text-danger">Veriler yüklenemedi: ${err.message || 'Bilinmeyen hata'}</td></tr>`;
  }
}

function renderMovements(movements) {
  const tbody = document.getElementById('movementTableBody');
  const pageInfo = document.querySelector('[data-role="movements-page-info"]');
  const pagination = document.querySelector('[data-role="movements-pagination"]');
  const pageSizeEl = document.getElementById('pageSize');
  const pageSize = Math.max(1, Number(pageSizeEl?.value || 25));
  
  if (!movements || movements.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Kayıt bulunamadı</td></tr>';
    if (pageInfo) pageInfo.textContent = 'Sayfa 0 / 0';
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const totalItems = movements.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentMovementsPage > totalPages) currentMovementsPage = totalPages;
  if (currentMovementsPage < 1) currentMovementsPage = 1;

  const startIndex = (currentMovementsPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pageItems = movements.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map(movement => {
    const date = formatDate(movement.movement_date);
    const assetDisplay = movement.asset_code 
      ? `${movement.asset_name || '-'} (${movement.asset_code})`
      : (movement.asset_name || '-');
    const oldLocation = movement.from_location_name || movement.from_department_name || '-';
    const newLocation = movement.to_location_name || movement.to_department_name || '-';
    const movementType = getMovementTypeLabel(movement.movement_type);
    const badgeClass = getMovementTypeBadgeClass(movement.movement_type);

    return `
      <tr>
        <td>${date}</td>
        <td>${assetDisplay}</td>
        <td>${oldLocation}</td>
        <td>${newLocation}</td>
        <td><span class="badge ${badgeClass}">${movementType}</span></td>
      </tr>
    `;
  }).join('');

  if (pageInfo) pageInfo.textContent = `Sayfa ${currentMovementsPage} / ${totalPages}`;

  if (pagination) {
    const buildPageItem = (label, page, { disabled = false, active = false } = {}) => {
      const liClass = ['page-item', disabled ? 'disabled' : '', active ? 'active' : ''].filter(Boolean).join(' ');
      const dataAttr = disabled ? '' : ` data-page="${page}"`;
      const href = 'javascript:void(0);';
      return `<li class="${liClass}"><a class="page-link"${dataAttr} href="${href}">${label}</a></li>`;
    };

    const buildEllipsis = () =>
      '<li class="page-item disabled"><a class="page-link" href="javascript:void(0);">…</a></li>';

    const parts = [];
    parts.push(buildPageItem('<i class="ti ti-chevron-left"></i>', currentMovementsPage - 1, { disabled: currentMovementsPage === 1 }));

    const windowSize = 2;
    const firstPage = 1;
    const lastPage = totalPages;
    const start = Math.max(firstPage, currentMovementsPage - windowSize);
    const end = Math.min(lastPage, currentMovementsPage + windowSize);

    if (start > firstPage) {
      parts.push(buildPageItem(String(firstPage), firstPage, { active: currentMovementsPage === firstPage }));
      if (start > firstPage + 1) parts.push(buildEllipsis());
    }

    for (let p = start; p <= end; p++) {
      parts.push(buildPageItem(String(p), p, { active: currentMovementsPage === p }));
    }

    if (end < lastPage) {
      if (end < lastPage - 1) parts.push(buildEllipsis());
      parts.push(buildPageItem(String(lastPage), lastPage, { active: currentMovementsPage === lastPage }));
    }

    parts.push(buildPageItem('<i class="ti ti-chevron-right"></i>', currentMovementsPage + 1, { disabled: currentMovementsPage === totalPages }));

    pagination.innerHTML = parts.join('');
  }
}

// Pagination wiring (once)
document.addEventListener('DOMContentLoaded', () => {
  const pagination = document.querySelector('[data-role="movements-pagination"]');
  const pageSizeEl = document.getElementById('pageSize');

  pageSizeEl?.addEventListener('change', () => {
    currentMovementsPage = 1;
    renderMovements(lastMovements);
  });

  pagination?.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest('a.page-link');
    if (!link) return;
    const page = Number(link.getAttribute('data-page'));
    if (!Number.isFinite(page)) return;
    e.preventDefault();
    currentMovementsPage = page;
    renderMovements(lastMovements);
  });
});

// Expose for module-to-module coordination (filters/init files)
window.loadMovements = loadMovements;

