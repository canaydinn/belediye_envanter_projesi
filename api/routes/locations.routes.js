const express = require('express');
const router = express.Router();

const locationsController = require('../controllers/locations.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);

// POST /api/locations
router.post('/', requireRole(['admin']), locationsController.createLocation);

// GET /api/locations
router.get('/', locationsController.listLocations);

// GET /api/locations/tree
router.get('/tree', locationsController.getLocationTree);

// GET /api/locations/:id
router.get('/:id', locationsController.getLocationById);

// PATCH /api/locations/:id
router.patch('/:id', requireRole(['admin']), locationsController.updateLocation);

// DELETE /api/locations/:id
router.delete('/:id', requireRole(['admin']), locationsController.deleteLocation);

module.exports = router;
