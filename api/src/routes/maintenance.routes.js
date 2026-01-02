// api/src/routes/maintenance.routes.js
const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenance.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Superadmin + Municipality Admin + User)
 */
router.get(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  maintenanceController.listTickets
);

router.get(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  maintenanceController.getTicketById
);

/**
 * WRITE (Superadmin + Municipality Admin)
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.createTicket
);

router.patch(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.updateTicket
);

router.post(
  '/:id/complete',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.completeTicket
);

router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.deleteTicket
);

module.exports = router;
