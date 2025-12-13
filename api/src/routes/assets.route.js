const express = require('express');
const router = express.Router();

const assetsController = require('../controllers/assets.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Municipality Admin + User)
 */
router.get('/', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetsController.listAssets);
router.get('/filters', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetsController.getFilterOptions);
router.get('/status-distribution', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetsController.getStatusDistribution);
router.get('/recent-assets', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetsController.getRecentAssets);
router.get('/:id', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), assetsController.getAssetById);

/**
 * WRITE (Municipality Admin only)
 */
router.post('/', authorize(ROLES.MUNICIPALITY_ADMIN), assetsController.createAsset);
router.put('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), assetsController.updateAsset);
router.delete('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), assetsController.deleteAsset);

module.exports = router;
