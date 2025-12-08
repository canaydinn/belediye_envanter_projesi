const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');

// Admin dashboard istatistikleri
router.get('/stats', auth, dashboardController.getMunicipalityStats);
router.get('/municipality', auth, dashboardController.getMunicipalityInfo);
router.get('/recent-movements', auth, dashboardController.getRecentAssetMovements);
router.get('/category-distribution', auth, dashboardController.getCategoryDistribution);
router.get('/upcoming-maintenance', auth, dashboardController.getUpcomingMaintenance);
module.exports = router;