const express = require('express');
const router = express.Router();

const assetMovementsController = require('../controllers/assetMovements.controller');
const auth = require('../middleware/auth');

router.get('/', auth, assetMovementsController.listAssetMovements);
router.get('/stats', assetMovementsController.getMovementStats);
router.get('/movement-type-distribution',auth,assetMovementsController.getMovementTypeDistribution
);
router.get('/recent', assetMovementsController.getRecentAssetMovements);
module.exports = router;