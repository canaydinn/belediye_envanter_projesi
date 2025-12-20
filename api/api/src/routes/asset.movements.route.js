// api/src/routes/asset.movements.route.js
const express = require('express');
const router = express.Router();

const assetMovementsController = require('../controllers/assetMovements.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Municipality Admin + User)
 */
router.get('/', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.listAssetMovements);
router.get('/stats', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getMovementStats);
router.get('/movement-type-distribution', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getMovementTypeDistribution);
router.get('/recent', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getRecentAssetMovements);
router.get('/filter', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.filterMovements);

router.get('/stats/last-30-days', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getLastThirtyDaysMovementsTotal);
router.get('/stats/today', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getTodayMovementsTotal);
router.get('/stats/maintenance', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getMaintenanceMovementsTotal);
router.get('/stats/zimmet', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetMovementsController.getZimmetMovementsTotal);

/**
 * WRITE (Municipality Admin only)
 */
router.post('/', authorize(ROLES.MUNICIPALITY_ADMIN), assetMovementsController.createAssetMovement);

module.exports = router;
