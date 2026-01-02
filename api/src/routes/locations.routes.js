// api/src/routes/locations.routes.js
const express = require('express');
const router = express.Router();

const locationsController = require('../controllers/locations.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// READ (Superadmin + Municipality Admin + User)
// ÖNEMLİ: /search route'u /:id route'undan ÖNCE olmalı, yoksa /search isteği /:id route'una yakalanır
router.get('/stats', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.getLocationStats);
router.get('/type-distribution', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.getLocationTypeDistribution);
router.get('/search', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.listLocationsFiltered);
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.listLocations);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), locationsController.getLocationById);

// WRITE (Superadmin + Municipality Admin)
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), locationsController.createLocation);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), locationsController.updateLocation);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), locationsController.deleteLocation);

module.exports = router;
