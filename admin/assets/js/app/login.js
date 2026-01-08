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

    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    const API_BASE_URL = isLocal ? 'http://localhost:4000' : '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
      
      // Mevcut path'ten base path'i belirle (/admin veya /api/admin)
      const currentPath = window.location.pathname;
      const basePath = currentPath.startsWith('/api/admin') 
        ? '/api/admin' 
        : currentPath.startsWith('/admin') 
        ? '/admin' 
        : '/admin';
      
      const roleId = Number(data?.user?.role_id);
      if (roleId === 1) {
        window.location.href = `${basePath}/super-admin-dashboard.html`;
      } else if (roleId === 3) {
        window.location.href = `${basePath}/dashboard.html`;
      } 
      else if (roleId === 2) {
        window.location.href = `${basePath}/dashboard.html`;
      } else {
        showError('Yetkiniz için uygun bir yönlendirme bulunamadı.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  });
})();