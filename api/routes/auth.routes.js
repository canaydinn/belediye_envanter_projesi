const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', requireAuth, authController.logout);

// GET /api/auth/me
router.get('/me', requireAuth, authController.getMe);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;
