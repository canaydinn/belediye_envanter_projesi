// api/src/routes/asset.categories.routes.js
const express = require('express');
const router = express.Router();

const assetCategoriesController = require('../controllers/assetCategories.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

/**
 * READ (Superadmin + Municipality Admin + User)
 */
router.get(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  assetCategoriesController.listCategories
);

router.get(
  '/stats',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  assetCategoriesController.getCategoryStats
);

router.get(
  '/distribution',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  assetCategoriesController.getCategoryDistribution
);

router.get(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER),
  assetCategoriesController.getCategoryById
);

/**
 * WRITE (Superadmin + Municipality Admin)
 */
router.post(
  '/',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  assetCategoriesController.createCategory
);
router.put(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  assetCategoriesController.updateCategory
);
router.delete(
  '/:id',
  authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),
  assetCategoriesController.deleteCategory
);
module.exports = router;
