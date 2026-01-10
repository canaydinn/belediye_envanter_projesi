// auth-guard.js
// Cookie-tabanlı auth: HttpOnly cookie JS tarafından okunamaz.
// Bu dosya sadece oturum kontrolü yapar ve gerekirse login'e yönlendirir.

async function ensureAuthenticated() {
  try {
    // Prefer shared helper if present, otherwise do a minimal fetch.
    const me =
      typeof window.apiFetch === 'function'
        ? await window.apiFetch('/auth/me', { method: 'GET' })
        : await fetch('/api/auth/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }).then(async (r) => {
            if (!r.ok) throw r;
            return r.json();
          });

    localStorage.setItem('currentUser', JSON.stringify(me));
    return me;
  } catch (err) {
    window.location.href = '/admin/login.html';
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ensureAuthenticated();
});

