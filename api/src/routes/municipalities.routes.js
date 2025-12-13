// api/src/routes/municipalities.routes.js
const express = require('express');
const router = express.Router();

const municipalitiesController = require('../controllers/municipalities.controller');
const auth = require('../middleware/auth');

// Tüm belediyeleri listele
router.get(
  '/',
  auth,           // Şimdilik sistem admin / belediye admin = role_id 1
  municipalitiesController.getAll
);

// Tek belediyeyi getir
router.get(
  '/:id',
  auth,
 
  municipalitiesController.getById
);

// Yeni belediye oluştur
router.post(
  '/',
  auth,
  
  municipalitiesController.create
);

// Belediye güncelle
router.put(
  '/:id',
  auth,
  
  municipalitiesController.update
);

// Belediye pasifleştir (soft delete)
router.patch(
  '/:id/deactivate',
  auth,
  
  municipalitiesController.deactivate
);

module.exports = router;
