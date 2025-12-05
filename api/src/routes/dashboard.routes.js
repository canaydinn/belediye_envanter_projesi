const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');

// Admin dashboard istatistikleri
router.get('/stats', auth, dashboardController.getMunicipalityStats);

module.exports = router;