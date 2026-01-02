// api/src/routes/asset.movements.route.js
const express = require('express');
const router = express.Router();

const assetMovementsController = require('../controllers/assetMovements.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Superadmin + Municipality Admin + User)
 */
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.listAssetMovements);
router.get('/stats', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getMovementStats);
router.get('/movement-type-distribution', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getMovementTypeDistribution);
router.get('/recent', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getRecentAssetMovements);
router.get('/filter', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.filterMovements);

router.get('/stats/last-30-days', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getLastThirtyDaysMovementsTotal);
router.get('/stats/today', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getTodayMovementsTotal);
router.get('/stats/maintenance', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getMaintenanceMovementsTotal);
router.get('/stats/zimmet', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getZimmetMovementsTotal);

/**
 * WRITE (Superadmin + Municipality Admin)
 */
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), assetMovementsController.createAssetMovement);

module.exports = router;
