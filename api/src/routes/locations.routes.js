// api/src/routes/locations.route.js
const express = require('express');
const router = express.Router();

const locationsController = require('../controllers/locations.controller');
const auth = require('../middleware/auth');
// varsa auth middleware burada:
// const auth = require('../middlewares/auth');
router.use(auth);

// 📌 ÖNEMLİ: Özel path'ler (stats vb.) mutlaka parametreli rotalardan ÖNCE gelmeli

// İstatistikler
router.get('/stats', locationsController.getLocationStats);

// Liste (opsiyonel, varsa)
router.get('/', locationsController.listLocations);
// GET /api/locations/type-distribution
router.get('/type-distribution', locationsController.getLocationTypeDistribution);
// Tek lokasyon
router.get('/:id', locationsController.getLocationById);

// Yeni lokasyon oluşturma
router.post('/', locationsController.createLocation);

// Diğer güncelleme/silme endpoint’lerin varsa burada:
// router.put('/:id', locationsController.updateLocation);
// router.delete('/:id', locationsController.deleteLocation);

module.exports = router;
