// Filter functions for asset movements

async function populateDepartments(selectEl) {
  selectEl.innerHTML = '<option>Yükleniyor...</option>';
  selectEl.disabled = true;

  try {
    const data = await apiFetch('/departments');
    const departments = Array.isArray(data?.data) ? data.data : data;

    selectEl.innerHTML = '<option value="">Tümü</option>';
    departments.forEach(d => {
      selectEl.append(new Option(
        d.code ? `${d.name} (${d.code})` : d.name,
        d.id
      ));
    });
    selectEl.disabled = false;
  } catch {
    selectEl.innerHTML = '<option>Birimler yüklenemedi</option>';
  }
}

function initDepartmentFilter() {
  const el = document.getElementById('departmentSelect');
  if (el) populateDepartments(el);
}

function clearFilters() {
  document.getElementById('assetSearch').value = '';
  document.getElementById('movementType').value = '';
  document.getElementById('departmentSelect').value = '';
  document.getElementById('dateRange').value = '';
  loadMovements();
}

function initFilterButtons() {
  const filterBtn = document.getElementById('filtrele');
  const clearBtn = document.getElementById('temizle');

  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      loadMovements();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearFilters);
  }
}

// Expose for module-to-module coordination (init file)
window.initDepartmentFilter = initDepartmentFilter;
window.initFilterButtons = initFilterButtons;

