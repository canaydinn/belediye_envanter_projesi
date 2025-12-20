document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden kullanıcı ID'sini al
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    showFeedback('Geçerli bir kullanıcı ID\'si bulunamadı.', 'danger');
    return;
  }

  const userUpdateForm = document.getElementById('userUpdateForm');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const feedbackEl = document.querySelector('[data-role="feedback"]');

  // Yardımcı fonksiyonlar
  function toNullable(value) {
    return value && value.trim() !== '' ? value.trim() : null;
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

  // Kullanıcı detayını yükle
  async function loadUser() {
    try {
      const user = await apiFetch(`/users/${userId}`, { method: 'GET' });
      populateForm(user);
    } catch (error) {
      console.error('Kullanıcı yüklenirken hata:', error);
      showFeedback('Kullanıcı bilgileri yüklenemedi: ' + error.message, 'danger');
    }
  }

  // Form alanlarını doldur
  function populateForm(user) {
    // User ID badge
    const userIdBadge = document.querySelector('[data-role="user-id"]');
    if (userIdBadge) {
      userIdBadge.textContent = `ID: ${user.id}`;
    }

    // Form alanları
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('full_name').value = user.full_name || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('role_id').value = user.role_id || '';
    document.getElementById('is_active').value = user.is_active ? 'true' : 'false';
    document.getElementById('email_verified').checked = !!user.email_verified_at;
  }

  // Form submit
  userUpdateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    userUpdateForm.classList.add('was-validated');
    successMessage.classList.add('d-none');
    errorMessage.classList.add('d-none');
    hideFeedback();

    if (!userUpdateForm.checkValidity()) {
      return;
    }

    const formData = new FormData(userUpdateForm);
    const roleIdValue = formData.get('role_id');
    const payload = {
      email: toNullable(formData.get('email')),
      full_name: toNullable(formData.get('full_name')),
      role_id: roleIdValue ? parseInt(roleIdValue, 10) : null,
      phone: toNullable(formData.get('phone')),
      is_active: formData.get('is_active') === 'true',
      email_verified: document.getElementById('email_verified').checked,
    };

    try {
      const updateButton = document.querySelector('[data-role="update-button"]');
      if (updateButton) {
        updateButton.disabled = true;
        updateButton.textContent = 'Güncelleniyor...';
      }

      const updatedUser = await apiFetch(`/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      successMessage.textContent = `Kullanıcı başarıyla güncellendi.`;
      successMessage.classList.remove('d-none');
      showFeedback('Kullanıcı başarıyla güncellendi.', 'success');
      
      // 2 saniye sonra kullanıcı listesine yönlendir
      setTimeout(() => {
        window.location.href = '/admin/users.html';
      }, 2000);
    } catch (error) {
      console.error('Kullanıcı güncelleme hatası:', error);
      errorMessage.textContent =
        error.message || 'Kullanıcı güncelleme sırasında bir hata oluştu.';
      errorMessage.classList.remove('d-none');
      showFeedback(error.message || 'Kullanıcı güncelleme sırasında bir hata oluştu.', 'danger');
    } finally {
      const updateButton = document.querySelector('[data-role="update-button"]');
      if (updateButton) {
        updateButton.disabled = false;
        updateButton.textContent = 'Güncelle';
      }
    }
  });

  // Sayfa yüklendiğinde kullanıcı bilgilerini yükle
  loadUser();
});

