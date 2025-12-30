// api/src/routes/locations.routes.js
const express = require('express');
const router = express.Router();

const locationsController = require('../controllers/locations.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// READ
// ÖNEMLİ: /search route'u /:id route'undan ÖNCE olmalı, yoksa /search isteği /:id route'una yakalanır
router.get('/stats', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.getLocationStats);
router.get('/type-distribution', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.getLocationTypeDistribution);
router.get('/search', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.listLocationsFiltered);
router.get('/', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.listLocations);
router.get('/:id', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.getLocationById);

// WRITE (admin)
router.post('/', authorize(ROLES.MUNICIPALITY_ADMIN), locationsController.createLocation);
router.put('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), locationsController.updateLocation);
router.delete('/:id', authorize(ROLES.MUNICIPALITY_ADMIN), locationsController.deleteLocation);

module.exports = router;
