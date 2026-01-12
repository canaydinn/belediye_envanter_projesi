(() => {
  const municipalitySelect = document.getElementById('municipality');
  if (!municipalitySelect) return;
  const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || '/api';

  const setOptions = (options = []) => {
    municipalitySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seçiniz';
    municipalitySelect.appendChild(defaultOption);

    options.forEach(({ id, name }) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      municipalitySelect.appendChild(option);
    });

    if (options.length === 0) {
      const emptyOption = document.createElement('option');
      emptyOption.disabled = true;
      emptyOption.textContent = 'Kayıtlı belediye bulunamadı';
      municipalitySelect.appendChild(emptyOption);
    }
  };

  const showError = message => {
    municipalitySelect.innerHTML = '';
    const errorOption = document.createElement('option');
    errorOption.disabled = true;
    errorOption.selected = true;
    errorOption.textContent = message || 'Belediyeler yüklenemedi';
    municipalitySelect.appendChild(errorOption);
  };

  const loadMunicipalities = async () => {
    try {

      const response = await fetch(`${API_BASE_URL}/superadmin/municipalities`, {
        credentials: 'include',
        headers: {},
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const data = await response.json();
      const municipalities = Array.isArray(data)
        ? data.filter(item => item?.is_active !== false)
        : [];

      setOptions(municipalities);
    } catch (err) {
      console.error('Belediyeler yüklenirken hata oluştu:', err);
      showError('Belediyeler yüklenemedi');
    }
  };

  loadMunicipalities();
})();

