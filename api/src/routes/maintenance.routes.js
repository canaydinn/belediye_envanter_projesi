const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenance.controller');
const { requireAuth } = require('../../src/middleware/auth.middleware');
const { requireRole } = require('../../src/middleware/role.middleware');

router.use(requireAuth);

// POST /api/maintenance
router.post('/', maintenanceController.createTicket);

// GET /api/maintenance
// Query: ?status=&departmentId=&priority=&page=&limit=
router.get('/', maintenanceController.listTickets);

// GET /api/maintenance/:id
router.get('/:id', maintenanceController.getTicketById);

// PATCH /api/maintenance/:id
router.patch('/:id', requireRole(['admin', 'department_manager']), maintenanceController.updateTicket);

// POST /api/maintenance/:id/complete
router.post('/:id/complete', requireRole(['admin', 'department_manager']), maintenanceController.completeTicket);

// DELETE /api/maintenance/:id
router.delete('/:id', requireRole(['admin']), maintenanceController.deleteTicket);

module.exports = router;
