// admin/assets/js/app/super-admin-municipality-api.js
// Belediye API işlemleri

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Belediye detayını getirir
 * @param {string|number} municipalityId - Belediye ID'si
 * @returns {Promise<Object>} Belediye detay verisi
 */
async function getMunicipalityDetail(municipalityId) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

