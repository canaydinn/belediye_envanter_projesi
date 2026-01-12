console.log('DASHBOARD ROUTER LOADED');

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');
//router.use(auth); 
// Admin dashboard istatistikleri
// Tüm roller (1-6) erişebilir
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
  dashboardController.getMunicipalityStats
);
router.get(
  '/municipality',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  dashboardController.getMunicipalityInfo
);
router.get(
  '/recent-movements',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  dashboardController.getRecentAssetMovements
);
router.get(
  '/category-distribution',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  dashboardController.getCategoryDistribution
);
router.get(
  '/upcoming-maintenance',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  dashboardController.getUpcomingMaintenance
);
module.exports = router;