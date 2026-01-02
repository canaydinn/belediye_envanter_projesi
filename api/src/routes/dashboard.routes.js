console.log('DASHBOARD ROUTER LOADED');

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');
//router.use(auth); 
// Admin dashboard istatistikleri
// SUPERADMIN, MUNICIPALITY_ADMIN ve USER erişebilir
router.get('/stats', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getMunicipalityStats);
router.get('/municipality', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getMunicipalityInfo);
router.get('/recent-movements', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getRecentAssetMovements);
router.get('/category-distribution', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getCategoryDistribution);
router.get('/upcoming-maintenance', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getUpcomingMaintenance);
module.exports = router;