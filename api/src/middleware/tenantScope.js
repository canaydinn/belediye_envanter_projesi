// api/src/middleware/tenantScope.js

// Rol sabitleri (SUPERADMIN, MUNICIPALITY_ADMIN, USER)
const ROLES = require('../constants/roles');

/**
 * TENANT SCOPE MIDDLEWARE
 * --------------------------------------------------
 * Bu middleware şunu garanti eder:
 *
 * - İstek bir "belediye kapsamı" içinde mi çalışıyor?
 * - Kullanıcı sadece kendi belediyesine ait verilere mi erişiyor?
 *
 * Superadmin için opsiyonel olarak tenant kısıtı kaldırılabilir.
 *
 * Kullanım:
 *   tenantScope()
 *   tenantScope({ allowSuperadmin: false })
 */
module.exports = function tenantScope({ allowSuperadmin = true } = {}) {
  return (req, res, next) => {
    // auth middleware tarafından set edilmiş kullanıcı bilgileri
    const { role_id, municipality_id } = req.user || {};

    // 1️⃣ Eğer kullanıcı SUPERADMIN ise
    // ve allowSuperadmin = true ise
    // → belediye kısıtı uygulanmaz
    // → tüm tenant’lara erişebilir
    if (allowSuperadmin && role_id === ROLES.SUPERADMIN) {
      return next();
    }

    // 2️⃣ Superadmin değilse:
    // Kullanıcının mutlaka bir municipality_id’si olmalı
    // Aksi halde hangi belediye adına işlem yaptığı bilinemez
    if (!municipality_id) {
      return res.status(403).json({
        message: 'Belediye kapsamı bulunamadı',
      });
    }

    // 3️⃣ Belediye kapsamını request’e ekle
    // Controller’lar isterse buradan da okuyabilir
    // (req.user.municipality_id ile aynı değerdir,
    // ama tenant kavramını netleştirmek için ayrıdır)
    req.tenantMunicipalityId = municipality_id;

    // 4️⃣ Belediye sınırı geçildiyse devam et
    next();
  };
};
