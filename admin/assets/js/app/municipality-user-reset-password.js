document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden kullanıcı ID'sini al
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    showFeedback('Geçerli bir kullanıcı ID\'si bulunamadı.', 'danger');
    window.location.href = '/admin/users.html';
    return;
  }

  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const newPasswordInput = document.getElementById('new_password');
  const confirmPasswordInput = document.getElementById('confirm_password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');

  // Yardımcı fonksiyonlar
  function showFeedback(message, type = 'info') {
    const feedbackEl = document.querySelector('[data-role="feedback"]');
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
    }
  }

  function hideFeedback() {
    const feedbackEl = document.querySelector('[data-role="feedback"]');
    if (feedbackEl) {
      feedbackEl.classList.add('d-none');
    }
  }

  // Şifre görünürlük toggle
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      newPasswordInput.setAttribute('type', type);
      const icon = togglePasswordBtn.querySelector('i');
      icon.classList.toggle('ti-eye');
      icon.classList.toggle('ti-eye-off');
    });
  }

  if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener('click', () => {
      const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      confirmPasswordInput.setAttribute('type', type);
      const icon = toggleConfirmPasswordBtn.querySelector('i');
      icon.classList.toggle('ti-eye');
      icon.classList.toggle('ti-eye-off');
    });
  }

  // Kullanıcı detayını yükle
  async function loadUser() {
    try {
      const user = await apiFetch(`/users/${userId}`, { method: 'GET' });
      populateUserInfo(user);
    } catch (error) {
      console.error('Kullanıcı yüklenirken hata:', error);
      showFeedback('Kullanıcı bilgileri yüklenemedi: ' + error.message, 'danger');
      setTimeout(() => {
        window.location.href = '/admin/users.html';
      }, 2000);
    }
  }

  // Kullanıcı bilgilerini göster
  function populateUserInfo(user) {
    // User ID badge
    const userIdBadge = document.querySelector('[data-role="user-id"]');
    if (userIdBadge) {
      userIdBadge.textContent = `ID: ${user.id}`;
    }

    // User info
    const userInfo = document.querySelector('[data-role="user-info"]');
    if (userInfo) {
      userInfo.textContent = `${user.full_name || user.username} için şifre sıfırlama`;
    }

    // Form alanları (readonly)
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('full_name').value = user.full_name || '';
  }

  // Şifre eşleşme kontrolü
  function validatePasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword && newPassword !== confirmPassword) {
      confirmPasswordInput.setCustomValidity('Şifreler eşleşmiyor.');
      return false;
    } else {
      confirmPasswordInput.setCustomValidity('');
      return true;
    }
  }

  // Şifre alanları değiştiğinde kontrol et
  newPasswordInput.addEventListener('input', validatePasswordMatch);
  confirmPasswordInput.addEventListener('input', validatePasswordMatch);

  // Form submit
  resetPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    resetPasswordForm.classList.add('was-validated');
    successMessage.classList.add('d-none');
    errorMessage.classList.add('d-none');
    hideFeedback();

    // Şifre eşleşme kontrolü
    if (!validatePasswordMatch()) {
      return;
    }

    if (!resetPasswordForm.checkValidity()) {
      return;
    }

    const formData = new FormData(resetPasswordForm);
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    // Şifre eşleşme kontrolü
    if (newPassword !== confirmPassword) {
      errorMessage.textContent = 'Şifreler eşleşmiyor.';
      errorMessage.classList.remove('d-none');
      return;
    }

    // Şifre uzunluk kontrolü
    if (newPassword.length < 8) {
      errorMessage.textContent = 'Şifre en az 8 karakter olmalıdır.';
      errorMessage.classList.remove('d-none');
      return;
    }

    const payload = {
      password: newPassword,
    };

    try {
      const resetButton = document.querySelector('[data-role="reset-button"]');
      if (resetButton) {
        resetButton.disabled = true;
        resetButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sıfırlanıyor...';
      }

      await apiFetch(`/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      successMessage.textContent = 'Şifre başarıyla sıfırlandı.';
      successMessage.classList.remove('d-none');
      showFeedback('Şifre başarıyla sıfırlandı.', 'success');
      
      // Formu temizle
      resetPasswordForm.reset();
      resetPasswordForm.classList.remove('was-validated');

      // 3 saniye sonra kullanıcı listesine yönlendir
      setTimeout(() => {
        window.location.href = '/admin/users.html';
      }, 3000);
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      errorMessage.textContent =
        error.message || 'Şifre sıfırlama sırasında bir hata oluştu.';
      errorMessage.classList.remove('d-none');
      showFeedback(error.message || 'Şifre sıfırlama sırasında bir hata oluştu.', 'danger');
    } finally {
      const resetButton = document.querySelector('[data-role="reset-button"]');
      if (resetButton) {
        resetButton.disabled = false;
        resetButton.innerHTML = '<i class="ti ti-key me-2"></i>Şifreyi Sıfırla';
      }
    }
  });

  // Sayfa yüklendiğinde kullanıcı bilgilerini yükle
  loadUser();
});

