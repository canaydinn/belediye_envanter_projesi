// API utility functions
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// Local dev fallback: API often runs on :4000 (when frontend is served elsewhere or via file://)
const API_ORIGIN = isLocal && window.location.port !== '4000' ? 'http://localhost:4000' : '';
const API_BASE_URL = `${API_ORIGIN}/api`;

// Expose a single source of truth for other scripts (optional use)
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.API_ORIGIN = API_ORIGIN;
window.APP_CONFIG.API_BASE_URL = API_BASE_URL;

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers,
    ...options
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // JSON parse hatası - boş obje döndür
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/admin/login.html';
      return;
    }
    // Hata mesajını daha açıklayıcı yap
    const errorMessage = data?.message || data?.error || `İstek başarısız (status: ${res.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

// Global API helper: diğer scriptler bunu kullanır
window.API = (() => {
  return { apiFetch };
})();

// Global apiFetch function for backward compatibility
window.apiFetch = apiFetch;

