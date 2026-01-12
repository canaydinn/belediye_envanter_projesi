// api/src/routes/maintenance.routes.js
const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenance.controller');
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
  maintenanceController.listTickets
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
  maintenanceController.getTicketById
);

/**
 * WRITE
 * - POST: ADMIN, TASINIR_KAYIT, KULLANICI
 * - PATCH/complete: ADMIN, TASINIR_KONTROL
 * - DELETE: ADMIN
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.KULLANICI),
  maintenanceController.createTicket
);

router.patch(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL),
  maintenanceController.updateTicket
);

router.post(
  '/:id/complete',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL),
  maintenanceController.completeTicket
);

router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  maintenanceController.deleteTicket
);

module.exports = router;
