const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');
const { requireAuth } = require('../../src/middleware/auth.middleware');
const { requireRole } = require('../../src/middleware/role.middleware');

router.use(requireAuth);

// POST /api/inventory
router.post('/', requireRole(['admin', 'department_manager']), inventoryController.createInventoryItem);

// GET /api/inventory
// Query param: ?departmentId=&status=&search=&page=&limit=
router.get('/', inventoryController.listInventory);

// GET /api/inventory/:id
router.get('/:id', inventoryController.getInventoryById);

// PATCH /api/inventory/:id
router.patch('/:id', requireRole(['admin', 'department_manager']), inventoryController.updateInventory);

// DELETE /api/inventory/:id
router.delete('/:id', requireRole(['admin']), inventoryController.deleteInventory);

module.exports = router;
