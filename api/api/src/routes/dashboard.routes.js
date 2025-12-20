console.log('DASHBOARD ROUTER LOADED');

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');
//router.use(auth); 
// Admin dashboard istatistikleri
router.get('/stats',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getMunicipalityStats);
router.get('/municipality',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getMunicipalityInfo);
router.get('/recent-movements',(req, res, next) => { console.log('ROUTE MATCHED: recent-movements'); next(); },authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getRecentAssetMovements);
router.get('/category-distribution',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getCategoryDistribution);
router.get('/upcoming-maintenance',(req, res, next) => { console.log('ROUTE MATCHED: upcoming-maintenance'); next(); },authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), dashboardController.getUpcomingMaintenance);
module.exports = router;