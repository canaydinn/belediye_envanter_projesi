// admin/assets/js/app/municipality-user-detail.js
// Municipality User detay sayfası ana mantığı
(function () {
  'use strict';

  // URL parametrelerinden kullanıcı ID'sini al
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  // DOM element referanslarını topla
  const fields = {
    name: document.querySelector('[data-role="user-name"]'),
    email: document.querySelector('[data-role="user-email"]'),
    fullName: document.querySelector('[data-role="user-full-name"]'),
    username: document.querySelector('[data-role="user-username"]'),
    emailDetail: document.querySelector('[data-role="user-email-detail"]'),
    phone: document.querySelector('[data-role="user-phone"]'),
    role: document.querySelector('[data-role="user-role"]'),
    municipality: document.querySelector('[data-role="user-municipality"]'),
    emailVerified: document.querySelector('[data-role="user-email-verified"]'),
    lastLogin: document.querySelector('[data-role="user-last-login"]'),
    status: document.querySelector('[data-role="user-status"]'),
    active: document.querySelector('[data-role="user-active"]'),
    id: document.querySelector('[data-role="user-id"]'),
    created: document.querySelector('[data-role="user-created"]'),
    updated: document.querySelector('[data-role="user-updated"]'),
    edit: document.querySelector('[data-role="user-edit"]'),
  };

  // Kullanıcı detayını yükle
  async function loadUserDetail() {
    if (!userId) {
      window.MunicipalityUserRenderer.renderError(
        'Geçerli bir kullanıcı IDsi bulunamadı.',
        fields
      );
      return;
    }

    try {
      const data = await window.MunicipalityUserAPI.getUserDetail(userId);
      console.log('Kullanıcı detay cevabı:', data);
      await window.MunicipalityUserRenderer.renderUser(data, fields);
    } catch (err) {
      console.error('Kullanıcı detayı alınamadı:', err);
      window.MunicipalityUserRenderer.renderError(
        'Kullanıcı detayları yüklenemedi.',
        fields
      );
    }
  }

  // Sayfa yüklendiğinde çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserDetail);
  } else {
    loadUserDetail();
  }
})();

