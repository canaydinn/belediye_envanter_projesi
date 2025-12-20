// api/src/routes/maintenance.routes.js
const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenance.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Municipality Admin + User)
 */
router.get(
  '/',
  authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  maintenanceController.listTickets
);

router.get(
  '/:id',
  authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  maintenanceController.getTicketById
);

/**
 * WRITE (Municipality Admin only)
 */
router.post(
  '/',
  authorize(ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.createTicket
);

router.patch(
  '/:id',
  authorize(ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.updateTicket
);

router.post(
  '/:id/complete',
  authorize(ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.completeTicket
);

router.delete(
  '/:id',
  authorize(ROLES.MUNICIPALITY_ADMIN),
  maintenanceController.deleteTicket
);

module.exports = router;
