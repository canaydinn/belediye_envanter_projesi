// api/src/routes/asset.categories.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const assetCategoriesController = require('../controllers/assetCategories.controller');

// Kategori listesi
router.get('/', auth,assetCategoriesController.listCategories);

module.exports = router;