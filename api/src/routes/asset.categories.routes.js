// api/src/routes/asset.categories.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const assetCategoriesController = require('../controllers/assetCategories.controller');

// Kategori listesi
router.get('/', auth,assetCategoriesController.listCategories);
router.get('/stats', auth, assetCategoriesController.getCategoryStats);
// Kategori dağılımı (kategori türü ve asset sayıları)
router.get('/distribution', auth, assetCategoriesController.getCategoryDistribution);
// Yeni kategori oluşturma
router.post('/', auth, assetCategoriesController.createCategory);
module.exports = router;