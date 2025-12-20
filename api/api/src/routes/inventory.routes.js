// api/src/routes/inventory.routes.js
const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventory.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Municipality Admin + User)
 */
router.get('/', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.listInventory);
router.get('/:id', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), inventoryController.getInventoryById);

/**
 * WRITE (Municipality Admin only)
 */
router.post('/', authorize(ROLES.MUNICIPALITY_ADMIN), inventoryController.createInventoryItem);
router.patch('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), inventoryController.updateInventory);
router.delete('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), inventoryController.deleteInventory);

module.exports = router;
