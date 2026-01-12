// api/src/routes/municipalities.routes.js
const express = require('express');
const router = express.Router();

const municipalitiesController = require('../controllers/municipalities.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// Tüm belediyeleri listele
router.get(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN), // belediyeleri listeleme: superadmin + admin
  municipalitiesController.getAll
);

// Tek belediyeyi getir
router.get(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.ADMIN),
  municipalitiesController.getById
);

// Yeni belediye oluştur
router.post(
  '/',
  authorize(ROLES.SUPERADMIN),
  
  municipalitiesController.create
);

// Belediye güncelle
router.put(
  '/:id',
  authorize(ROLES.SUPERADMIN),
  
  municipalitiesController.update
);

// Belediye pasifleştir (soft delete)
router.patch(
  '/:id/deactivate',
  authorize(ROLES.SUPERADMIN),
  
  municipalitiesController.deactivate
);

module.exports = router;
