// API utility functions
const API_BASE_URL = '/api';

async function apiFetch(path, options = {}) {
  // Token'ı localStorage'dan al (cookie yedek olarak)
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

