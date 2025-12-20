const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/password', profileController.updatePassword);

module.exports = router;