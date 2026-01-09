const express = require('express');
const router = express.Router();

const assetsController = require('../controllers/assets.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Tüm roller - herkes envanteri görebilir)
 */
router.get(
  '/',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.listAssets
);

router.get(
  '/filters',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.getFilterOptions
);

router.get(
  '/status-distribution',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.getStatusDistribution
);

router.get(
  '/recent-assets',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.getRecentAssets
);

router.get(
  '/qr/:code',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.getAssetByQRCode
);

router.get(
  '/:id/qrcode',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.generateAssetQRCode
);

router.get(
  '/:id',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetsController.getAssetById
);

/**
 * WRITE - Envanter Ekleme (ADMIN ve Taşınır Kayıt yetkilisi)
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT),
  assetsController.createAsset
);

router.post(
  '/bulk-import',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT),
  require('../controllers/bulk-import.controller').bulkImportAssets
);

/**
 * WRITE - Envanter Güncelleme (ADMIN, Taşınır Kayıt ve Kontrol yetkilisi)
 */
router.put(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL),
  assetsController.updateAsset
);

/**
 * DELETE - Envanter Silme (Sadece ADMIN)
 */
router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  assetsController.deleteAsset
);

/**
 * APPROVAL - Envanter Onay/Red (ADMIN ve Taşınır Kontrol yetkilisi)
 */
router.post(
  '/:id/approve',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL),
  assetsController.approveAsset
);

router.post(
  '/:id/reject',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL),
  assetsController.rejectAsset
);

module.exports = router;
