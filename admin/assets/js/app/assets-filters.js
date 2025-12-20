// Assets filters - Load filter options (categories, departments, locations)
document.addEventListener('DOMContentLoaded', async () => {
  const categorySelect = document.getElementById('filterCategory');
  const departmentSelect = document.getElementById('filterDepartment');
  const locationSelect = document.getElementById('filterLocation');
  const selects = [categorySelect, departmentSelect, locationSelect];

  const setSingleOption = (select, label) => {
    if (!select) return;
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = label;
    select.appendChild(option);
  };

  const setLoadingState = () => {
    setSingleOption(categorySelect, 'Kategoriler yükleniyor...');
    setSingleOption(departmentSelect, 'Birimler yükleniyor...');
    setSingleOption(locationSelect, 'Lokasyonlar yükleniyor...');
    selects.forEach((s) => s && (s.disabled = true));
  };

  const setErrorState = (message) => {
    const msg = message || 'Filtreler yüklenemedi';
    setSingleOption(categorySelect, msg);
    setSingleOption(departmentSelect, msg);
    setSingleOption(locationSelect, msg);
    selects.forEach((s) => s && (s.disabled = true));
  };

  const populateSelect = (select, items, labelBuilder) => {
    if (!select) return;
    select.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Tümü';
    select.appendChild(allOption);

    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = labelBuilder(item);
      select.appendChild(option);
    });

    select.disabled = false;
  };

  setLoadingState();

  try {
    const data = await apiFetch('/assets/filters', { method: 'GET' });

    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const departments = Array.isArray(data?.departments) ? data.departments : [];
    const locations = Array.isArray(data?.locations) ? data.locations : [];

    populateSelect(categorySelect, categories, (i) => (i.code ? `${i.name} (${i.code})` : i.name));
    populateSelect(departmentSelect, departments, (i) => (i.code ? `${i.name} (${i.code})` : i.name));
    populateSelect(locationSelect, locations, (i) => (i.code ? `${i.name} (${i.code})` : i.name));
  } catch (err) {
    console.error('Filtre seçenekleri yüklenirken hata:', err);
    setErrorState('Filtre verileri yüklenemedi');
  }
});

