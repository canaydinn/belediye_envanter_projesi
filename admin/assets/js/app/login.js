(() => {
  const form = document.getElementById('formLogin');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorAlert = document.getElementById('loginError');

  const showError = message => {
    if (!errorAlert) return;
    errorAlert.textContent = message || 'Giriş sırasında bir hata oluştu.';
    errorAlert.classList.remove('d-none');
  };

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    errorAlert?.classList.add('d-none');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const payload = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showError(data.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      const roleId = Number(data?.user?.role_id);
      if (roleId === 1) {
        window.location.href = 'super-admin-dashboard.html';
      } else if (roleId === 3) {
        window.location.href = 'dashboard.html';
      } 
      else if (roleId === 2) {
        window.location.href = 'dashboard.html';
      } else {
        showError('Yetkiniz için uygun bir yönlendirme bulunamadı.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  });
})();