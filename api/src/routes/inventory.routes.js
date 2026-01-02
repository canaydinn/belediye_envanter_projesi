// api/src/routes/inventory.routes.js
const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Superadmin + Municipality Admin + User)
 */
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.listInventory);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.getInventoryById);

/**
 * WRITE (Superadmin + Municipality Admin + User)
 */
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.createInventoryItem);
router.patch('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.updateInventory);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.deleteInventory);

module.exports = router;
