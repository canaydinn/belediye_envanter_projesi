document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden kullanıcı ID'sini al
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    showAlert('Geçerli bir kullanıcı ID\'si bulunamadı.', 'danger');
    return;
  }

  // DOM element referansları
  const elements = {
    fullName: document.querySelector('[data-role="user-full-name"]'),
    username: document.querySelector('[data-role="user-username"]'),
    email: document.querySelector('[data-role="user-email"]'),
    role: document.querySelector('[data-role="user-role"]'),
    statusBadge: document.getElementById('current-status-badge'),
    statusDisplay: document.getElementById('status-badge'),
    newStatusBadge: document.getElementById('new-status-badge'),
    toggleBtn: document.getElementById('toggle-status-btn'),
    toggleBtnText: document.getElementById('toggle-btn-text'),
    alertContainer: document.getElementById('alert-container')
  };

  let currentUser = null;

  // Alert göster
  function showAlert(message, type = 'info') {
    if (!elements.alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    elements.alertContainer.innerHTML = '';
    elements.alertContainer.appendChild(alertDiv);

    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, 5000);
  }

  // Durum badge'i oluştur
  function getStatusBadge(isActive) {
    const text = isActive ? 'Aktif' : 'Pasif';
    const className = isActive ? 'bg-label-success' : 'bg-label-danger';
    return `<span class="badge ${className}">${text}</span>`;
  }

  // Kullanıcı bilgilerini yükle
  async function loadUser() {
    try {
      const user = await apiFetch(`/users/${userId}`, { method: 'GET' });
      currentUser = user;
      renderUserInfo(user);
    } catch (error) {
      console.error('Kullanıcı yüklenirken hata:', error);
      showAlert('Kullanıcı bilgileri yüklenemedi: ' + error.message, 'danger');
    }
  }

  // Kullanıcı bilgilerini sayfaya render et
  function renderUserInfo(user) {
    const { full_name, username, email, role_name, is_active } = user;

    // Kullanıcı bilgileri
    if (elements.fullName) elements.fullName.textContent = full_name || '-';
    if (elements.username) elements.username.textContent = username || '-';
    if (elements.email) elements.email.textContent = email || '-';
    if (elements.role) elements.role.textContent = role_name || '-';

    // Mevcut durum
    if (elements.statusBadge) {
      elements.statusBadge.innerHTML = getStatusBadge(is_active);
    }
    if (elements.statusDisplay) {
      elements.statusDisplay.innerHTML = getStatusBadge(is_active);
    }

    // Yeni durum (tersi)
    const newStatus = !is_active;
    if (elements.newStatusBadge) {
      elements.newStatusBadge.innerHTML = getStatusBadge(newStatus);
    }

    // Toggle buton metni
    if (elements.toggleBtnText) {
      elements.toggleBtnText.textContent = is_active ? 'Pasif Yap' : 'Aktif Yap';
    }

    // Butonu aktif et
    if (elements.toggleBtn) {
      elements.toggleBtn.disabled = false;
    }
  }

  // Durum değiştir
  async function toggleStatus() {
    if (!currentUser) {
      showAlert('Kullanıcı bilgileri yüklenmedi.', 'danger');
      return;
    }

    const newStatus = !currentUser.is_active;
    const actionText = newStatus ? 'aktif yapmak' : 'pasif yapmak';

    if (!confirm(`Kullanıcıyı ${actionText} istediğinize emin misiniz?`)) {
      return;
    }

    // Butonu devre dışı bırak
    if (elements.toggleBtn) {
      elements.toggleBtn.disabled = true;
      elements.toggleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> İşleniyor...';
    }

    try {
      const response = await apiFetch(`/users/${userId}/toggle-status`, {
        method: 'PATCH'
      });

      showAlert(response.message || 'Durum başarıyla değiştirildi.', 'success');

      // Kullanıcı bilgilerini yeniden yükle
      setTimeout(() => {
        loadUser();
      }, 1000);

      // 2 saniye sonra kullanıcı listesine yönlendir
      setTimeout(() => {
        window.location.href = '../admin/users.html';
      }, 2000);
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      showAlert('Durum değiştirilirken bir hata oluştu: ' + error.message, 'danger');

      // Butonu tekrar aktif et
      if (elements.toggleBtn) {
        elements.toggleBtn.disabled = false;
        const actionText = currentUser.is_active ? 'Pasif Yap' : 'Aktif Yap';
        elements.toggleBtn.innerHTML = `<i class="ti ti-toggle-left me-1"></i> ${actionText}`;
      }
    }
  }

  // Event listener'ları ekle
  if (elements.toggleBtn) {
    elements.toggleBtn.addEventListener('click', toggleStatus);
  }

  // Sayfa yüklendiğinde kullanıcı bilgilerini yükle
  loadUser();
});

