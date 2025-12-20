// List loading and rendering functions for asset movements

async function loadMovements() {
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
    renderMovements(Array.isArray(data) ? data : data.data || []);
  } catch (err) {
    console.error('Hareketler yüklenemedi:', err);
    tbody.innerHTML =
      `<tr><td colspan="5" class="text-center text-danger">Veriler yüklenemedi: ${err.message || 'Bilinmeyen hata'}</td></tr>`;
  }
}

function renderMovements(movements) {
  const tbody = document.getElementById('movementTableBody');
  
  if (!movements || movements.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Kayıt bulunamadı</td></tr>';
    return;
  }

  tbody.innerHTML = movements.map(movement => {
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
}

