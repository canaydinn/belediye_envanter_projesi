const express = require('express');
const router = express.Router();

// 🔐 Kimlik doğrulama middleware'i
// - Token doğrular
// - Kullanıcıyı DB’den çeker
// - req.user set eder
const auth = require('../middleware/auth');

// 🔒 Rol bazlı yetkilendirme
// - req.user.role_id üzerinden kontrol yapar
const authorize = require('../middleware/authorize');

// 🏢 Multi-tenant (belediye) sınırlandırması
// - Superadmin hariç herkes municipality_id ile sınırlandırılır
const tenantScope = require('../middleware/tenantScope');

// 🎭 Sistem genelinde kullanılan rol sabitleri
const ROLES = require('../constants/roles');

/**
 * ======================================================
 * PUBLIC ROUTES (HERKESE AÇIK)
 * ======================================================
 * - Giriş
 * - Kayıt
 * - Şifre sıfırlama
 *
 * Bu endpoint'lerde:
 * ❌ auth yok
 * ❌ authorize yok
 * ❌ tenantScope yok
 */
router.use('/auth', require('./auth.routes'));

/**
 * ======================================================
 * SUPERADMIN ONLY
 * ======================================================
 * Sadece sistem yöneticisi (role_id = 1) erişebilir
 *
 * Akış:
 * 1️⃣ auth → kimlik doğrulama
 * 2️⃣ authorize → rol kontrolü (SUPERADMIN)
 * 3️⃣ route handler
 */

/**
 * Belediyeleri listeleme / yönetme
 * Örn:
 * - Yeni belediye ekleme
 * - Lisans / kota işlemleri
 */
router.use(
  '/admin/municipalities',
  auth,                              // Token + kullanıcı doğrulama
  authorize(ROLES.SUPERADMIN),       // Sadece superadmin
  require('./municipalities.routes')
);

/**
 * Superadmin paneline ait özel işlemler
 * (istatistikler, sistem logları vb.)
 */
router.use(
  '/superadmin',
  auth,                              // Kimlik doğrulama
  authorize(ROLES.SUPERADMIN),       // Rol kontrolü
  require('./superadmin.routes')
);

/**
 * ======================================================
 * MULTI-TENANT ROUTES (BELEDİYE KAPSAMLI)
 * ======================================================
 * Bu bölüm sistemin KALBİ
 *
 * Kurallar:
 * - auth ZORUNLU
 * - tenantScope ZORUNLU
 * - Kullanıcı sadece kendi belediyesinin verisini görür
 * - Superadmin isterse tüm belediyeleri görür
 */

/**
 * Kullanıcı yönetimi (belediye içi)
 */
router.use(
  '/users',
  auth,                // Kullanıcı doğrulama
  tenantScope(),       // municipality_id sınırı
  require('./user.routes')
);

/**
 * Envanter (demirbaşlar)
 */
router.use(
  '/assets',
  auth,
  tenantScope(),
  require('./assets.route')
);

/**
 * Envanter kategorileri
 */
router.use(
  '/asset-categories',
  auth,
  tenantScope(),
  require('./asset.categories.routes')
);

/**
 * Müdürlükler / birimler
 */
router.use(
  '/departments',
  auth,
  tenantScope(),
  require('./department.routes')
);

/**
 * Lokasyonlar (depo, bina, saha vb.)
 */
router.use(
  '/locations',
  auth,
  tenantScope(),
  require('./locations.routes')
);

/**
 * Stok / envanter detay işlemleri
 */
router.use(
  '/inventory',
  auth,
  tenantScope(),
  require('./inventory.routes')
);

/**
 * Bakım / arıza kayıtları
 */
router.use(
  '/maintenance',
  auth,
  tenantScope(),
  require('./maintenance.routes')
);

/**
 * Raporlama
 */
router.use(
  '/reports',
  auth,
  tenantScope(),
  require('./reports.routes')
);

/**
 * Sistem / kullanıcı hareket logları
 */
router.use(
  '/audit',
  auth,
  tenantScope(),
  require('./audit.routes')
);

/**
 * QR kod işlemleri
 */
router.use(
  '/qrcode',
  auth,
  tenantScope(),
  require('./qrcode.routes')
);

/**
 * Gösterge paneli (dashboard)
 */
router.use(
  '/dashboard',
  auth,
  tenantScope(),
  require('./dashboard.routes')
);

/**
 * Varlık hareketleri (zimmet, transfer, bakım vb.)
 */
router.use(
  '/asset-movements',
  auth,
  tenantScope(),
  require('./asset.movements.route')
);

/**
 * Dosya yükleme (resim, belge vb.)
 */
router.use(
  '/uploads',
  auth,
  tenantScope(),
  require('./uploads.routes')
);

// Ana router export
module.exports = router;
