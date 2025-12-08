const express = require('express');
const router = express.Router();

const envanterController = require('../controllers/assets.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const assetCategoriesController = require('../controllers/assetCategories.controller');

// Önce spesifik path’ler:
router.get('/', auth, envanterController.listAssets);
router.get('/filters', auth, envanterController.getFilterOptions);
router.get('/status-distribution', auth, envanterController.getStatusDistribution);

// Sonra dinamik path’ler:
router.get('/recent-assets', auth, envanterController.getRecentAssets);

router.get('/:id', auth, envanterController.getAssetById);
router.post('/', auth, envanterController.createAsset);
router.put('/:id', auth, requireRole([1, 2, 3]), envanterController.updateAsset);
router.delete('/:id', auth, requireRole([1]), envanterController.deleteAsset);
module.exports = router;
