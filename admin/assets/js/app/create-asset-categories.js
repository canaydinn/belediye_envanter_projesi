(() => {
  const categorySelect = document.getElementById('category_id');
  if (!categorySelect) return;

  const setOptions = (categories = []) => {
    categorySelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seçiniz';
    categorySelect.appendChild(defaultOption);

    categories.forEach(({ id, name, code }) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = code ? `${name} (${code})` : name;
      categorySelect.appendChild(option);
    });

    if (categories.length === 0) {
      const emptyOption = document.createElement('option');
      emptyOption.disabled = true;
      emptyOption.textContent = 'Kayıtlı kategori bulunamadı';
      categorySelect.appendChild(emptyOption);
    }
  };

  const showError = (message) => {
    categorySelect.innerHTML = '';
    const errorOption = document.createElement('option');
    errorOption.disabled = true;
    errorOption.selected = true;
    errorOption.textContent = message || 'Kategoriler yüklenemedi';
    categorySelect.appendChild(errorOption);
  };

  const loadCategories = async () => {
    try {

      const response = await fetch('/api/asset-categories', {
        headers: token
          ? {
            }
          : {},
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const data = await response.json();
      const categories = Array.isArray(data) ? data : [];
      setOptions(categories);
    } catch (err) {
      console.error('Kategoriler yüklenirken hata oluştu:', err);
      showError('Kategoriler yüklenemedi');
    }
  };

  loadCategories();
})();

