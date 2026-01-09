const API_BASE = 'http:// ';

document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden varlık ID'sini al
  const params = new URLSearchParams(window.location.search);
  const assetId = params.get('id');

  if (!assetId) {
    showFeedback('Geçerli bir varlık ID\'si bulunamadı.', 'danger');
    return;
  }

  const assetUpdateForm = document.getElementById('assetUpdateForm');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const feedbackEl = document.querySelector('[data-role="feedback"]');

  // Yardımcı fonksiyonlar
  function toNullable(value) {
    return value && value.trim() !== '' ? value.trim() : null;
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function showFeedback(message, type = 'info') {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
    }
  }

  function hideFeedback() {
    if (feedbackEl) {
      feedbackEl.classList.add('d-none');
    }
  }

  // Varlık detayını yükle
  async function loadAsset() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Varlık bulunamadı');
      }

      const asset = await response.json();
      populateForm(asset);
    } catch (error) {
      console.error('Varlık yüklenirken hata:', error);
      showFeedback('Varlık bilgileri yüklenemedi: ' + error.message, 'danger');
    }
  }

  // Form alanlarını doldur
  function populateForm(asset) {
    // Asset code badge
    const assetCodeBadge = document.querySelector('[data-role="asset-code"]');
    if (assetCodeBadge) {
      assetCodeBadge.textContent = asset.asset_code || '-';
    }

    // Form alanları
    document.getElementById('asset_code').value = asset.asset_code || '';
    document.getElementById('name').value = asset.name || '';
    document.getElementById('description').value = asset.description || '';
    document.getElementById('quantity').value = asset.quantity || 1;
    document.getElementById('unit').value = asset.unit || 'Adet';
    document.getElementById('asset_type').value = asset.asset_type || 'demirbas';
    document.getElementById('tasinir_code').value = asset.tasinir_code || '';
    document.getElementById('purchase_price').value = asset.purchase_price || '';
    document.getElementById('purchase_date').value = asset.purchase_date ? asset.purchase_date.split('T')[0] : '';
    document.getElementById('purchase_id').value = asset.purchase_id || '';
    document.getElementById('warranty_end_date').value = asset.warranty_end_date ? asset.warranty_end_date.split('T')[0] : '';
    document.getElementById('amortisman_suresi').value = asset.amortisman_suresi || '';
    document.getElementById('hurda_degeri').value = asset.hurda_degeri || '';
    document.getElementById('current_value').value = asset.current_value || '';
    document.getElementById('status').value = asset.status || 'active';
    document.getElementById('brand').value = asset.brand || '';
    document.getElementById('model').value = asset.model || '';
    document.getElementById('serial_number').value = asset.serial_number || '';
    document.getElementById('qrcode').value = asset.qrcode || '';
    document.getElementById('is_qr_tagged').checked = asset.is_qr_tagged || false;
    document.getElementById('is_movable').checked = asset.is_movable !== false;

    // Select alanları - önce yükle, sonra seç
    loadCategories().then(() => {
      if (asset.category_id) {
        document.getElementById('category_id').value = asset.category_id;
      }
    });

    loadDepartments().then(() => {
      if (asset.department_id) {
        document.getElementById('department_id').value = asset.department_id;
      }
    });

    loadLocations().then(() => {
      if (asset.location_id) {
        document.getElementById('location_id').value = asset.location_id;
      }
    });

    loadUsers().then(() => {
      if (asset.assigned_user_id) {
        document.getElementById('assigned_user_id').value = asset.assigned_user_id;
      }
    });
  }

  // Kategorileri yükle
  async function loadCategories() {
    const categorySelect = document.getElementById('category_id');
    if (!categorySelect) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/asset-categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Kategoriler yüklenemedi');
      }

      const categories = await response.json();
      categorySelect.innerHTML = '<option value="">Kategori seçin</option>';
      
      categories.forEach(({ id, name, code }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = code ? `${name} (${code})` : name;
        categorySelect.appendChild(option);
      });
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      categorySelect.innerHTML = '<option value="">Kategoriler yüklenemedi</option>';
    }
  }

  // Birimleri yükle
  async function loadDepartments() {
    const departmentSelect = document.getElementById('department_id');
    if (!departmentSelect) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/departments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Birimler yüklenemedi');
      }

      const departments = await response.json();
      departmentSelect.innerHTML = '<option value="">Birim seçin</option>';
      
      departments.forEach((department) => {
        const option = document.createElement('option');
        option.value = department.id;
        option.textContent = `${department.name}${department.code ? ` (${department.code})` : ''}`;
        departmentSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Birimler yüklenirken hata:', error);
      departmentSelect.innerHTML = '<option value="">Birimler yüklenemedi</option>';
    }
  }

  // Lokasyonları yükle
  async function loadLocations() {
    const locationSelect = document.getElementById('location_id');
    if (!locationSelect) return;

    try {
      const response = await fetch(`/api/locations?is_active=true`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        locationSelect.innerHTML = '<option value="">Oturum süresi dolmuş</option>';
        return;
      }

      if (!response.ok) {
        throw new Error('Lokasyonlar yüklenemedi');
      }

      const payload = await response.json();
      const locations = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      
      locationSelect.innerHTML = '<option value="">Lokasyon seçin</option>';
      
      locations.forEach((loc) => {
        const option = document.createElement('option');
        option.value = loc.id;
        option.textContent = loc.name || loc.code || `Lokasyon #${loc.id}`;
        locationSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Lokasyonlar yüklenirken hata:', error);
      locationSelect.innerHTML = '<option value="">Lokasyonlar yüklenemedi</option>';
    }
  }

  // Kullanıcıları yükle
  async function loadUsers() {
    const userSelect = document.getElementById('assigned_user_id');
    if (!userSelect) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Kullanıcılar yüklenemedi');
      }

      const users = await response.json();
      userSelect.innerHTML = '<option value="">Kullanıcı seçin</option>';
      
      users.forEach((user) => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.full_name || user.username || `Kullanıcı #${user.id}`;
        userSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      userSelect.innerHTML = '<option value="">Kullanıcılar yüklenemedi</option>';
    }
  }

  // Form submit
  assetUpdateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    assetUpdateForm.classList.add('was-validated');
    successMessage.classList.add('d-none');
    errorMessage.classList.add('d-none');
    hideFeedback();

    if (!assetUpdateForm.checkValidity()) {
      return;
    }

    const formData = new FormData(assetUpdateForm);
    const payload = {
      asset_code: toNullable(formData.get('asset_code')),
      name: toNullable(formData.get('name')),
      description: toNullable(formData.get('description')),
      category_id: toNullable(formData.get('category_id')),
      department_id: toNullable(formData.get('department_id')),
      location_id: toNullable(formData.get('location_id')),
      assigned_user_id: toNumber(formData.get('assigned_user_id')),
      purchase_price: toNumber(formData.get('purchase_price')),
      purchase_date: toNullable(formData.get('purchase_date')),
      serial_number: toNullable(formData.get('serial_number')),
      status: toNullable(formData.get('status')),
      is_qr_tagged: formData.get('is_qr_tagged') === 'on',
      quantity: toNumber(formData.get('quantity')) ?? 1,
      unit: toNullable(formData.get('unit')) || 'Adet',
      tasinir_code: toNullable(formData.get('tasinir_code')),
      asset_type: toNullable(formData.get('asset_type')) || 'demirbas',
      qrcode: toNullable(formData.get('qrcode')),
      brand: toNullable(formData.get('brand')),
      model: toNullable(formData.get('model')),
      purchase_id: toNullable(formData.get('purchase_id')),
      warranty_end_date: toNullable(formData.get('warranty_end_date')),
      amortisman_suresi: toNumber(formData.get('amortisman_suresi')),
      hurda_degeri: toNumber(formData.get('hurda_degeri')),
      current_value: toNumber(formData.get('current_value')),
      is_movable: formData.get('is_movable') === 'on',
    };

    try {
      const token = localStorage.getItem('token');
      const updateButton = document.querySelector('[data-role="update-button"]');
      if (updateButton) {
        updateButton.disabled = true;
        updateButton.textContent = 'Güncelleniyor...';
      }

      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // JSON dönmediyse, status'e göre mesaj vereceğiz
      }

      if (!response.ok) {
        const message =
          data?.message ||
          `Varlık güncelleme sırasında bir hata oluştu (status: ${response.status}).`;
        throw new Error(message);
      }

      successMessage.textContent = `Varlık başarıyla güncellendi.`;
      successMessage.classList.remove('d-none');
      showFeedback('Varlık başarıyla güncellendi.', 'success');
      
      // 2 saniye sonra varlık listesine yönlendir
      setTimeout(() => {
        window.location.href = '/admin/assets.html';
      }, 2000);
    } catch (error) {
      console.error('Varlık güncelleme hatası:', error);
      errorMessage.textContent =
        error.message || 'Varlık güncelleme sırasında bir hata oluştu.';
      errorMessage.classList.remove('d-none');
      showFeedback(error.message || 'Varlık güncelleme sırasında bir hata oluştu.', 'danger');
    } finally {
      const updateButton = document.querySelector('[data-role="update-button"]');
      if (updateButton) {
        updateButton.disabled = false;
        updateButton.textContent = 'Güncelle';
      }
    }
  });

  // Sayfa yüklendiğinde varlık bilgilerini yükle
  loadAsset();
});

