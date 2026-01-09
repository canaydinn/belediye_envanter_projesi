// Location detail page - Load and display location details
const LOCATION_API_BASE_URL = window.API_BASE_URL || 'http:// /api';

document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden lokasyon ID'sini al
  const params = new URLSearchParams(window.location.search);
  const locationId = params.get('id');

  if (!locationId) {
    showFeedback('Geçerli bir lokasyon ID\'si bulunamadı.', 'danger');
    return;
  }

  const feedbackEl = document.querySelector('[data-role="feedback"]');

  // Yardımcı fonksiyonlar
  function showFeedback(message, type = 'info') {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
      
      setTimeout(() => {
        feedbackEl.classList.add('d-none');
      }, 4000);
    }
  }

  // Tarih formatlama
  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  }

  // Lokasyon tipi formatlama
  function formatLocationType(type) {
    const typeMap = {
      1: 'Ofis',
      2: 'Depo',
      3: 'Saha Ofisi',
      4: 'Bina'
    };
    return typeMap[type] || type || '-';
  }

  // Lokasyon detayını yükle
  async function loadLocationDetail() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCATION_API_BASE_URL}/locations/${locationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

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
      populateDetail(location);
    } catch (error) {
      console.error('Lokasyon yüklenirken hata:', error);
      showFeedback('Lokasyon bilgileri yüklenemedi: ' + error.message, 'danger');
    }
  }

  // Departman bilgisini yükle
  async function loadDepartmentName(departmentId) {
    if (!departmentId) return '-';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${LOCATION_API_BASE_URL}/departments`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) return '-';

      const departments = await response.json();
      if (Array.isArray(departments)) {
        const dept = departments.find(d => d.id === departmentId);
        return dept ? dept.name : '-';
      }
      return '-';
    } catch (err) {
      console.error('Departman yüklenirken hata:', err);
      return '-';
    }
  }

  // Form alanlarını doldur
  async function populateDetail(location) {
    // Başlık
    const locationNameHeader = document.querySelector('[data-role="location-name"]');
    if (locationNameHeader) {
      locationNameHeader.textContent = location.name || 'Lokasyon Detayı';
    }

    // Edit link
    const editLink = document.querySelector('[data-role="edit-link"]');
    if (editLink) {
      editLink.href = `location-edit.html?id=${location.id}`;
    }

    // Lokasyon kodu badge
    const locationCodeBadge = document.querySelector('[data-role="location-code"]');
    if (locationCodeBadge) {
      locationCodeBadge.textContent = location.code || '-';
    }

    // Detay alanları
    const codeDetail = document.querySelector('[data-role="location-code-detail"]');
    const nameDetail = document.querySelector('[data-role="location-name-detail"]');
    const typeDetail = document.querySelector('[data-role="location-type"]');
    const addressDetail = document.querySelector('[data-role="location-address"]');
    const latitudeDetail = document.querySelector('[data-role="location-latitude"]');
    const longitudeDetail = document.querySelector('[data-role="location-longitude"]');
    const statusBadge = document.querySelector('[data-role="location-status"]');
    const createdDetail = document.querySelector('[data-role="location-created"]');
    const updatedDetail = document.querySelector('[data-role="location-updated"]');
    const departmentDetail = document.querySelector('[data-role="location-department"]');

    if (codeDetail) codeDetail.textContent = location.code || '-';
    if (nameDetail) nameDetail.textContent = location.name || '-';
    if (typeDetail) typeDetail.textContent = formatLocationType(location.type);
    if (addressDetail) addressDetail.textContent = location.address || '-';
    if (latitudeDetail) latitudeDetail.textContent = location.latitude || '-';
    if (longitudeDetail) longitudeDetail.textContent = location.longitude || '-';
    if (createdDetail) createdDetail.textContent = formatDate(location.created_at);
    if (updatedDetail) updatedDetail.textContent = formatDate(location.updated_at);

    // Durum badge
    if (statusBadge) {
      if (location.is_active) {
        statusBadge.textContent = 'Aktif';
        statusBadge.className = 'badge bg-label-success';
      } else {
        statusBadge.textContent = 'Pasif';
        statusBadge.className = 'badge bg-label-secondary';
      }
    }

    // Departman bilgisini yükle
    if (departmentDetail && location.department_id) {
      const deptName = await loadDepartmentName(location.department_id);
      departmentDetail.textContent = deptName;
    } else if (departmentDetail) {
      departmentDetail.textContent = '-';
    }
  }

  // Sayfa yüklendiğinde lokasyon bilgilerini yükle
  loadLocationDetail();
});

