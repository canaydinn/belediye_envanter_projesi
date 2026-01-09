(() => {
  const logoutIcon = document.querySelector('.ti-logout');
  const logoutLink = logoutIcon?.closest('a.dropdown-item');
  const API_BASE_URL = 'http:// /api';

  if (!logoutLink) return;

  const handleLogout = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('token');

    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
    } catch (error) {
      console.error('Çıkış işlemi sırasında bir hata oluştu:', error);
    } finally {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  };

  logoutLink.addEventListener('click', handleLogout);
})();