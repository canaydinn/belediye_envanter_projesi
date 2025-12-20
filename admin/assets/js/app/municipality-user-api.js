// admin/assets/js/app/municipality-user-api.js
// Municipality User API işlemleri

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Kullanıcı detayını getirir
 * @param {string|number} userId - Kullanıcı ID'si
 * @returns {Promise<Object>} Kullanıcı detay verisi
 */
async function getUserDetail(userId) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Normal belediye kullanıcıları için /users endpoint'ini kullan
  // Bu endpoint tenant scope ile çalışır, kullanıcı sadece kendi belediyesinin kullanıcılarını görebilir
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: 'GET',
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Kullanıcı detayı alınamadı (status: ${response.status})`
    );
  }

  return response.json();
}

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
    `${API_BASE_URL}/admin/municipalities/${municipalityId}`,
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

/**
 * Rol bilgisini getirir
 * @param {string|number} roleId - Rol ID'si
 * @returns {Promise<Object>} Rol detay verisi
 */
async function getRoleDetail(roleId) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Not: Rol endpoint'i yoksa, basit bir mapping kullanabiliriz
  // Şimdilik role_id'yi direkt kullanacağız
  const roleMap = {
    1: 'Süper Admin',
    2: 'Belediye Admin',
    3: 'Kullanıcı'
  };

  return Promise.resolve({ id: roleId, name: roleMap[roleId] || 'Bilinmeyen Rol' });
}

// Global namespace'e ekle
window.MunicipalityUserAPI = {
  getUserDetail,
  getMunicipalityDetail,
  getRoleDetail,
};

