// api/src/routes/locations.routes.js
const express = require('express');
const router = express.Router();

const locationsController = require('../controllers/locations.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// READ (Tüm roller)
// ÖNEMLİ: /search route'u /:id route'undan ÖNCE olmalı, yoksa /search isteği /:id route'una yakalanır
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
  locationsController.getLocationStats
);
router.get(
  '/type-distribution',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  locationsController.getLocationTypeDistribution
);
router.get(
  '/search',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  locationsController.listLocationsFiltered
);
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
  locationsController.listLocations
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
  locationsController.getLocationById
);

// WRITE (Superadmin + Admin)
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), locationsController.createLocation);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), locationsController.updateLocation);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), locationsController.deleteLocation);

module.exports = router;
