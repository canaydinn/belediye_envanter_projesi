// api/src/routes/municipalities.routes.js
const express = require('express');
const router = express.Router();

const municipalitiesController = require('../controllers/municipalities.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// Tüm belediyeleri listele
router.get(
  '/',
  authorize(ROLES.MUNICIPALITY_SUPER_ADMIN,ROLES.MUNICIPALITY_ADMIN, ROLES.USER),           // Şimdilik sistem admin / belediye admin = role_id 1
  municipalitiesController.getAll
);

// Tek belediyeyi getir
router.get(
  '/:id',
  authorize(ROLES.MUNICIPALITY_SUPER_ADMIN,ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
 
  municipalitiesController.getById
);

// Yeni belediye oluştur
router.post(
  '/',
  authorize(ROLES.MUNICIPALITY_SUPER_ADMIN),
  
  municipalitiesController.create
);

// Belediye güncelle
router.put(
  '/:id',
  authorize(ROLES.MUNICIPALITY_SUPER_ADMIN),
  
  municipalitiesController.update
);

// Belediye pasifleştir (soft delete)
router.patch(
  '/:id/deactivate',
  authorize(ROLES.MUNICIPALITY_SUPER_ADMIN),
  
  municipalitiesController.deactivate
);

module.exports = router;
