(() => {
  const logoutIcon = document.querySelector('.ti-logout');
  const logoutLink = logoutIcon?.closest('a.dropdown-item');
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiOrigin = isLocal ? 'http://localhost:4000' : '';

  if (!logoutLink) return;

  const handleLogout = async (event) => {
    event.preventDefault();

    try {
      await fetch(`${apiOrigin}/api/auth/logout`, {
        method: 'POST',
        headers: {},
        credentials: 'include',
      });
    } catch (error) {
      console.error('Çıkış işlemi sırasında bir hata oluştu:', error);
    } finally {
      localStorage.removeItem('user_role_id'); // Rol cache'ini temizle
      localStorage.removeItem('currentUser'); // Kullanıcı cache'ini temizle
      window.location.href = '/admin/login.html';
    }
  };

  logoutLink.addEventListener('click', handleLogout);
})();