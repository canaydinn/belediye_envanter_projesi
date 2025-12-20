// admin/assets/js/app/super-admin-utils.js
// Ortak yardımcı fonksiyonlar

/**
 * Element'e metin içeriği ayarlar
 * @param {HTMLElement} element - Hedef element
 * @param {string} value - Ayarlanacak değer
 */
function setText(element, value) {
  if (!element) return;
  element.textContent = value ?? '-';
}

/**
 * Tarih değerini Türkçe formatında formatlar
 * @param {string|Date} value - Formatlanacak tarih
 * @param {Object} options - Formatlama seçenekleri
 * @returns {string} Formatlanmış tarih string'i
 */
function formatDate(value, options = {}) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  };

  return date.toLocaleString('tr-TR', { ...defaultOptions, ...options });
}

/**
 * Durum badge'i HTML'i oluşturur
 * @param {string} status - Durum değeri
 * @param {boolean} isActive - Aktiflik durumu
 * @returns {string} Badge HTML'i
 */
function createStatusBadge(status, isActive) {
  const normalizedStatus = (status || '').toLowerCase();

  if (normalizedStatus === 'active' || isActive) {
    return '<span class="badge bg-label-success">Aktif</span>';
  }

  if (normalizedStatus === 'pending') {
    return '<span class="badge bg-label-warning">Beklemede</span>';
  }

  if (normalizedStatus === 'suspended') {
    return '<span class="badge bg-label-secondary">Pasif</span>';
  }

  return '<span class="badge bg-label-secondary">Bilinmiyor</span>';
}

/**
 * API isteği yapar ve JSON döndürür
 * @param {string} url - İstek URL'i
 * @param {Object} options - Fetch seçenekleri
 * @returns {Promise<Object>} JSON yanıtı
 */
function fetchJson(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
    ...options,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${url} isteği başarısız (status: ${response.status})`);
    }
    return response.json();
  });
}

// Global namespace'e ekle
window.SuperAdminUtils = {
  setText,
  formatDate,
  createStatusBadge,
  fetchJson,
};

