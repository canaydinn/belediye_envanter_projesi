// api/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const softAuth = require('../middleware/softAuth');

// Public
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/municipality-signup', authController.municipalitySignup);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected (oturum gerekli)
router.get('/me', auth, authController.me);
router.post('/change-password', auth, authController.changePassword);
router.post('/refresh', softAuth, authController.refreshToken);
router.post('/logout', auth, authController.logout);

module.exports = router;
