// admin/assets/js/app/municipality-user-renderer.js
// Municipality User detay sayfası render fonksiyonları

/**
 * Kullanıcı verilerini sayfaya render eder
 * @param {Object} data - Kullanıcı verisi
 * @param {Object} fields - DOM element referansları
 */
async function renderUser(data, fields) {
  const {
    id,
    username,
    email,
    full_name: fullName,
    role_id: roleId,
    municipality_id: municipalityId,
    is_active: isActive,
    phone,
    email_verified_at: emailVerifiedAt,
    last_login_at: lastLoginAt,
    created_at: createdAt,
    updated_at: updatedAt,
    role_name: roleName,
    municipality_name: municipalityName
  } = data || {};

  const utils = window.SuperAdminUtils;

  // Başlık ve e-posta
  utils.setText(fields.name, fullName || 'Kullanıcı Detayı');
  utils.setText(fields.email, email || 'E-posta yükleniyor...');
  utils.setText(fields.emailDetail, email || '-');

  // Durum badge'i
  if (fields.status) {
    const statusText = isActive ? 'Aktif' : 'Pasif';
    const statusClass = isActive ? 'bg-label-success' : 'bg-label-danger';
    fields.status.innerHTML = `<span class="badge ${statusClass}">${statusText}</span>`;
  }

  // Kullanıcı bilgileri
  utils.setText(fields.fullName, fullName || '-');
  utils.setText(fields.username, username || '-');
  utils.setText(fields.phone, phone || '-');
  
  // Rol bilgisi
  if (roleName) {
    utils.setText(fields.role, roleName);
  } else if (roleId) {
    // Rol adını almak için API çağrısı yapabiliriz, şimdilik ID gösterelim
    try {
      const roleData = await window.MunicipalityUserAPI.getRoleDetail(roleId);
      utils.setText(fields.role, roleData.name || `Rol ID: ${roleId}`);
    } catch (err) {
      utils.setText(fields.role, `Rol ID: ${roleId}`);
    }
  } else {
    utils.setText(fields.role, '-');
  }

  // Belediye bilgisi (API'den gelen municipality_name kullanılır)
  if (municipalityName) {
    utils.setText(fields.municipality, municipalityName);
  } else if (municipalityId) {
    utils.setText(fields.municipality, `Belediye ID: ${municipalityId}`);
  } else {
    utils.setText(fields.municipality, '-');
  }

  // E-posta doğrulama
  if (emailVerifiedAt) {
    utils.setText(fields.emailVerified, 'Doğrulandı');
  } else {
    utils.setText(fields.emailVerified, 'Doğrulanmadı');
  }

  // Son giriş
  utils.setText(fields.lastLogin, utils.formatDate(lastLoginAt) || 'Hiç giriş yapılmamış');

  // Sistem bilgileri
  utils.setText(fields.active, isActive ? 'Aktif' : 'Pasif');
  utils.setText(fields.id, id || '-');

  // Tarihler
  utils.setText(fields.created, utils.formatDate(createdAt));
  utils.setText(fields.updated, utils.formatDate(updatedAt));

  // Link'leri ayarla
  if (fields.edit && id) {
    fields.edit.href = `../admin/municipality-user-edit.html?id=${id}`;
  }
}

/**
 * Hata mesajını sayfaya render eder
 * @param {string} message - Hata mesajı
 * @param {Object} fields - DOM element referansları
 */
function renderError(message, fields) {
  const utils = window.SuperAdminUtils;
  
  utils.setText(fields.name, 'Kullanıcı bulunamadı');
  utils.setText(fields.email, message || 'Geçerli bir kullanıcı IDsi ile deneyin.');
  
  if (fields.status) {
    fields.status.innerHTML = '<span class="badge bg-label-danger">Hata</span>';
  }
}

// Global namespace'e ekle
window.MunicipalityUserRenderer = {
  renderUser,
  renderError,
};

