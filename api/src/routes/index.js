const express = require('express');
const router = express.Router();
const superadminRoutes = require('./superadmin.routes');

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));            // <- user.routes.js
router.use('/assets', require('./assets.route'));          // <- assets.route.js
router.use('/departments', require('./department.routes'));
router.use('/locations', require('./locations.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/maintenance', require('./maintenance.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/uploads', require('./uploads.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/qrcode', require('./qrcode.routes'));
router.use('/admin/municipalities', require('./municipalities.routes'));
router.use('/superadmin', superadminRoutes);
router.use('/dashboard', require('./dashboard.routes'));
router.use('/asset-movements', require('./asset.movements.route'));

module.exports = router;
