// api/src/middleware/authorize.js

/**
 * AUTHORIZE MIDDLEWARE
 * --------------------------------------------------
 * Bu middleware:
 * - auth middleware'inden SONRA çalışır
 * - req.user.role_id üzerinden rol kontrolü yapar
 *
 * Kullanım örnekleri:
 *   authorize(ROLES.SUPERADMIN)
 *   authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN)
 *
 * Mantık:
 *   → Kullanıcının rolü izin verilen roller arasında mı?
 *   → Değilse 403 (Forbidden)
 */
module.exports = function authorize(...allowedRoleIds) {
  // allowedRoleIds:
  // fonksiyon parametresi olarak gelen rol ID’leri dizisi
  // Örnek: [1] veya [1, 2]
  return (req, res, next) => {
    // 🔍 Debug / log amaçlı
    // Hangi role sahip kullanıcı, hangi endpoint’e erişmeye çalışıyor?
    console.log('[AUTHZ]', {
      role_id: req.user?.role_id,
      url: req.originalUrl,
    });

    // 1️⃣ auth middleware tarafından set edilmiş req.user içinden rolü al
    const roleId = req.user?.role_id;

    // 2️⃣ Güvenlik kontrolü:
    // - req.user yoksa
    // - role_id yoksa
    // - rol, izin verilen roller listesinde değilse
    // → erişimi engelle
    if (!roleId || !allowedRoleIds.includes(roleId)) {
      return res.status(403).json({
        message: 'Bu işlem için yetkiniz yok',
      });
    }

    // 3️⃣ Rol uygunsa bir sonraki middleware / controller’a geç
    next();
  };
};
