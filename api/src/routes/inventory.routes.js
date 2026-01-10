// api/src/routes/inventory.routes.js
const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');
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
  inventoryController.listInventory
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
  inventoryController.getInventoryById
);

/**
 * WRITE (ADMIN, TASINIR_KAYIT, TASINIR_KONTROL)
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT),
  inventoryController.createInventoryItem
);
router.patch(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL),
  inventoryController.updateInventory
);
router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  inventoryController.deleteInventory
);

module.exports = router;
