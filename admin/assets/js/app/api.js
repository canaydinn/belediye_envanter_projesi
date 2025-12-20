// API utility functions
const API_BASE_URL = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
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

