// API_BASE_URL zaten api.js'de tanımlı olabilir, bu yüzden kontrol ediyoruz
const LOCATION_API_BASE_URL = window.API_BASE_URL || 'http:// /api';

document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden lokasyon ID'sini al
  const params = new URLSearchParams(window.location.search);
  const locationId = params.get('id');

  if (!locationId) {
    showFeedback('Geçerli bir lokasyon ID\'si bulunamadı.', 'danger');
    return;
  }

  const locationUpdateForm = document.getElementById('locationUpdateForm');
  const feedbackEl = document.querySelector('[data-role="feedback"]');

  // Yardımcı fonksiyonlar
  function toNullable(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }

  function showFeedback(message, type = 'info') {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
      
      // 4 saniye sonra otomatik gizle
      setTimeout(() => {
        feedbackEl.classList.add('d-none');
      }, 4000);
    }
  }

  function hideFeedback() {
    if (feedbackEl) {
      feedbackEl.classList.add('d-none');
    }
  }

  // Lokasyon detayını yükle
  async function loadLocation() {
    try {
      console.log('Lokasyon yükleniyor, ID:', locationId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCATION_API_BASE_URL}/locations/${locationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          showFeedback('Lokasyon bulunamadı.', 'danger');
          return;
        }
        if (response.status === 401) {
          showFeedback('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'danger');
          setTimeout(() => {
            window.location.href = '/admin/login.html';
          }, 2000);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lokasyon yüklenemedi');
      }

      const location = await response.json();
      console.log('Lokasyon verisi:', location);
      populateForm(location);
    } catch (error) {
      console.error('Lokasyon yüklenirken hata:', error);
      showFeedback('Lokasyon bilgileri yüklenemedi: ' + error.message, 'danger');
    }
  }

  // Form alanlarını doldur
  async function populateForm(location) {
    console.log('Form dolduruluyor:', location);
    
    // Lokasyon kodu badge
    const locationCodeBadge = document.querySelector('[data-role="location-code"]');
    if (locationCodeBadge) {
      locationCodeBadge.textContent = location.code || '-';
    }

    // Form alanları
    const codeInput = document.getElementById('code');
    const nameInput = document.getElementById('name');
    const addressInput = document.getElementById('address');
    const departmentSelect = document.getElementById('department_id');
    const typeSelect = document.getElementById('type');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const isActiveCheckbox = document.getElementById('is_active');

    if (codeInput) codeInput.value = location.code || '';
    if (nameInput) nameInput.value = location.name || '';
    if (addressInput) addressInput.value = location.address || '';
    if (latitudeInput) latitudeInput.value = location.latitude || '';
    if (longitudeInput) longitudeInput.value = location.longitude || '';
    if (isActiveCheckbox) {
      isActiveCheckbox.checked = location.is_active !== false && location.is_active !== 0;
    }

    // Departmanları önce yükle, sonra seç
    await loadDepartments();
    if (departmentSelect && location.department_id) {
      departmentSelect.value = location.department_id.toString();
      console.log('Departman seçildi:', location.department_id);
    }

    // Lokasyon tipi
    if (typeSelect && location.type !== null && location.type !== undefined) {
      typeSelect.value = location.type.toString();
      console.log('Tip seçildi:', location.type);
    }
  }

  // Departmanları yükle
  async function loadDepartments() {
    const select = document.getElementById('department_id');
    if (!select) return;

    const token = localStorage.getItem('token');

    try {
      console.log('Departmanlar yükleniyor...');
      const response = await fetch(`${LOCATION_API_BASE_URL}/departments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Departmanlar yüklenemedi, status:', response.status);
        return;
      }

      const departments = await response.json();
      console.log('Departmanlar yüklendi:', departments);

      // Mevcut seçili değeri sakla
      const currentValue = select.value;

      select.innerHTML = '<option value="">Birim seçiniz</option>';

      if (Array.isArray(departments)) {
        departments.forEach((dept) => {
          const opt = document.createElement('option');
          opt.value = dept.id.toString();
          opt.textContent = dept.name;
          select.appendChild(opt);
        });
      }

      // Önceki değeri geri yükle
      if (currentValue) {
        select.value = currentValue;
      }
    } catch (err) {
      console.error('DEPARTMENT_LOAD_ERROR', err);
    }
  }

  // Form submit
  if (locationUpdateForm) {
    locationUpdateForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideFeedback();

      const formData = {
        code: document.getElementById('code').value.trim(),
        name: document.getElementById('name').value.trim(),
        address: toNullable(document.getElementById('address').value),
        department_id: document.getElementById('department_id').value || null,
        type: document.getElementById('type').value || null,
        latitude: toNullable(document.getElementById('latitude').value),
        longitude: toNullable(document.getElementById('longitude').value),
        is_active: document.getElementById('is_active').checked,
      };

      // Zorunlu alanlar kontrolü
      if (!formData.code || !formData.name) {
        showFeedback('Lütfen gerekli alanları (Kod ve Ad) doldurun.', 'warning');
        return;
      }

      // department_id'yi number'a çevir veya null yap
      if (formData.department_id && formData.department_id.trim() !== '') {
        const deptId = parseInt(formData.department_id, 10);
        formData.department_id = isNaN(deptId) ? null : deptId;
      } else {
        formData.department_id = null;
      }

      // type'ı number'a çevir veya null yap
      if (formData.type && formData.type.trim() !== '') {
        const typeId = parseInt(formData.type, 10);
        formData.type = isNaN(typeId) ? null : typeId;
      } else {
        formData.type = null;
      }

      console.log('Güncelleme için form verisi:', formData);

      try {
        const token = localStorage.getItem('token');
        const updateButton = document.querySelector('[data-role="update-button"]');
        if (updateButton) {
          updateButton.disabled = true;
          updateButton.textContent = 'Güncelleniyor...';
        }

        console.log('Güncelleme isteği gönderiliyor...');
        const response = await fetch(`${LOCATION_API_BASE_URL}/locations/${locationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        console.log('Güncelleme response status:', response.status);

        let data = null;
        try {
          data = await response.json();
          console.log('Güncelleme response data:', data);
        } catch (e) {
          console.warn('Response JSON parse edilemedi:', e);
          // JSON dönmediyse, status'e göre mesaj vereceğiz
        }

        if (!response.ok) {
          if (response.status === 401) {
            showFeedback('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'danger');
            setTimeout(() => {
              window.location.href = '/admin/login.html';
            }, 2000);
            return;
          }
          const message =
            data?.message ||
            `Lokasyon güncelleme sırasında bir hata oluştu (status: ${response.status}).`;
          throw new Error(message);
        }

        showFeedback('Lokasyon başarıyla güncellendi.', 'success');

        // Lokasyon kodu badge'ini güncelle
        const locationCodeBadge = document.querySelector('[data-role="location-code"]');
        if (locationCodeBadge) {
          locationCodeBadge.textContent = formData.code;
        }

        // 2 saniye sonra lokasyon listesine yönlendir
        setTimeout(() => {
          window.location.href = '/admin/locations.html';
        }, 2000);
      } catch (error) {
        console.error('Lokasyon güncelleme hatası:', error);
        showFeedback(
          error.message || 'Lokasyon güncelleme sırasında bir hata oluştu.',
          'danger'
        );
      } finally {
        const updateButton = document.querySelector('[data-role="update-button"]');
        if (updateButton) {
          updateButton.disabled = false;
          updateButton.textContent = 'Güncelle';
        }
      }
    });
  }

  // Sayfa yüklendiğinde lokasyon bilgilerini yükle
  // Önce departmanları yükle, sonra lokasyonu yükle (departman seçimi için)
  loadDepartments().then(() => {
    loadLocation();
  });
});

