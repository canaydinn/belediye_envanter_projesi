// Locations filters - Initialize department filter and wire filter events

async function initDepartmentFilter() {
  const select = document.getElementById('filter-department');
  if (!select) return;

  select.innerHTML = '<option value="">Yükleniyor...</option>';
  select.disabled = true;

  try {
    const resp = await apiFetch('/departments');
    const departments = Array.isArray(resp) ? resp : (resp?.data || []);

    select.innerHTML = '<option value="">Tümü</option>';

    departments.forEach(d => {
      select.append(
        new Option(d.code ? `${d.name} (${d.code})` : d.name, d.id)
      );
    });

    select.disabled = false;
  } catch (e) {
    console.error('Departments load error:', e);
    select.innerHTML = '<option value="">Birimler yüklenemedi</option>';
    select.disabled = true;
  }
}

function buildLocationQueryParams() {
  const name = document.getElementById('filter-name')?.value?.trim() || '';
  const type = document.getElementById('filter-type')?.value || '';
  const department_id = document.getElementById('filter-department')?.value || '';
  const is_active = document.getElementById('filter-status')?.value || '';

  const params = new URLSearchParams();
  if (name) params.set('name', name);
  if (type) params.set('type', type);
  if (department_id) params.set('department_id', department_id);
  if (is_active) params.set('is_active', is_active);

  return params;
}

function wireLocationFilters() {
  const btnFilter = document.getElementById('filtrele');
  const form = document.getElementById('filter-form');

  btnFilter?.addEventListener('click', async () => {
    const params = buildLocationQueryParams();
    await loadLocations(params);
  });

  // form submit olursa da filtrelesin (enter ile)
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const params = buildLocationQueryParams();
    await loadLocations(params);
  });

  // Temizle (reset) sonrası listeyi yenile
  form?.addEventListener('reset', async () => {
    // reset DOM'u hemen güncellemeyebilir, bir tick bekleyelim
    setTimeout(() => loadLocations(new URLSearchParams()), 0);
  });

  // Opsiyonel: seçim değişince otomatik filtrele (isterseniz açın)
  ['filter-name','filter-type','filter-department','filter-status'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('change', () => {
      const params = buildLocationQueryParams();
      loadLocations(params);
    });
  });
}

// Expose for module-to-module coordination (init)
window.initDepartmentFilter = initDepartmentFilter;
window.wireLocationFilters = wireLocationFilters;

