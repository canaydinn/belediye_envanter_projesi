// admin/assets/js/app/super-admin-municipality-renderer.js
// Belediye detay sayfası render fonksiyonları

/**
 * Belediye verilerini sayfaya render eder
 * @param {Object} data - Belediye verisi
 * @param {Object} fields - DOM element referansları
 */
function renderMunicipality(data, fields) {
  const {
    id,
    name,
    province,
    district,
    contact_phone: phone,
    contact_email: email,
    address,
    tax_number,
    contact_person: contactPerson,
    notes: description,
    status,
    is_active: isActive,
    plan_type: planType,
    domain_url: website,
    license_end_date: licenseEndDate,
    quota_end_date: quotaEndDate,
    created_at: createdAt,
    updated_at: updatedAt,
  } = data || {};

  const location = [province, district].filter(Boolean).join(' / ') || '-';
  const utils = window.SuperAdminUtils;

  // Başlık ve konum
  utils.setText(fields.name, name || 'Belediye Detayı');
  utils.setText(fields.nameDetail, name || '-');
  utils.setText(fields.location, location);
  utils.setText(fields.locationDetail, location);

  // Durum badge'i
  if (fields.status) {
    fields.status.innerHTML = utils.createStatusBadge(status, isActive);
  }

  // İletişim bilgileri
  utils.setText(fields.phone, phone || '-');
  utils.setText(fields.email, email || '-');
  utils.setText(fields.address, address || '-');
  utils.setText(fields.taxNo, tax_number || '-');
  utils.setText(fields.website, website || '-');
  utils.setText(fields.contact, contactPerson || '-');
  utils.setText(fields.description, description || '-');

  // Sistem bilgileri
  utils.setText(fields.active, isActive ? 'Aktif' : 'Pasif');
  
  // Plan tipi
  if (fields.plan_type) {
    const planText = planType ? 'Pro' : 'Standart';
    utils.setText(fields.plan_type, planText);
  }

  // Tarihler
  utils.setText(fields.licenseEnd, utils.formatDate(licenseEndDate));
  utils.setText(fields.quotaEnd, utils.formatDate(quotaEndDate));
  utils.setText(fields.created, utils.formatDate(createdAt));
  utils.setText(fields.updated, utils.formatDate(updatedAt));

  // Link'leri ayarla
  if (fields.edit && id) {
    fields.edit.href = `../admin/super-admin-municipality-edit.html?id=${id}`;
  }

  if (fields.users && id) {
    fields.users.href = `../admin/super-admin-users.html?municipality_id=${id}`;
  }
}

/**
 * Hata mesajını sayfaya render eder
 * @param {string} message - Hata mesajı
 * @param {Object} fields - DOM element referansları
 */
function renderError(message, fields) {
  const utils = window.SuperAdminUtils;
  
  utils.setText(fields.name, 'Belediye bulunamadı');
  utils.setText(fields.location, message || 'Geçerli bir belediye IDsi ile deneyin.');
  
  if (fields.status) {
    fields.status.innerHTML = '<span class="badge bg-label-danger">Hata</span>';
  }
}

// Global namespace'e ekle
window.MunicipalityRenderer = {
  renderMunicipality,
  renderError,
};

