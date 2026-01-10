// admin/assets/js/app/super-admin-municipality-api.js
// Belediye API işlemleri

const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'   // Lokal
    : window.location.origin + '/api';

/**
 * Belediye detayını getirir
 * @param {string|number} municipalityId - Belediye ID'si
 * @returns {Promise<Object>} Belediye detay verisi
 */
async function getMunicipalityDetail(municipalityId) {

  const headers = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(
    `${API_BASE_URL}/superadmin/municipalities/${municipalityId}`,
    {
      method: 'GET',
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Belediye detayı alınamadı (status: ${response.status})`
    );
  }

  return response.json();
}

// Global namespace'e ekle
window.MunicipalityAPI = {
  getMunicipalityDetail,
};

