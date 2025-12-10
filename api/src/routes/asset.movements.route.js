const express = require('express');
const router = express.Router();

const assetMovementsController = require('../controllers/assetMovements.controller');
const auth = require('../middleware/auth');

router.get('/', auth, assetMovementsController.listAssetMovements);
router.get('/stats', assetMovementsController.getMovementStats);
router.get('/movement-type-distribution',auth,assetMovementsController.getMovementTypeDistribution);
router.get('/recent',auth, assetMovementsController.getRecentAssetMovements);
router.post('/', auth, assetMovementsController.createAssetMovement);
router.get('/stats/last-30-days', auth, assetMovementsController.getLastThirtyDaysMovementsTotal);
router.get('/stats/today', auth, assetMovementsController.getTodayMovementsTotal);
router.get('/stats/maintenance', auth, assetMovementsController.getMaintenanceMovementsTotal);
router.get('/stats/zimmet', auth, assetMovementsController.getZimmetMovementsTotal);
router.get('/filter', auth, assetMovementsController.filterMovements);
router.get('/movement-type-ratios', auth, assetMovementsController.getMovementTypeDistribution);
module.exports = router;