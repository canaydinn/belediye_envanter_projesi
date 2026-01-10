document.addEventListener('DOMContentLoaded', () => {
  const departmentSelect = document.getElementById('department_id');
  const API_URL = '/api/departments';

  const setLoadingState = () => {
    departmentSelect.innerHTML = '';

    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Birimler yükleniyor...';
    departmentSelect.appendChild(loadingOption);
    departmentSelect.disabled = true;
  };

  const setErrorState = () => {
    departmentSelect.innerHTML = '';

    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = 'Birimler yüklenemedi';
    departmentSelect.appendChild(errorOption);
    departmentSelect.disabled = true;
  };

  const populateDepartments = (departments = []) => {
    departmentSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seçiniz';
    departmentSelect.appendChild(defaultOption);

    departments.forEach((department) => {
      const option = document.createElement('option');
      option.value = department.id;
      option.textContent = `${department.name}${department.code ? ` (${department.code})` : ''}`;
      departmentSelect.appendChild(option);
    });

    departmentSelect.disabled = departments.length === 0;
  };

  const loadDepartments = async () => {
    setLoadingState();

    try {

      const response = await fetch(API_URL, {
        headers: {},
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const departments = await response.json();
      populateDepartments(Array.isArray(departments) ? departments : []);
    } catch (error) {
      console.error('Birimler yüklenirken hata oluştu:', error);
      setErrorState();
    }
  };

  loadDepartments();
});

