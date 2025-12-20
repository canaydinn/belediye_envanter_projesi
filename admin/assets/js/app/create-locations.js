const API_BASE_URL = 'http://localhost:4000/api';

/**
 * ------------------------------
 *  UI Yardımcı Fonksiyonları
 * ------------------------------
 */

const showAlert = (message, type = 'danger') => {
  const alertBox = document.getElementById('formAlert');
  if (!alertBox) return;

  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove('d-none');

  setTimeout(() => {
    alertBox.classList.add('d-none');
  }, 4000);
};

const disableButton = (btn) => {
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Kaydediliyor...';
};

const enableButton = (btn) => {
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-device-floppy me-1"></i>Kaydı Oluştur';
};

/**
 * ------------------------------
 *  API: Lokasyon Oluşturma
 * ------------------------------
 */

const submitLocationForm = async (event) => {
  event.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  disableButton(submitBtn);

  const token = localStorage.getItem('token');

  const formData = {
    code: document.getElementById('code').value.trim(),
    name: document.getElementById('name').value.trim(),
    address: document.getElementById('address').value.trim(),
    department_id: document.getElementById('department_id').value || null,
    type: document.getElementById('type').value || null,
    is_active: document.getElementById('is_active').checked,
  };

  // Zorunlu alanlar kontrolü
  if (!formData.code || !formData.name) {
    showAlert('Lütfen gerekli alanları doldurun.', 'warning');
    enableButton(submitBtn);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      let errorMsg = 'Kayıt başarısız oldu.';
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch (_) {}

      showAlert(errorMsg, 'danger');
      enableButton(submitBtn);
      return;
    }

    const result = await response.json();
    showAlert('Lokasyon başarıyla oluşturuldu.', 'success');

    // İsteğe bağlı: form temizleme
    document.getElementById('locationForm').reset();

  } catch (err) {
    console.error('LOCATION_CREATE_ERROR', err);
    showAlert('Sunucuya bağlanırken hata oluştu.', 'danger');
  } finally {
    enableButton(submitBtn);
  }
};

/**
 * ------------------------------
 *  Departmanları Yükleme (Opsiyonel)
 * ------------------------------
 */

const loadDepartments = async () => {
  const select = document.getElementById('department_id');
  if (!select) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) return;

    const departments = await response.json();

    select.innerHTML = '<option value="">Birim seçiniz</option>';

    departments.forEach((dept) => {
      const opt = document.createElement('option');
      opt.value = dept.id;
      opt.textContent = dept.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('DEPARTMENT_LOAD_ERROR', err);
  }
};

/**
 * ------------------------------
 *  Sayfa Başlatma
 * ------------------------------
 */

const initPage = () => {
  const form = document.getElementById('locationForm');
  if (form) {
    form.addEventListener('submit', submitLocationForm);
  }

  loadDepartments();
};

document.addEventListener('DOMContentLoaded', initPage);

