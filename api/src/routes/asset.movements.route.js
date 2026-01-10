// api/src/routes/asset.movements.route.js
const express = require('express');
const router = express.Router();

const assetMovementsController = require('../controllers/assetMovements.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Tüm roller)
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
  assetMovementsController.listAssetMovements
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
  assetMovementsController.getMovementStats
);
router.get(
  '/movement-type-distribution',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.getMovementTypeDistribution
);
router.get(
  '/recent',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.getRecentAssetMovements
);
router.get(
  '/filter',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.filterMovements
);

router.get(
  '/stats/last-30-days',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.getLastThirtyDaysMovementsTotal
);
router.get(
  '/stats/today',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.getTodayMovementsTotal
);
router.get(
  '/stats/maintenance',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.getMaintenanceMovementsTotal
);
router.get(
  '/stats/zimmet',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  assetMovementsController.getZimmetMovementsTotal
);

/**
 * WRITE (ADMIN, TASINIR_KAYIT, BIRIM_SORUMLUSU)
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.BIRIM_SORUMLUSU),
  assetMovementsController.createAssetMovement
);

module.exports = router;
