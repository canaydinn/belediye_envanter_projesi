const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

router.get('/', settingsController.getSettings);
router.put('/appearance', settingsController.updateAppearance);
router.put('/notifications', settingsController.updateNotifications);
router.put('/preferences', settingsController.updatePreferences);
router.put('/security', settingsController.updateSecurity);

module.exports = router;

