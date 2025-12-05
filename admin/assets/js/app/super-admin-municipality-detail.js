// admin/assets/js/app/super-admin-municipality-detail.js
(function () {
  const params = new URLSearchParams(window.location.search);
  const municipalityId = params.get('id');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

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
    plan_type: document.querySelector('[data-role="municipality-plan_type"]'),
    licenseEnd: document.querySelector('[data-role="municipality-license-end"]'),
    quotaEnd: document.querySelector('[data-role="municipality-quota-end"]'),
    created: document.querySelector('[data-role="municipality-created"]'),
    updated: document.querySelector('[data-role="municipality-updated"]'),
    edit: document.querySelector('[data-role="municipality-edit"]'),
    users: document.querySelector('[data-role="municipality-users"]'),
  };

  function setText(element, value) {
    if (!element) return;
    element.textContent = value ?? '-';
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  }

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

  function setStatus(status, isActive) {
    if (!fields.status) return;
    fields.status.innerHTML = createStatusBadge(status, isActive);
  }

  function fetchJson(url) {
    return fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`${url} isteği başarısız (status: ${response.status})`);
      }
      return response.json();
    });
  }

  function renderMunicipality(data) {
    const {
       id,
    name,
    province,
    district,
    contact_phone: phone,
    contact_email: email,
    address,
    tax_number,                         // tablo kolonundan
    contact_person: contactPerson,
    notes: description,                 // açıklama / not için
    status,
    is_active: isActive,
    plan_type: plan_type,                // plan_type kolonundan
    domain_url: website,                // website yerine domain_url
    license_end_date: licenseEndDate,
    quota_end_date: quotaEndDate,
    created_at: createdAt,
    updated_at: updatedAt,
    } = data || {};

    const location = [province, district].filter(Boolean).join(' / ') || '-';

    setText(fields.name, name || 'Belediye Detayı');
  setText(fields.nameDetail, name || '-');
  setText(fields.location, location);
  setText(fields.locationDetail, location);

  setStatus(status, isActive);

  setText(fields.phone, phone || '-');
  setText(fields.email, email || '-');
  setText(fields.address, address || '-');
  setText(fields.taxNo, tax_number || '-');  // tax_number kolonunu kullan
  setText(fields.website, website || '-');   // domain_url bu alana yazıldı
  setText(fields.contact, contactPerson || '-');
  setText(fields.description, description || '-');

  setText(fields.active, isActive ? 'Aktif' : 'Pasif');
  // planType değerini ekrana yaz
  setText(fields.plan_type.value, plan_type ? 'standart' : 'pro');
  setText(fields.licenseEnd, formatDate(licenseEndDate));
  setText(fields.quotaEnd, formatDate(quotaEndDate));
  setText(fields.created, formatDate(createdAt));
  setText(fields.updated, formatDate(updatedAt));

    if (fields.edit && id) {
      fields.edit.href = `../admin/super-admin-municipality-edit.html?id=${id}`;
    }

    if (fields.users && id) {
      fields.users.href = `../admin/super-admin-users.html?municipality_id=${id}`;
    }
  }

  function renderError(message) {
    setText(fields.name, 'Belediye bulunamadı');
    setText(fields.location, message || 'Geçerli bir belediye IDsi ile deneyin.');
    if (fields.status) {
      fields.status.innerHTML = '<span class="badge bg-label-danger">Hata</span>';
    }
  }

  if (!municipalityId) {
    renderError('Geçerli bir belediye IDsi bulunamadı.');
    return;
  }

 /*  fetchJson(`http://localhost:4000/api/superadmin/municipalities/${municipalityId}`)
    .then(renderMunicipality)
    .catch((err) => {
      console.error('Belediye detayı alınamadı:', err);
      renderError('Belediye detayları yüklenemedi.');
    }); */
    fetchJson(`http://localhost:4000/api/superadmin/municipalities/${municipalityId}`)
  .then((data) => {
    console.log('Belediye detay cevabı:', data);   // <--- EKLE
    renderMunicipality(data);
  })
  .catch((err) => {
    console.error('Belediye detayı alınamadı:', err);
    renderError('Belediye detayları yüklenemedi.');
  });

})();