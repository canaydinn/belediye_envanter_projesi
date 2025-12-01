const express = require('express');
const router = express.Router();

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

module.exports = router;
