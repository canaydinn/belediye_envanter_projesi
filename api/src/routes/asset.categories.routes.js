// api/src/routes/asset.categories.routes.js
const express = require('express');
const router = express.Router();

const assetCategoriesController = require('../controllers/assetCategories.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Tüm roller - herkes kategorileri görebilir)
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
  assetCategoriesController.listCategories
);

router.get(
  '/stats',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetCategoriesController.getCategoryStats
);

router.get(
  '/distribution',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetCategoriesController.getCategoryDistribution
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
  assetCategoriesController.getCategoryById
);

/**
 * WRITE (Superadmin + Admin)
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  assetCategoriesController.createCategory
);
router.put(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  assetCategoriesController.updateCategory
);
router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  assetCategoriesController.deleteCategory
);
module.exports = router;
