// api/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Giriş
router.post('/login', authController.login);

// Kayıt
router.post('/signup', authController.signup);

// Belediye + admin kullanıcı kaydı
router.post('/municipality-signup', authController.municipalitySignup);
// Oturum bilgisi
router.get('/me', auth, authController.me);
// Şifre işlemleri
router.post('/change-password', auth, authController.changePassword);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Token yenileme
router.post('/refresh', authController.refreshToken);
// Çıkış
router.post('/logout', auth, authController.logout);
router.post('/municipality-signup', authController.municipalitySignup);

module.exports = router;
