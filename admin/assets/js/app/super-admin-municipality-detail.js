// admin/assets/js/app/super-admin-municipality-detail.js
// Belediye detay sayfası ana mantığı
(function () {
  'use strict';

  // URL parametrelerinden belediye ID'sini al
  const params = new URLSearchParams(window.location.search);
  const municipalityId = params.get('id');

  // DOM element referanslarını topla
  const fields = {
    name: document.querySelector('[data-role="municipality-name"]'),
    location: document.querySelector('[data-role="municipality-location"]'),
    nameDetail: document.querySelector('[data-role="municipality-name-detail"]'),
    locationDetail: document.querySelector('[data-role="municipality-location-detail"]'),
    status: document.querySelector('[data-role="municipality-status"]'),
    phone: document.querySelector('[data-role="municipality-phone"]'),
    email: document.querySelector('[data-role="municipality-email"]'),
    address: document.querySelector('[data-role="municipality-address"]'),
    taxNo: document.querySelector('[data-role="municipality-tax-no"]'),
    website: document.querySelector('[data-role="municipality-website"]'),
    contact: document.querySelector('[data-role="municipality-contact"]'),
    description: document.querySelector('[data-role="municipality-description"]'),
    active: document.querySelector('[data-role="municipality-active"]'),
    plan_type: document.querySelector('[data-role="municipality-plan"]'),
    licenseEnd: document.querySelector('[data-role="municipality-license-end"]'),
    quotaEnd: document.querySelector('[data-role="municipality-quota-end"]'),
    created: document.querySelector('[data-role="municipality-created"]'),
    updated: document.querySelector('[data-role="municipality-updated"]'),
    edit: document.querySelector('[data-role="municipality-edit"]'),
    users: document.querySelector('[data-role="municipality-users"]'),
  };

  // Belediye detayını yükle
  async function loadMunicipalityDetail() {
    if (!municipalityId) {
      window.MunicipalityRenderer.renderError(
        'Geçerli bir belediye IDsi bulunamadı.',
        fields
      );
      return;
    }

    try {
      const data = await window.MunicipalityAPI.getMunicipalityDetail(municipalityId);
      console.log('Belediye detay cevabı:', data);
      window.MunicipalityRenderer.renderMunicipality(data, fields);
    } catch (err) {
      console.error('Belediye detayı alınamadı:', err);
      window.MunicipalityRenderer.renderError(
        'Belediye detayları yüklenemedi.',
        fields
      );
    }
  }

  // Sayfa yüklendiğinde çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMunicipalityDetail);
  } else {
    loadMunicipalityDetail();
  }
})();