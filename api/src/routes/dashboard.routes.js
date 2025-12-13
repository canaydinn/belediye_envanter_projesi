const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// Admin dashboard istatistikleri
router.get('/stats',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getMunicipalityStats);
router.get('/municipality',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getMunicipalityInfo);
router.get('/recent-movements',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getRecentAssetMovements);
router.get('/category-distribution',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getCategoryDistribution);
router.get('/upcoming-maintenance',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getUpcomingMaintenance);
module.exports = router;